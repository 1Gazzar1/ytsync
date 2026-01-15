import * as fs from "fs/promises";
import path from "path";

export type StatusFileType = { playlistId: string; vidIds: vidIdsType[] };
export type vidIdsType = { id: string; title: string };

export async function readStatusFile(
    directoryPath: string
): Promise<StatusFileType> {
    let returns: StatusFileType;
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

export async function createStatusFile(
    directoryPath: string,
    file: StatusFileType
) {
    const json = JSON.stringify(file, null, 2);
    const p = path.join(directoryPath, "status.json");
    await fs.writeFile(p, json);
}
