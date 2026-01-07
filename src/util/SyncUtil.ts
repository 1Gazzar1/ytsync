import * as fs from "node:fs/promises";
import { homedir } from "node:os";
import { downloadSong } from "@/util/downloadSong.js";
import path from "node:path";
import { youtube_v3 } from "googleapis";
import { getVideoIds } from "@/util/Youtube.js";

const HOME = homedir();
const DIR_NAME = "ytsync_Music";
export const MUSIC_DIR = path.join(HOME, DIR_NAME);

export async function ensureMusicDirectory() {
    try {
        await fs.mkdir(MUSIC_DIR, { recursive: true });
    } catch (err: any) {
        if (err.code !== "EEXIST") throw err;
    }
}

export async function getMusicSubDirs() {
    await ensureMusicDirectory();
    const allFiles = await fs.readdir(MUSIC_DIR);

    const dirs = await Promise.all(
        allFiles.filter(async (dir) => {
            const p = path.join(MUSIC_DIR, dir);
            const stats = await fs.stat(p);
            return stats.isDirectory();
        })
    );
    return dirs;
}

export async function downloadPlaylist(
    service: youtube_v3.Youtube,
    playlistId: string,
    p: string,
    localVidIds: string[] | undefined
) {
    const vidIds = await getVideoIds(service, playlistId);
    if (!vidIds) throw new Error("failed to fetch video ids");

    // do it sequentially (we're bottle necked by the internet speed anyways )
    for (const id of vidIds) {
        // skip if user already has it
        if (localVidIds && localVidIds.includes(id)) continue;

        await downloadSong(id, p);
        console.log("🎵 Finished Song with Id: ", id);
    }

    // make a status.json file to track vid ids

    const status = {
        playlistId,
        vidIds,
    };
    await fs.writeFile(
        path.join(p, "status.json"),
        JSON.stringify(status, null, 2)
    );

    console.log("✅ Finished Playlist with Id: ", playlistId);
}
