import { getOauthClient } from "@/oAuth2Client.js";
import {
    ensureMusicDirectory,
    getMusicSubDirs,
    MUSIC_DIR,
    processPlaylist,
} from "@/util/SyncUtil.js";
import { getFormattedPlaylists } from "@/util/Youtube.js";
import { google } from "googleapis";
import path from "node:path";
import prompts from "prompts";
import { readStatusFile, vidIdsType } from "@/util/StatusFile.js";
import { DownloadOption, Flags } from "@/types/Flags.js";
import { sanitizeString } from "@/util/sanitizeString.js";

export async function syncCommand(flags: Flags, ...args: string[]) {
    const client = await getOauthClient();

    const service = google.youtube({
        version: "v3",
        auth: client,
    });

    // flags
    const { force, format, verbose } = flags;
    const dryRun = flags["dry-run"];

    console.log("Getting Playlists...");
    const playlists = await getFormattedPlaylists(service);

    if (!playlists) throw new Error("failed to fetch playlists");

    let playlistIds: string[] = [];
    // if the user inputted any additional args (user knows what he's doing😉)
    // then don't prompt the user and automatically sync stuff.
    if (args.length === 0) {
        const temp = await prompts([
            {
                type: "autocompleteMultiselect",
                name: "playlistIds",
                message: "What Playlist(s) do you want to sync ?",
                choices: playlists?.map((pl) => {
                    return { title: pl.title, value: pl.id };
                }),
            },
        ]);
        playlistIds = temp.playlistIds;
    } else {
        // automatically get playlists that the user wrote.
        for (let i = 0; i < args.length; i++) {
            const userPlaylistTitle = sanitizeString(
                args[i].toLowerCase().trim()
            );

            const chosenOne = playlists.find(
                (pl) =>
                    sanitizeString(pl.title.toLocaleLowerCase()) ===
                    userPlaylistTitle
            );

            if (!chosenOne)
                console.log("❌ Can't find Playlist with Name", args[i]);
            else {
                playlistIds.push(chosenOne.id);
            }
        }
    }
    if (force) {
        const res = await prompts({
            type: "confirm",
            name: "force",
            message:
                "🚨🚨 Force enabled 🚨🚨, Are you sure you want to force download everything?",
        });
        if (res.force === false) {
            return;
        }
    }
    await ensureMusicDirectory();

    for (const id of playlistIds) {
        const playlist = playlists.find((pl) => pl.id === id);

        if (!playlist)
            throw new Error("something that i can't explain happened lol");

        const PLAYLIST_NAME = sanitizeString(playlist.title);
        const dirs = await getMusicSubDirs();
        let localVidIds: vidIdsType[] = [];
        if (dirs.includes(PLAYLIST_NAME)) {
            const obj = await readStatusFile(
                path.join(MUSIC_DIR, PLAYLIST_NAME)
            );

            localVidIds = obj.vidIds;
        }

        const p = path.join(MUSIC_DIR, PLAYLIST_NAME);

        if (dryRun) console.log("📜 DRY RUN 📜");
        console.log(`✨ Starting Playlist: ${playlist.title}\n`);

        // simulate forcing to download all songs again by making localvidids = []
        if (force) {
            console.log("🚨 Force Enabled 🚨");
            localVidIds = [];
        }
        const downloadOptions: DownloadOption = {
            format,
            verbose,
            dryRun,
        };
        await processPlaylist(service, id, p, downloadOptions, localVidIds);
    }
}
