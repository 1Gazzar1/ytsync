import { Config } from "@/types/Config.js";
import * as fs from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

export const HOME = homedir();
const YTSYNC = path.join(`${HOME}`, `.config`, `ytsync`);
const CONFIG_FILE = path.join(YTSYNC, "config.json");
async function ensureConfig() {
    await fs.mkdir(YTSYNC, { recursive: true });

    try {
        await fs.writeFile(CONFIG_FILE, `{}`, {
            flag: "wx",
        });
    } catch (err: any) {
        if (err.code !== "EEXIST") throw err;
    }
}
export async function modifyConfig(config: Partial<Config>) {
    await ensureConfig();
    const oldFile = await readConfig();
    const newFile = { ...oldFile, ...config };
    // console.log("updated config: ", config);
    await fs.writeFile(CONFIG_FILE, JSON.stringify(newFile, null, 2));
}

export async function readConfig() {
    await ensureConfig();

    const raw = await fs.readFile(CONFIG_FILE, "utf8");

    if (!raw.trim()) {
        const defaultConfig = {
            CLIENT_ID: "",
            CLIENT_SECRET: "",
        };
        await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
    }

    return JSON.parse(raw);
}
