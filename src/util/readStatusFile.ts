import * as fs from "fs/promises";
import path from "path";

export type statusFileType = { playlistId: string; vidIds: string[] };

export async function readStatusFile(
    directoryPath: string
): Promise<statusFileType> {
    let returns: statusFileType;
    try {
        const buffer = await fs.readFile(
            path.join(directoryPath, "status.json")
        );
        const txt = buffer.toString();
        returns = JSON.parse(txt);
    } catch {
        console.log("status file doesn't exists\nwill create an empty one.");
        returns = { playlistId: "", vidIds: [] };
    }
    return returns;
}
