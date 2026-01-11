import * as fs from "fs/promises";
import path from "path";

export type statusFileType = { playlistId: string; vidIds: string[] };

export async function readStatusFile(
    directoryPath: string
): Promise<statusFileType> {
    const txt = (
        await fs.readFile(path.join(directoryPath, "status.json"))
    ).toString();
    const obj: { playlistId: string; vidIds: string[] } = JSON.parse(txt);
    return obj;
}
