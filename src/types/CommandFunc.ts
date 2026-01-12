export type CommandFunc = (
    flags: Record<string, any>,
    ...args: string[]
) => Promise<void> | void;
