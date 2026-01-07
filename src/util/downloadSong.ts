import { exec } from "child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function downloadSong(id: string, path: string) {
    console.log("processing song:", id);
    const url = `https://www.youtube.com/watch?v=${id}`;
    await execAsync(
        `yt-dlp -x --audio-format mp3 --quiet --add-metadata  --embed-thumbnail -o "%(title)s.%(ext)s" -P ${path} "${url}"`
    );
}
