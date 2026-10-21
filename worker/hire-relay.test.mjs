// Run with: node --test worker/hire-relay.test.mjs
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import worker from "./hire-relay.js";

const SITE = "https://rakibulx33.me";
const env = { BOT_TOKEN: "123:abc", CHAT_ID: "42" };
let calls;
let telegram; // what the fake Telegram API answers
const realFetch = globalThis.fetch;
let ipN = 0;

beforeEach(() => {
  calls = [];
  telegram = { status: 200, body: { ok: true, result: { message_id: 1 } } };
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(init.body) });
    return new Response(JSON.stringify(telegram.body), { status: telegram.status });
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

const brief = (over = {}) => ({
  name: "Nadia Rahman", reply_to: "nadia@example.com", project: "Online store or e-commerce",
  stage: "Just an idea", launch: "I'm flexible", details: "A store for handmade bags", ...over,
});
const post = (body, { origin = SITE, type = "text/plain", ip } = {}) =>
  worker.fetch(new Request("https://hire-relay.example.workers.dev/", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": type, "CF-Connecting-IP": ip ?? `10.0.0.${++ipN}` },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }), env);

test("GET reports whether it is configured", async () => {
  const res = await worker.fetch(new Request("https://x/"), env);
  assert.deepEqual(await res.json(), { ok: true, service: "hire-relay", configured: true });
  const bare = await worker.fetch(new Request("https://x/"), {});
  assert.equal((await bare.json()).configured, false);
});

test("preflight is allowed for the site and refused for others", async () => {
  const ok = await worker.fetch(new Request("https://x/", { method: "OPTIONS", headers: { Origin: SITE } }), env);
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get("Access-Control-Allow-Origin"), SITE);
  const no = await worker.fetch(new Request("https://x/", { method: "OPTIONS", headers: { Origin: "https://evil.example" } }), env);
  assert.equal(no.status, 403);
  assert.equal(no.headers.get("Access-Control-Allow-Origin"), null);
});

test("a valid brief becomes one Telegram message with a reply button", async () => {
  const res = await post(brief());
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(res.headers.get("Access-Control-Allow-Origin"), SITE);
  assert.equal(calls.length, 1);
  const { url, body } = calls[0];
  assert.equal(url, "https://api.telegram.org/bot123:abc/sendMessage");
  assert.equal(body.chat_id, "42");
  assert.equal(body.parse_mode, "HTML");
  assert.match(body.text, /<b>From:<\/b> Nadia Rahman/);
  assert.match(body.text, /<b>Reply to:<\/b> nadia@example.com/);
  assert.match(body.text, /<b>Launch:<\/b> I'm flexible/);
  assert.match(body.text, /<blockquote>A store for handmade bags<\/blockquote>/);
  const button = body.reply_markup.inline_keyboard[0][0];
  assert.equal(button.text, "Reply by email");
  assert.match(button.url, /^https:\/\/mail\.google\.com\/mail\/\?view=cm&fs=1&to=nadia%40example\.com&su=Re%3A%20your%20project%20brief&body=Hi%20Nadia%2C/);
});

test("JSON content type works too", async () => {
  const res = await post(brief(), { type: "application/json" });
  assert.equal(res.status, 200);
});

test("whatever the visitor typed is escaped", async () => {
  await post(brief({ name: "<b>Eve</b> & co", details: "<a href=x>click</a>" }));
  const { text } = calls[0].body;
  assert.match(text, /&lt;b&gt;Eve&lt;\/b&gt; &amp; co/);
  assert.match(text, /&lt;a href=x&gt;click&lt;\/a&gt;/);
  assert.doesNotMatch(text, /<a /);
});

test("phone numbers get a WhatsApp button, local BD numbers get +880", async () => {
  await post(brief({ reply_to: "01711-000000" }));
  assert.equal(calls[0].body.reply_markup.inline_keyboard[0][0].url, "https://wa.me/8801711000000");
  await post(brief({ reply_to: "+44 7700 900123" }));
  assert.equal(calls[1].body.reply_markup.inline_keyboard[0][0].url, "https://wa.me/447700900123");
});

test("empty or '(none)' details are left out", async () => {
  await post(brief({ details: "(none)" }));
  assert.doesNotMatch(calls[0].body.text, /blockquote/);
});

test("other sites cannot post", async () => {
  const res = await post(brief(), { origin: "https://evil.example" });
  assert.equal(res.status, 403);
  assert.equal(calls.length, 0);
});

test("the honeypot answers ok but sends nothing", async () => {
  const res = await post(brief({ _honey: "http://spam" }));
  assert.equal(res.status, 200);
  assert.equal(calls.length, 0);
});

test("bad input is refused", async () => {
  assert.equal((await post(brief({ name: "" }))).status, 400);
  assert.equal((await post(brief({ reply_to: "  " }))).status, 400);
  assert.equal((await post("{not json")).status, 400);
  assert.equal((await post("null")).status, 400);
  assert.equal((await post(brief({ details: "x".repeat(9000) }))).status, 413);
  assert.equal(calls.length, 0);
});

test("long fields are trimmed", async () => {
  await post(brief({ details: "y".repeat(5000).slice(0, 5000) }));
  const quote = calls[0].body.text.match(/<blockquote>(y+)<\/blockquote>/)[1];
  assert.equal(quote.length, 1200);
});

test("a Telegram error is reported as 502", async () => {
  telegram = { status: 400, body: { ok: false, description: "Bad Request: chat not found" } };
  const errors = [];
  const realError = console.error;
  console.error = (...a) => errors.push(a.join(" "));
  try {
    const res = await post(brief());
    assert.equal(res.status, 502);
    assert.equal((await res.json()).ok, false);
  } finally { console.error = realError; }
  assert.match(errors[0], /chat not found/);
  assert.doesNotMatch(errors[0], /123:abc/); // never log the token
});

test("missing settings are reported as 500", async () => {
  const res = await worker.fetch(new Request("https://x/", { method: "POST", headers: { Origin: SITE }, body: JSON.stringify(brief()) }), {});
  assert.equal(res.status, 500);
});

test("one IP can send five briefs per window, not six", async () => {
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await post(brief(), { ip: "192.0.2.7" })).status);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429]);
});
