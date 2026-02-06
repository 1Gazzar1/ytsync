import type { Playlist } from "@/types/Playlist.js";
import type { youtube_v3 } from "googleapis";

export type VidInfo = [vidId: string, vidTitle: string];
export async function getVideoInfos(
    service: youtube_v3.Youtube,
    playlistId: string,
) {
    let allItems = [];
    let _nextPageToken: string | undefined | null;
    /* returns a hash map (vidId , vidTitle) */
    do {
        const videos = await service.playlistItems.list({
            playlistId: playlistId,
            part: ["snippet", "status"],
            maxResults: 500,
            pageToken: _nextPageToken || undefined,
        });
        // console.log(videos.data.items);
        // youtube always returns 50 results even if you specify more
        // but it returns a token to use to get the next page (such a weird way to do it?)
        _nextPageToken = videos.data.nextPageToken;

        const vidsInfo = videos.data.items?.map((vid) => {
            if (
                vid.status?.privacyStatus === "public" &&
                vid.snippet?.resourceId?.videoId &&
                vid.snippet?.title
            ) {
                // console.log(vid.snippet.title, vid.status.privacyStatus);

                const out: VidInfo = [
                    vid.snippet.resourceId.videoId,
                    vid.snippet.title,
                ];
                return out;
            }
        });

        if (!vidsInfo) throw new Error("failed to fetch Videos");

        const final = vidsInfo.filter((tuple) => !!tuple);
        allItems.push(...final);
    } while (_nextPageToken);
    const hashMap = new Map<string, string>(allItems);
    return hashMap;
}

export async function getFormattedPlaylists(service: youtube_v3.Youtube) {
    const playlists = await service.playlists.list({
        part: ["snippet", "contentDetails"],
        mine: true,
        maxResults: 100,
    });
    if (!playlists.data.items) throw new Error("failed to fetch playlists");
    const playlistObjs = playlists.data.items
        .map((pl) => {
            if (
                !pl.id ||
                !pl.snippet ||
                !pl.snippet.thumbnails ||
                !pl.contentDetails
            )
                return;
            const playlist: Playlist = {
                id: pl.id,
                url: `https://www.youtube.com/playlist?list=${pl.id}`,
                title: pl.snippet.title ?? "",
                description: pl.snippet.description ?? "",
                publishedAt: new Date(pl.snippet.publishedAt ?? ""),
                numOfVids: pl.contentDetails.itemCount ?? 0,
                thumbnailUrl: pl.snippet.thumbnails.maxres?.url ?? "",
            };
            return playlist;
        })
        .filter((pl) => pl !== undefined);

    // sort the playlists
    return playlistObjs.sort((a, b) => a.title.localeCompare(b.title));
}
