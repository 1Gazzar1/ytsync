import { getOauthClient } from "@/oAuth2Client.js";
import { modifyConfig } from "@/util/initConfig.js";

const client = await getOauthClient();
export function refreshTokenMiddleWare<
    T extends (flags: Record<string, any>, ...args: any[]) => Promise<void>
>(fn: T): T {
    let retires = 2;
    return (async (flags, ...args): Promise<void> => {
        try {
            await fn(flags, ...args);
        } catch (error: any) {
            console.log(error);
            if (error.response.status === 401 && retires > 0) {
                const tokens = await client.refreshAccessToken();
                console.log("🗼Refreshed Tokens!");

                await modifyConfig({
                    access_token: tokens.credentials.access_token!,
                });
                retires -= 1;
                return await fn(flags, ...args);
            }

            throw error;
        }
    }) as T;
}
