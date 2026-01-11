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
import * as fs from "node:fs/promises";

export async function syncCommand(args: string[]) {
    const client = await getOauthClient();

    const service = google.youtube({
        version: "v3",
        auth: client,
    });
    console.log("Getting Playlists...");
    const playlists = await getFormattedPlaylists(service);

    if (!playlists) throw new Error("failed to fetch playlists");

    const { playlistIds } = await prompts([
        {
            type: "multiselect",
            name: "playlistIds",
            message: "What Playlist(s) do you want to sync ?",
            choices: playlists?.map((pl) => {
                return { title: pl.title, value: pl.id };
            }),
        },
    ]);
    await ensureMusicDirectory();

    for (const id of playlistIds) {
        const playlist = playlists.find((pl) => pl.id === id);

        if (!playlist)
            throw new Error("something that i can't explain happened lol");

        const dirs = await getMusicSubDirs();
        let localVidIds;
        if (dirs.includes(playlist.title)) {
            const txt = (
                await fs.readFile(
                    path.join(MUSIC_DIR, playlist.title, "status.json")
                )
            ).toString();
            const obj: { playlistId: string; vidIds: string[] } =
                JSON.parse(txt);
            localVidIds = obj.vidIds;
        }

        const p = path.join(MUSIC_DIR, playlist.title);

        await downloadPlaylist(service, id, p, localVidIds);
        console.log(
            `✅ Finished Playlist with Name: ${playlist.title} ,Id: ${playlist.id}`
        );
    }
}
