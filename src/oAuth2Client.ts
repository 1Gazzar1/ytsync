import { readConfig } from "@/util/initConfig.js";
import { google } from "googleapis";

export async function getOauthClient() {
    const { CLIENT_ID, CLIENT_SECRET } = await readConfig();
    if (!CLIENT_ID || !CLIENT_SECRET)
        throw new Error("You must pass valid CLIENT_ID and CLIENT_SECRET");

    const client = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        "http://localhost:5000/callback"
    );
    const { access_token, refresh_token } = await readConfig();

    if (access_token && refresh_token)
        client.setCredentials({ access_token, refresh_token });

    return client;
}
export const SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
];
