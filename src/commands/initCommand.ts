import { spawn } from "node:child_process";
import prompts from "prompts";
import { modifyConfig } from "@/util/initConfig.js";
import { getOauthClient, SCOPES } from "@/oAuth2Client.js";
import { Flags } from "@/types/Flags.js";

export async function initCommand(flags: Flags) {
    console.log("initializing...");

    const { manual } = flags;
    // run the small express server to get the tokens from google
    // simulate a promise to wait 5s for the server to init.
    // ask the user to give the client id and secret while it's starting.
    const server = spawn("node", ["./dist/smallServer.js"], {
        env: { ...process.env, MANUAL: manual.toString() },
        cwd: "./",
    });

    const { CLIENT_ID, CLIENT_SECRET } = await prompts([
        {
            type: "text",
            name: "CLIENT_ID",
            message: "Enter your Client ID: ",
        },
        {
            type: "password",
            name: "CLIENT_SECRET",
            message: "Enter your Client Secret: ",
        },
    ]);

    // update the config.
    await modifyConfig({ CLIENT_ID, CLIENT_SECRET });

    // depends on the config
    const client = await getOauthClient();
    const url = client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
    });
    // the server will be def up by the time the user pastes client id & secret
    // and signs in with google.
    console.log(`Go here to continue with Google: ${url}`);
    console.log(`\n\nWhen done, paste the following:`);

    if (manual) {
        const { refresh_token, access_token } = await prompts([
            {
                type: "text",
                name: "refresh_token",
                message: "refresh token: ",
            },
            {
                type: "text",
                name: "access_token",
                message: "access token: ",
            },
        ]);

        await modifyConfig({ refresh_token, access_token });
    } else {
        await prompts({
            type: "confirm",
            name: "confirm",
            message: "press y when you're done.",
        });
    }
    console.log("All Done ✅✅\nGood Job👍");
    server.kill("SIGTERM");
}
