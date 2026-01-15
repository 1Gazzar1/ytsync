import * as fs from "node:fs/promises";
import { downloadSong, ytDlp_Options } from "@/util/downloadSong.js";
import path from "node:path";
import { youtube_v3 } from "googleapis";
import { getVideoInfos } from "@/util/Youtube.js";
import type { SongName } from "@/types/SongName.js";
import { HOME } from "@/util/initConfig.js";
import { DownloadOption } from "@/types/Flags.js";
import {
    createStatusFile,
    vidIdsType,
    type StatusFileType,
} from "./StatusFile.js";
import { diffPlaylists } from "@/commands/statusCommand.js";
import { sanitizeString } from "@/util/sanitizeString.js";

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
    localVidIdsObj?: vidIdsType[]
) {
    const vidInfos = await getVideoInfos(service, playlistId);
    let vidIdsThatActuallySucceeded: vidIdsType[] = [];
    const { verbose, format, dryRun } = options;

    // skip if user already has it
    localVidIdsObj = localVidIdsObj || [];
    const localVidIds = localVidIdsObj.map((obj) => obj.id);

    const vidsToBeDownloadedInfo = [
        ...vidInfos.entries().filter((v) => !localVidIds.includes(v[0])),
    ];

    const remoteIds = vidInfos.keys();
    const { removed, added } = diffPlaylists(localVidIds, [...remoteIds]);

    if (dryRun) {
        const total = vidInfos.size;
        const alreadyHas = localVidIds.length;
        console.log(
            `\t📊 Total Songs: ${total}\n\t✅ Already have: ${alreadyHas} ${
                alreadyHas === 0 ? "(new playlist)" : ""
            }\n\t⬇️  Would Download: ${
                vidsToBeDownloadedInfo.length
            }\n\t🗑️  Would Delete: ${removed.length}`
        );
        if (added.length > 0) {
            console.log("🎵 New songs:");
            vidsToBeDownloadedInfo.forEach((v, idx) => {
                console.log(`\t${idx + 1}. ${v[1]}`);
            });
        }
        if (removed.length > 0) {
            console.log("🔴 Deleted songs:");
            removed.forEach((id, idx) => {
                console.log(
                    `\t${idx + 1}. ${
                        localVidIdsObj.find((v) => v.id === id)?.title
                    } ❌`
                );
            });
        }
    }
    // skip everything else if it's a dry run
    if (dryRun) return;

    // do it sequentially (we're bottle necked by the internet speed anyways )
    const time = Date.now();
    for (let i = 0; i < vidsToBeDownloadedInfo.length; i++) {
        const info = vidsToBeDownloadedInfo[i];

        // init the song name by Sanitizing the name, format then passing it to yt-dlp
        const songName: SongName = {
            title: sanitizeString(info[1]),
            format,
        };
        const ytDlpOptions: ytDlp_Options = { verbose, songName };

        console.log(
            `🔃 No. ${i + 1} of ${
                vidsToBeDownloadedInfo.length
            } - Downloading: ${songName.title}`
        );

        //error handling if yt-dlp crashes and ruins everything.
        try {
            await downloadSong(info[0], p, ytDlpOptions);
            vidIdsThatActuallySucceeded.push({
                id: info[0],
                title: `${info[1]}.${format}`,
            });
            console.log(`✅ ${songName.title} Downloaded Successfully 🎵\n`);
        } catch (error) {
            console.log(`❌ ${songName.title} Failed Unsuccessfully 🥲\n`);
        }
    }

    const now = Date.now();
    const secs = Math.round((now - time) / 1000); // in seconds

    if (added.length === 0 && removed.length === 0) {
        console.log("Already Up to date! 😇\n\n");
    } else {
        const timeSpent = `${Math.floor(secs / 60)
            .toString()
            .padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;
        console.log(`☑️  Finished Playlist in ${timeSpent} mins\n\n`);
    }

    // Look for diffs between playlists
    // if the user deleted a song from youtube
    // delete it locally too.

    for (const id of removed) {
        const songTitle = localVidIdsObj.find((v) => v.id === id)?.title;
        const _p = path.join(p, songTitle!);
        await fs.rm(_p);
        console.log(`🗑️  Deleted ${songTitle}`);
    }

    // make a status.json file to track vid ids
    const status: StatusFileType = {
        playlistId,
        // local + vids that succeed - vids removed
        vidIds: [...localVidIdsObj, ...vidIdsThatActuallySucceeded].filter(
            (obj) => !removed.includes(obj.id)
        ),
    };

    // write the status file
    await createStatusFile(p, status);
}
