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

        const { added, removed, sameCount } = diffPlaylists(
            localPlaylist.vidIds,
            remotePlaylist.vidIds
        );

        const chosenOne = remotePlaylists.find(
            (pl) => pl.id === remotePlaylist.playlistId
        );
        if (sameCount) {
            console.log(`'${chosenOne?.title}' is Up to Date! 😇\n`);
        } else {
            if (added.length) {
                console.log(
                    `🔃 There's ${added.length} songs in '${chosenOne?.title}' that need updating.\n`
                );
            }
            //edge cases bruh.
            if (removed.length) {
                // user is trolling fr.
                console.log(
                    `Your local playlist(${chosenOne?.title}) is ahead of youtube's lol.\n`
                );
            }
        }
    }
}
function diffPlaylists(local: string[], remote: string[]) {
    const localSet = new Set(local);
    const remoteSet = new Set(remote);

    const added = remote.filter((id) => !localSet.has(id));
    const removed = local.filter((id) => !remoteSet.has(id));

    return {
        added, // download these
        removed, // optionally delete
        sameCount:
            local.length === remote.length &&
            added.length === 0 &&
            removed.length === 0,
    };
}
