// render.cjs  (CommonJS, passt zu "type": "module" via .cjs)
// braucht: npm i playwright

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function safeParse(input) {
  let v = input;
  try { if (typeof v === 'string') v = JSON.parse(v); } catch {}
  try { if (typeof v === 'string') v = JSON.parse(v); } catch {}
  if (!v || typeof v !== 'object') v = {};
  return v;
}

(async () => {
  try {
    const raw = process.argv[2] || '';
    console.log('RAW_ARG (first 200):', String(raw).slice(0, 200));
    const data = safeParse(raw);
    console.log('PARSED keys:', Object.keys(data));

    const {
      place = '',
      rating = '',
      author = '',
      text = '',
      date = '',
      reviewUrl = ''
    } = data;

    // --- HTML minimal ---
    const stars = '★'.repeat(Number(rating) || 0) + '☆'.repeat(5 - (Number(rating) || 0));
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
            body { margin: 0; padding: 24px; background:#f6f7f9; }
            .card { width: 800px; background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
            .place { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
            .meta { color: #667085; font-size: 13px; margin-bottom: 12px; }
            .stars { color: #f59e0b; font-size: 22px; letter-spacing: 2px; margin-bottom: 12px; }
            .text { font-size: 16px; line-height: 1.4; white-space: pre-wrap; }
            a { color:#2563eb; text-decoration:none; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="place">${escapeHtml(place)}</div>
            <div class="meta">von ${escapeHtml(author || 'Unbekannt')} · ${escapeHtml(date || '')}</div>
            <div class="stars">${stars}</div>
            <div class="text">${escapeHtml(text)}</div>
            ${reviewUrl ? `<div style="margin-top:12px"><a href="${escapeAttr(reviewUrl)}">Zur Bewertung</a></div>` : ''}
          </div>
        </body>
      </html>
    `;

    // --- Screenshot rendern ---
    const outDir = path.join(process.cwd(), 'out');
    fs.mkdirSync(outDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 860, height: 600 } });
    await page.setContent(html, { waitUntil: 'networkidle' });
    // Höhe an Inhalt anpassen
    const bbox = await page.locator('body').boundingBox();
    if (bbox && bbox.height) {
      await page.setViewportSize({ width: 860, height: Math.ceil(bbox.height) + 24 });
    }
    const pngBuffer = await page.screenshot({ type: 'png', fullPage: true });
    await browser.close();

    const pngPath = path.join(outDir, 'review.png');
    fs.writeFileSync(pngPath, pngBuffer);
    console.log('PNG saved:', pngPath, 'size:', pngBuffer.length);

    // --- payload.json für Zapier (base64 ohne Prefix) ---
    const base64 = pngBuffer.toString('base64');
    const payload = {
      content_type: 'image/png',
      filename: 'review.png',
      base64,            // OHNE "data:image/png;base64,"
      place, rating, author, date, reviewUrl
    };
    const payloadPath = path.join(outDir, 'payload.json');
    fs.writeFileSync(payloadPath, JSON.stringify(payload));
    console.log('payload.json written:', payloadPath);

  } catch (err) {
    console.error('Render failed:', err);
    process.exit(1);
  }
})();

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}
