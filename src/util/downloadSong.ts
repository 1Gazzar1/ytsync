import { SongName } from "@/types/SongName.js";
import { exec } from "child_process";
import { promisify } from "node:util";

export type ytDlp_Options = {
    verbose: boolean;
    songName: SongName;
};

const execAsync = promisify(exec);

export async function downloadSong(
    id: string,
    path: string,
    options: ytDlp_Options
) {
    const url = `https://www.youtube.com/watch?v=${id}`;
    const { verbose, songName } = options;

    const isQuiet = verbose ? "" : "--quiet";
    await execAsync(
        `yt-dlp -x --audio-format ${songName.format} ${isQuiet} --add-metadata --embed-thumbnail -o "${songName.title}.${songName.format}" -P "${path}" "${url}"`
    );
}
