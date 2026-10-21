/**
 * hire-relay: forwards project briefs from rakibulx33.me to Telegram.
 *
 * Why a Worker: the Telegram bot token has to stay secret. Anything in the website's
 * code is public, so the site posts the brief here and only this Worker holds the token.
 *
 * Settings (Cloudflare → this Worker → Settings → Variables and Secrets), both as Secrets:
 *   BOT_TOKEN        the token @BotFather gave you
 *   CHAT_ID          your Telegram chat id (a number)
 * Optional:
 *   ALLOWED_ORIGINS  comma-separated sites allowed to post here
 *                    (default: https://rakibulx33.me,https://www.rakibulx33.me)
 *
 * Open the Worker's URL in a browser to check it: it says whether both settings are present.
 */

const DEFAULT_ORIGINS = "https://rakibulx33.me,https://www.rakibulx33.me";
const MAX_BODY = 8000; // characters; a real brief is well under 1,000
const PER_IP = 5; // briefs allowed per visitor IP...
const WINDOW_MS = 10 * 60 * 1000; // ...in any 10 minutes (counted per Worker instance)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const recent = new Map(); // ip -> timestamps of recent briefs

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(",").map((s) => s.trim()).filter(Boolean);
    const origin = request.headers.get("Origin") || "";
    const okOrigin = allowed.includes(origin);
    const cors = okOrigin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : { Vary: "Origin" };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: okOrigin ? 204 : 403,
        headers: { ...cors, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" },
      });
    }
    if (request.method === "GET") {
      return reply({ ok: true, service: "hire-relay", configured: Boolean(env.BOT_TOKEN && env.CHAT_ID) }, 200, cors);
    }
    if (request.method !== "POST") return reply({ ok: false, error: "method not allowed" }, 405, cors);
    if (!okOrigin) return reply({ ok: false, error: "origin not allowed" }, 403, cors);
    if (!env.BOT_TOKEN || !env.CHAT_ID) return reply({ ok: false, error: "relay not configured" }, 500, cors);
    if (throttled(request.headers.get("CF-Connecting-IP") || "unknown")) {
      return reply({ ok: false, error: "too many briefs, try again later" }, 429, cors);
    }

    let data;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BODY) return reply({ ok: false, error: "brief too large" }, 413, cors);
      data = JSON.parse(raw);
    } catch {
      return reply({ ok: false, error: "invalid JSON" }, 400, cors);
    }
    if (!data || typeof data !== "object") return reply({ ok: false, error: "invalid JSON" }, 400, cors);
    if (data._honey) return reply({ ok: true }, 200, cors); // only bots fill the hidden field

    const field = (key, max) => String(data[key] ?? "").replace(/\s+/g, " ").trim().slice(0, max);
    const details = field("details", 1200);
    const brief = {
      name: field("name", 80),
      contact: field("reply_to", 120),
      project: field("project", 80),
      stage: field("stage", 80),
      launch: field("launch", 80),
      details: details === "(none)" ? "" : details,
    };
    if (!brief.name || !brief.contact || !brief.project) {
      return reply({ ok: false, error: "name, contact and project are required" }, 400, cors);
    }

    const markup = buttons(brief);
    const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        text: message(brief),
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...(markup ? { reply_markup: markup } : {}),
      }),
    }).catch(() => null);
    const out = res ? await res.json().catch(() => ({})) : {};
    if (!out.ok) {
      console.error("Telegram did not accept the message:", res ? res.status : "network error", out.description || "");
      return reply({ ok: false, error: "telegram rejected the message" }, 502, cors);
    }
    return reply({ ok: true }, 200, cors);
  },
};

/** The Telegram message, in Telegram's HTML mode. Everything the visitor typed is escaped. */
function message(b) {
  const lines = [
    "📩 <b>New project brief</b>",
    "",
    `<b>From:</b> ${esc(b.name)}`,
    `<b>Reply to:</b> ${esc(b.contact)}`,
    "",
    `<b>Project:</b> ${esc(b.project)}`,
  ];
  if (b.stage) lines.push(`<b>Stage:</b> ${esc(b.stage)}`);
  if (b.launch) lines.push(`<b>Launch:</b> ${esc(b.launch)}`);
  if (b.details) lines.push("", `<blockquote>${esc(b.details)}</blockquote>`);
  lines.push("", "<i>via rakibulx33.me</i>");
  return lines.join("\n");
}

/** One tap to answer: a Gmail draft for an email address, a WhatsApp chat for a phone number. */
function buttons(b) {
  if (EMAIL_RE.test(b.contact)) {
    const first = b.name.split(" ")[0];
    const url = "https://mail.google.com/mail/?view=cm&fs=1" +
      `&to=${encodeURIComponent(b.contact)}` +
      `&su=${encodeURIComponent("Re: your project brief")}` +
      `&body=${encodeURIComponent(`Hi ${first},\n\n`)}`;
    return { inline_keyboard: [[{ text: "Reply by email", url }]] };
  }
  let digits = b.contact.replace(/\D/g, "");
  if (/^01\d{9}$/.test(digits)) digits = `88${digits}`; // Bangladeshi number typed without +880
  if (digits.length >= 8 && digits.length <= 15) {
    return { inline_keyboard: [[{ text: "Message on WhatsApp", url: `https://wa.me/${digits}` }]] };
  }
  return undefined;
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function throttled(ip) {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 10000) recent.clear();
  return hits.length > PER_IP;
}

function reply(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
