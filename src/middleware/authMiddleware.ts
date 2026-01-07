import { getOauthClient } from "@/oAuth2Client.js";
import { modifyConfig } from "@/util/initConfig.js";

const client = await getOauthClient();
export function refreshTokenMiddleWare<
    T extends (...args: any) => Promise<void>
>(fn: T): T {
    let retires = 2;
    return (async (...args: any): Promise<void> => {
        try {
            await fn(...args);
        } catch (error: any) {
            console.log(error);
            if (error.response.status === 401 && retires > 0) {
                const tokens = await client.refreshAccessToken();

                await modifyConfig({
                    access_token: tokens.credentials.access_token!,
                });
                retires -= 1;
                await fn(...args);
            }

            throw error;
        }
    }) as T;
}
