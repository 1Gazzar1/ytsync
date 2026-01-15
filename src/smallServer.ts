import express, { ErrorRequestHandler } from "express";
import { config } from "dotenv";
import { getOauthClient } from "@/oAuth2Client.js";
import { modifyConfig } from "@/util/initConfig.js";

config();

const app = express();
const PORT = 5000;

app.get("/callback", async (req, res) => {
    const { code } = req.query;
    const client = await getOauthClient();
    const { tokens } = await client.getToken(code as string);
    if (!tokens.access_token || !tokens.refresh_token)
        throw new Error("Google is Weird 🥲");
    const MANUAL = process.env.MANUAL as "false" | "true";

    if (MANUAL === "false") {
        await modifyConfig({
            refresh_token: tokens.refresh_token,
            access_token: tokens.access_token,
        });
        res.send(
            "<h1>That's it 💯</h1> <h2> You Can go back to the terminal now!</h2> "
        );
    }
    res.send(HTML(tokens));
});

const HTML = (tokens: any) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your API Tokens</title>
    <style>
        :root {
    /* Vibrant accent derived from the background */
    --primary: #e63946; 
    --primary-hover: #ff4d5a;
    
    /* Sleek background gradient */
    --bg-gradient: linear-gradient(135deg, #450a0a 0%, #2d062e 100%);
    
    /* Text colors for better readability */
    --text-main: #ffffff;
    --text-muted: #d1d1d1;
    
    /* Glassmorphism effect colors */
    --glass-bg: rgba(255, 255, 255, 0.05);
    --glass-border: rgba(255, 255, 255, 0.1);
}

body {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    background: var(--bg-gradient);
    background-attachment: fixed;
    display: flex;
    flex-direction: column;
    gap: 20px;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    padding: 20px;
    box-sizing: border-box;
    color: var(--text-main);
}

.copy-box {
    background-color: rgba(20, 20, 20, 0.8);
    backdrop-filter: blur(12px); /* Blurred glass effect */
    padding: 32px;
    border-radius: 24px;
    border: 1px solid var(--glass-border);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    text-align: center;
    width: 100%;
    max-width: 400px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.copy-box:hover {
    transform: translateY(-5px);
    border-color: rgba(230, 57, 70, 0.3);
}

h2 {
    margin-top: 0;
    font-size: 0.85rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-weight: 700;
}

.copy-text {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 16px;
    border-radius: 12px;
    margin: 20px 0;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.95rem;
    word-break: break-all;
    color: #ffb3b8; /* Light pinkish tint for code readability */
    border: 1px solid var(--glass-border);
    text-align: left;
}

button {
    background-color: var(--primary);
    color: #ffffff;
    padding: 14px 24px;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    box-shadow: 0 4px 15px rgba(230, 57, 70, 0.3);
}

button:hover {
    background-color: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(230, 57, 70, 0.4);
}

button:active {
    transform: scale(0.97);
}

.copied-msg {
    color: #4ade80; /* Vibrant green */
    font-size: 0.85rem;
    margin-top: 16px;
    font-weight: 600;
    opacity: 0;
    transition: opacity 0.3s;
}

.show-msg {
    opacity: 1;
}
    </style>
</head>

<body>

    <div class="copy-box">
        <h2>Refresh Token</h2>
        <p class="copy-text">${tokens.refresh_token}</p>
        <button onclick="copyText(this)">Copy Refresh Token</button>
        <div class="copied-msg">Copied to clipboard!</div>
    </div>

    <div class="copy-box">
        <h2>Access Token</h2>
        <p class="copy-text">${tokens.access_token}</p>
        <button onclick="copyText(this)">Copy Access Token</button>
        <div class="copied-msg">Copied to clipboard!</div>
    </div>

    <script>
        async function copyText(buttonElement) {
            // Find the text and message relative to the clicked button
            const container = buttonElement.parentElement;
            const textToCopy = container.querySelector(".copy-text").textContent.trim();
            const msg = container.querySelector(".copied-msg");

            try {
                await navigator.clipboard.writeText(textToCopy);
                
                // Show success message
                msg.classList.add("show-msg");
                buttonElement.textContent = "Copied!";
                
                setTimeout(() => {
                    msg.classList.remove("show-msg");
                    buttonElement.textContent = "Copy Text";
                }, 2000);
            } catch (err) {
                console.error("Failed to copy: ", err);
                alert("Failed to copy text.");
            }
        }
    </script>
</body>
</html>`;

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    res.status(500).send(err.message || "INTERNAL ERROR");
};

app.use(errorHandler);
