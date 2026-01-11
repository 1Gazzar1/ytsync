import { argv } from "node:process";
import { initCommand } from "@/commands/initCommand.js";
import { syncCommand } from "@/commands/syncCommand.js";
import { CommandFunc } from "@/types/CommandFunc.js";
import { refreshTokenMiddleWare } from "@/middleware/authMiddleware.js";

import { parseArgs } from "node:util";
import { statusCommand } from "@/commands/statusCommand.js";

const { values, positionals } = parseArgs({
    args: argv.slice(2),
    options: {},
    allowPositionals: true,
});
export const flags = values;

const commandReg: Record<string, CommandFunc> = {
    help: helpCommand,
    init: initCommand,
    sync: refreshTokenMiddleWare<typeof syncCommand>(syncCommand),
    status: refreshTokenMiddleWare(statusCommand),
};
function helpCommand() {
    console.log(
        "\n-help:\tYou already got there, Good Job 😀.",
        "\n-init:\tYou need to do the 'init' command first and get your CLIENT_ID,CLIENT_SECRET From google,\n\tThen continue with google for your authentication to get your access and refresh tokens.",
        "\n-sync:\tYou can use the sync command to show your playlists and chose what to sync.",
        "\n-status:\tYou use the status command to check if your local music needs to be synced or not."
    );
}

function main() {
    if (positionals.length === 0) {
        console.log("try to type 'ytsync help'");
        return;
    }
    if (!(positionals[0] in commandReg)) {
        console.log("UNKNOWN COMMAND");
        return;
    }
    try {
        commandReg[positionals[0]](positionals.slice(1));
    } catch (error) {
        console.error(error);
    }
}
main();
