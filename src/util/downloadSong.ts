import { SongName } from "@/types/SongName.js";
import { spawn } from "node:child_process";
import which from "which";
export type ytDlp_Options = {
    verbose: boolean;
    songName: SongName;
};

export async function downloadSong(
    id: string,
    path: string,
    options: ytDlp_Options,
) {
    const url = `https://www.youtube.com/watch?v=${id}`;
    const { verbose, songName } = options;
    const ytDlpPath = await which("yt-dlp");

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
    if (!verbose) {
        args.push("--quiet");
    }

    const runProcess = () => {
        return new Promise((resolve, reject) => {
            const child = spawn(ytDlpPath, args);

            // Accumulate stderr logs in case of failure
            let errorOutput = "";

            child.stdout.on("data", (data: Buffer) => {
                console.log(data.toString("utf-8"));
            });

            child.stderr.on("data", (data: Buffer) => {
                const errorStr = data.toString("utf-8");
                errorOutput += errorStr;
                console.error(`[yt-dlp stderr]: ${errorStr}`);
            });

            child.on("close", (code) => {
                if (code === 0) {
                    resolve("");
                } else {
                    // Pass the actual stderr message to the reject block
                    reject(
                        new Error(
                            `Process exited with code ${code}. Error: ${errorOutput.trim()}`,
                        ),
                    );
                }
            });

            child.on("error", (err) => {
                reject(err);
            });
        });
    };
    await runProcess();
}
