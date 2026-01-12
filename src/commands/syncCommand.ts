import { getOauthClient } from "@/oAuth2Client.js";
import {
    downloadPlaylist,
    ensureMusicDirectory,
    getMusicSubDirs,
    MUSIC_DIR,
} from "@/util/SyncUtil.js";
import { getFormattedPlaylists } from "@/util/Youtube.js";
import { google } from "googleapis";
import path from "node:path";
import prompts from "prompts";
import { readStatusFile } from "@/util/readStatusFile.js";

export async function syncCommand(
    flags: Record<string, any>,
    ...args: string[]
) {
    const client = await getOauthClient();

    const service = google.youtube({
        version: "v3",
        auth: client,
    });
    console.log("Getting Playlists...");
    const playlists = await getFormattedPlaylists(service);

    if (!playlists) throw new Error("failed to fetch playlists");

    let playlistIds: string[];
    // if the user inputted any additional args (user knows what he's doing😉)
    // then don't prompt the user and automatically sync stuff.
    if (args.length === 0) {
        const temp = await prompts([
            {
                type: "multiselect",
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
        const lowerCaseArgs = args.map((arg) => arg.toLowerCase());
        playlistIds = playlists
            .filter((pl) => lowerCaseArgs.includes(pl.title.toLowerCase()))
            .map((pl) => pl.id);
    }
    await ensureMusicDirectory();

    for (const id of playlistIds) {
        const playlist = playlists.find((pl) => pl.id === id);

        if (!playlist)
            throw new Error("something that i can't explain happened lol");

        const dirs = await getMusicSubDirs();
        let localVidIds;
        if (dirs.includes(playlist.title)) {
            const obj = await readStatusFile(
                path.join(MUSIC_DIR, playlist.title)
            );
            localVidIds = obj.vidIds;
        }

        const p = path.join(MUSIC_DIR, playlist.title);

        console.log(`✨ Starting Playlist: ${playlist.title}\n`);
        await downloadPlaylist(service, id, p, localVidIds);
    }
}
