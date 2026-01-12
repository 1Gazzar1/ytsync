import { Flags } from "@/types/Flags.js";

export type CommandFunc = (
    flags: Flags,
    ...args: string[]
) => Promise<void> | void;
