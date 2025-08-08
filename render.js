import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const raw = process.argv[2] || process.env.REVIEW_JSON || "{}";
const data = JSON.parse(raw || "{}");

const {
  place = "NOVOTERGUM Physiotherapie Solingen",
  rating = 3,
  author = "Martina",
  text = "Bewertungstext…",
  date = new Date().toISOString().slice(0,10),
  reviewUrl = ""
} = data;

const stars = "★★★★★".slice(0, Math.max(1, Math.min(5, Number(rating) || 3)));

const escapeHtml = (s="") =>
  s.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; margin:0; padding:24px; background:#f6f7f9; }
  .card { max-width: 900px; margin: auto; background:white; border-radius:16px; padding:24px; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
  .hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;}
  .place { font-weight:700; font-size:20px; }
  .stars { font-size:18px; letter-spacing:1px; }
  .meta { color:#666; font-size:14px; margin-bottom:12px;}
  .text { font-size:18px; line-height:1.5; white-space:pre-wrap; }
  .footer { margin-top:16px; font-size:12px; color:#888; }
  .btn { display:inline-block; padding:8px 12px; border-radius:8px; border:1px solid #ddd; text-decoration:none; color:#333; }
</style>
</head>
<body>
  <div class="card">
    <div class="hdr">
      <div class="place">${escapeHtml(place)}</div>
      <div class="stars">${stars}</div>
    </div>
    <div class="meta">von ${escapeHtml(author)} • ${escapeHtml(date)}</div>
    <div class="text">${escapeHtml(text)}</div>
    ${reviewUrl ? `<div class="footer"><a class="btn" href="${reviewUrl}">Zur Bewertung</a></div>` : ``}
  </div>
</body>
</html>`;

const OUT_DIR = "out";
fs.mkdirSync(OUT_DIR, { recursive: true });
const filePath = path.join(OUT_DIR, "review.html");
fs.writeFileSync(filePath, html, "utf8");

const pngPath = path.join(OUT_DIR, "review.png");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto("file://" + path.resolve(filePath));
  const card = await page.locator(".card").first();
  await card.screenshot({ path: pngPath });
  await browser.close();

  const b64 = fs.readFileSync(pngPath).toString("base64");
  const payload = {
    content_type: "image/png",
    filename: "review.png",
    base64: b64,
    place, rating, author, date
  };
  fs.writeFileSync(path.join(OUT_DIR, "payload.json"), JSON.stringify(payload));
})().catch(err => { console.error(err); process.exit(1); });
