import type { Playlist } from "@/types/Playlist.js";
import type { youtube_v3 } from "googleapis";

export async function getVideoIds(
    service: youtube_v3.Youtube,
    playlistId: string
) {
    const videos = await service.playlistItems.list({
        playlistId: playlistId,
        part: ["snippet", "status"],
        maxResults: 500,
    });
    return videos.data.items
        ?.map((vid) => {
            if (vid.status?.privacyStatus === "public")
                return vid.snippet?.resourceId?.videoId;
        })
        .filter((id) => id !== undefined && id !== null);
}

export async function getFormattedPlaylists(service: youtube_v3.Youtube) {
    const playlists = await service.playlists.list({
        part: ["snippet", "contentDetails"],
        mine: true,
        maxResults: 100,
    });
    const playlistObjs = playlists.data.items
        ?.map((pl) => {
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

    return playlistObjs;
}
