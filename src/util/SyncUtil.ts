import * as fs from "node:fs/promises";
import { downloadSong, ytDlp_Options } from "@/util/downloadSong.js";
import path from "node:path";
import { youtube_v3 } from "googleapis";
import { getVideoInfos } from "@/util/Youtube.js";
import type { SongName } from "@/types/SongName.js";
import { HOME } from "@/util/initConfig.js";
import { DownloadOption } from "@/types/Flags.js";

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

    const dirs = [];
    for (const dir of allFiles) {
        const p = path.join(MUSIC_DIR, dir);
        if ((await fs.stat(p)).isDirectory()) {
            dirs.push(dir);
        }
    }
    return dirs;
}

export async function processPlaylist(
    service: youtube_v3.Youtube,
    playlistId: string,
    p: string,
    options: DownloadOption,
    localVidIds?: string[]
) {
    const vidInfos = await getVideoInfos(service, playlistId);

    const { verbose, format, dryRun } = options;

    // skip if user already has it

    localVidIds = localVidIds || [];
    const vidsToBeDownloadedInfo = vidInfos.filter(
        (v) => !localVidIds.includes(v[0])
    );

    if (dryRun) {
        const total = vidInfos.length;
        const alreadyHas = localVidIds.length;
        const toAdd = vidsToBeDownloadedInfo.length;
        console.log(`\t📊 Total Songs: ${total}\n\t✅ Already have: ${alreadyHas} ${alreadyHas === 0 ? "(new playlist)" : ""}\n\t⬇️  Would Download: ${vidsToBeDownloadedInfo.length} `);
        if (toAdd > 0) {
            console.log("🎵 New songs:");
        }
    }
    // do it sequentially (we're bottle necked by the internet speed anyways )
    const time = Date.now();
    for (let i = 0; i < vidsToBeDownloadedInfo.length; i++) {
        const info = vidsToBeDownloadedInfo[i];

        if (dryRun) {
            console.log(`\t${i+1}. ${info[1]}`);
            continue;
        }

        // init the song name by Sanitizing the name, format then passing it to yt-dlp
        const songName: SongName = {
            title: info[1].replace(/[<>:"/\\|?*]/g, "_"),
            format,
        };

        console.log(
            `🔃 No. ${i + 1} of ${
                vidsToBeDownloadedInfo.length
            } - Downloading: ${songName.title}`
        );

        const ytDlpOptions: ytDlp_Options = { verbose, songName };
        await downloadSong(info[0], p, ytDlpOptions);

        console.log(`✅ ${songName.title} Downloaded Successfully 🎵\n`);
    }
    // skip everything else if it's a dry run
    if (dryRun) return;

    const now = Date.now();
    const secs = Math.round((now - time) / 1000); // in seconds

    if (vidsToBeDownloadedInfo.length === 0) {
        console.log("Already Up to date! 😇\n\n");
    } else {
        const timeSpent = `${Math.floor(secs / 60)
            .toString()
            .padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;
        console.log(`☑️  Finished Playlist in ${timeSpent} mins\n\n`);
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
