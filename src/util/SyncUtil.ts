import * as fs from "node:fs/promises";
import { downloadSong } from "@/util/downloadSong.js";
import path from "node:path";
import { youtube_v3 } from "googleapis";
import { getVideoInfos } from "@/util/Youtube.js";
import type { AudioFormats, SongName } from "@/types/SongName.js";
import { HOME } from "@/util/initConfig.js";

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
    localVidIds?: string[],
    format: AudioFormats = "mp3"
) {
    const vidInfos = await getVideoInfos(service, playlistId);

    // skip if user already has it
    const vidsToBeDownloadedInfo = vidInfos.filter(
        (vid) => !!(localVidIds && !localVidIds.includes(vid[0]))
    );

    // do it sequentially (we're bottle necked by the internet speed anyways )
    for (let i = 0; i < vidsToBeDownloadedInfo.length; i++) {
        const info = vidsToBeDownloadedInfo[i];

        // init the song name by Sanitizing the name, format then passing it to yt-dlp
        const songName: SongName = {
            title: info[1].replace(/[<>:"/\\|?*]/g, "_"),
            format: format,
        };

        console.log(
            `🔃 No. ${i + 1} of ${vidsToBeDownloadedInfo.length} Downloading: ${
                songName.title
            } ,`
        );
        await downloadSong(info[0], p, songName);
        console.log(`✅ ${songName.title} Downloaded Successfully 🎵`);
    }

    // make a status.json file to track vid ids
    const vidIds = vidInfos.map((t) => t[0]);

    const status = {
        playlistId,
        vidIds,
    };
    await fs.writeFile(
        path.join(p, "status.json"),
        JSON.stringify(status, null, 2)
    );
}
