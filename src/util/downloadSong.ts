import { SongName } from "@/types/SongName.js";
import { exec } from "child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function downloadSong(
    id: string,
    path: string,
    songName: SongName
) {
    const url = `https://www.youtube.com/watch?v=${id}`;
    await execAsync(
        `yt-dlp -x --audio-format ${songName.format} --quiet --add-metadata --embed-thumbnail -o "${songName.title}.${songName.format}" -P "${path}" "${url}"`
    );
}
