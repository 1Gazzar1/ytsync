import { SongName } from "@/types/SongName.js";
import { exec } from "child_process";
import { spawn } from "node:child_process";
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
    const args = [
        "-x",
        "--audio-format",
        songName.format,
        "--add-metadata",
        "--embed-thumbnail",
        "-o",
        `${songName.title}.${songName.format}`,
        "-P",
        path,
        url,
    ];

    // Add quiet flag conditionally
    if (isQuiet) {
        args.push("--quiet"); // or whatever your isQuiet variable contains
    }

    const runProcess = () => {
        return new Promise((resolve, reject) => {
            const process = spawn("yt-dlp", args);

            process.stdout.on("data", (data: Buffer) => {
                const logs = data.toString("utf-8");
                console.log(logs);
            });
            process.on("close", (code) => {
                if (code === 0) {
                    resolve("");
                } else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });

            process.on("error", (err) => {
                reject(err);
            });
        });
    };
    await runProcess();
}
