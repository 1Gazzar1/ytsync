import { argv } from "node:process";
import { initCommand } from "@/commands/initCommand.js";
import { syncCommand } from "@/commands/syncCommand.js";
import { CommandFunc } from "@/types/CommandFunc.js";
import { refreshTokenMiddleWare } from "@/middleware/authMiddleware.js";

const args = argv.slice(2);
console.log(args);
const commandReg: Record<string, CommandFunc> = {
    help: helpCommand,
    init: initCommand,
    sync: refreshTokenMiddleWare<typeof syncCommand>(syncCommand),
};
function helpCommand() {
    console.log(
        "\n-help:\tYou already got there, Good Job 😀.",
        "\n-init:\tYou need to do the 'init' command first and get your CLIENT_ID,CLIENT_SECRET From google,\n\tThen continue with google for your authentication to get your access and refresh tokens.",
        "\n-sync:\tYou can use the sync command to show your playlists and chose what to sync."
    );
}


function main() {
    if (args.length === 0) {
        console.log("try help");
        return;
    }
    if (!(args[0] in commandReg)) {
        console.log("UNKNOWN COMMAND");
        return;
    }
    try {
        commandReg[args[0]](args.slice(1));
    } catch (error) {
        console.error(error);
    }
}
main();
