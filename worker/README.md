# hire-relay

Sends every brief from the `hire` command on [rakibulx33.me](https://rakibulx33.me) to Telegram, alongside the email.
The bot token lives only here, as a Cloudflare secret, because anything in the website's code is public.

## Set up (once, about 5 minutes)

1. **Create the bot.** In Telegram, message [@BotFather](https://t.me/BotFather), send `/newbot`, pick a name and a username ending in `bot`, and copy the token it gives you.
2. **Find your chat id.** Open your new bot and press **Start**. Then open `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser and copy the number after `"chat":{"id":`.
3. **Deploy the Worker.** In the [Cloudflare dashboard](https://dash.cloudflare.com), go to **Workers & Pages → Create application**, start from **Hello World**, name it `hire-relay` and deploy. Then choose **Edit code**, replace everything with [`hire-relay.js`](hire-relay.js), and deploy again.
4. **Add the secrets.** In the Worker, go to **Settings → Variables and Secrets → Add**. Add `BOT_TOKEN` and `CHAT_ID`, both as type **Secret**, then deploy.
5. **Check it.** Open the Worker's URL (`https://hire-relay.<your-subdomain>.workers.dev`). It should show `"configured":true`.
6. **Connect the site.** Put that URL in `HIRE_RELAY` in [`src/data.ts`](../src/data.ts) and push.

Prefer the command line? From this folder: `npx wrangler deploy`, then `npx wrangler secret put BOT_TOKEN` and `npx wrangler secret put CHAT_ID`.

## How it protects your Telegram

- It only accepts briefs posted from rakibulx33.me (set `ALLOWED_ORIGINS` to change that).
- Each visitor IP can send 5 briefs per 10 minutes. Fields are length-limited, and everything the visitor typed is escaped.
- A hidden honeypot field catches simple bots.

If spam ever gets through anyway, the next step is adding Cloudflare Turnstile to the form.

## Test

```sh
node --test worker/hire-relay.test.mjs
```
