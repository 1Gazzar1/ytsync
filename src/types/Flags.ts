import { AudioFormats } from "@/types/SongName.js";

export type Flags = {
    format: AudioFormats;
    "dry-run": boolean;
    verbose: boolean;
    force: boolean;
    manual: boolean;
};

export type DownloadOption = Omit<Flags, "dry-run" | "force" | "manual"> & {
    dryRun: boolean;
};
