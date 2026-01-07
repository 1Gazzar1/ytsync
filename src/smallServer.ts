import express, { ErrorRequestHandler } from "express";
import { config } from "dotenv";
import { getOauthClient } from "@/oAuth2Client.js";

config();

const app = express();
const PORT = 5000;

app.get("/callback", async (req, res) => {
    const { code } = req.query;
    const client = await getOauthClient();
    const { tokens } = await client.getToken(code as string);
    // console.log(tokens);
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your API Tokens</title>
    <style>
        :root {
            --primary: #2563eb;
            --primary-hover: #1d4ed8;
            --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --text-main: #1f2937;
            --text-muted: #6b7280;
        }

        body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: var(--bg-gradient);
            display: flex;
            flex-direction: column;
            gap: 20px;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }

        .copy-box {
            background-color: rgba(255, 255, 255, 0.95);
            padding: 24px;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            text-align: center;
            width: 100%;
            max-width: 450px;
            transition: transform 0.2s ease;
        }

        .copy-box:hover {
            transform: translateY(-2px);
        }

        h2 {
            margin-top: 0;
            font-size: 1.1rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .copy-text {
            background-color: #f3f4f6;
            padding: 12px;
            border-radius: 8px;
            margin: 16px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            word-break: break-all;
            color: var(--text-main);
            border: 1px solid #e5e7eb;
            text-align: left;
        }

        button {
            background-color: var(--primary);
            color: #ffffff;
            padding: 10px 24px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
        }

        button:hover {
            background-color: var(--primary-hover);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        button:active {
            transform: scale(0.98);
        }

        .copied-msg {
            color: #059669;
            font-size: 0.85rem;
            margin-top: 12px;
            font-weight: 500;
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
</html>
    `);
});

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    res.status(500).send(err.message || "INTERNAL ERROR");
};

app.use(errorHandler);
