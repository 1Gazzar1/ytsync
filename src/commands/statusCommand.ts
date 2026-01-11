import { getOauthClient } from "@/oAuth2Client.js";
import { readStatusFile, statusFileType } from "@/util/readStatusFile.js";
import { getMusicSubDirs, MUSIC_DIR } from "@/util/SyncUtil.js";
import { getFormattedPlaylists, getVideoInfos } from "@/util/Youtube.js";
import { google } from "googleapis";
import path from "node:path";

// type PlaylistCompareType = { playlistId: string; numOfVids: number };
// type PlaylistCompareList = PlaylistCompareType[];
export async function statusCommand(...args: any[]) {
    const dirs = await getMusicSubDirs();

    if (dirs.length === 0) console.log("bro sync something first lol.");

    const client = await getOauthClient();
    const service = google.youtube({
        version: "v3",
        auth: client,
    });
    // get all the local playlist ids
    let localPlaylistInfo: statusFileType[] = [];
    let localPlaylistIds = [];
    for (const dir of dirs) {
        const p = path.join(MUSIC_DIR, dir);
        const { playlistId, vidIds } = await readStatusFile(p);
        localPlaylistInfo.push({ playlistId, vidIds });
        localPlaylistIds.push(playlistId);
    }

    // get the remote playlist ids
    const remotePlaylists = (await getFormattedPlaylists(service)).filter(
        (pl) => localPlaylistIds.includes(pl.id)
    );
    // parallel requests
    const remotePlaylistIds = await Promise.all(
        remotePlaylists.map(async (pl): Promise<statusFileType> => {
            const vidIds = (await getVideoInfos(service, pl.id)).map(
                (vid) => vid[0]
            );
            return { playlistId: pl.id, vidIds };
        })
    );

    // then compare both and get the difference.
    for (let i = 0; i < localPlaylistInfo.length; i++) {
        const localPlaylist = localPlaylistInfo[i];
        const playlistId = localPlaylist.playlistId;

        const remotePlaylist = remotePlaylistIds.find(
            (pl) => pl.playlistId === playlistId
        );
        if (!remotePlaylist)
            throw new Error(
                "i think you changed a playlist name or something, make sure remote and local have the same name"
            );

        const arr1 = localPlaylist.vidIds.sort();
        const arr2 = remotePlaylist.vidIds.sort();

        // knowing EXACTLY what's different is slow right ?
        const noDiff =
            arr1.length === arr2.length &&
            arr1.every((val, idx) => val === arr2[idx]);

        const chosenOne = remotePlaylists.find(
            (pl) => pl.id === remotePlaylist.playlistId
        );
        if (noDiff) {
            console.log(`${chosenOne?.title} is Up to Date! 😇\n`);
            continue;
        }
        if (arr1.length < arr2.length) {
            console.log(
                `🔃 There's ${arr2.length - arr1.length} songs in ${
                    chosenOne?.title
                } that need updating.\n`
            );
        }
        //edge cases bruh.
        if (arr1.length > arr2.length) {
            // user is trolling fr.
            console.log(
                `Your local playlist(${chosenOne?.title}) is ahead of youtube's lol.\n`
            );
        }
    }
}
