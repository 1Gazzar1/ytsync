import type { Playlist } from "@/types/Playlist.js";
import type { youtube_v3 } from "googleapis";

export type VidInfo = [vidId: string, vidTitle: string];
export async function getVideoInfos(
    service: youtube_v3.Youtube,
    playlistId: string
): Promise<VidInfo[]> {
    /* returns a list of tuples (vidId , vidTitle) */
    const videos = await service.playlistItems.list({
        playlistId: playlistId,
        part: ["snippet", "status"],
        maxResults: 500,
    });
    const vidsInfo = videos.data.items?.map((vid) => {
        if (
            vid.status?.privacyStatus === "public" &&
            vid.snippet?.resourceId?.videoId &&
            vid.snippet?.title
        ) {
            const out: VidInfo = [
                vid.snippet.resourceId.videoId,
                vid.snippet.title,
            ];
            return out;
        }
    });

    if (!vidsInfo) throw new Error("failed to fetch Videos");

    const final = vidsInfo.filter((tuple) => !!tuple);
    return final;
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
