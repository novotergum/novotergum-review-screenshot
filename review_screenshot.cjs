// CommonJS, damit require verfügbar ist
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const REVIEW_URL = process.env.REVIEW_URL || 'https://search.google.com/local/reviews?placeid=ChIJtSnXiV_UuEcRUzqBdUg1NPM';
const STORAGE_STATE = process.env.STORAGE_STATE || 'auth/google.json';
const OUT_DIR = 'out';
const RETURN_HOOK = process.env.RETURN_HOOK || ''; // optional: Zapier Hook

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE });
  const page = await context.newPage();

  await page.goto(REVIEW_URL, { waitUntil: 'networkidle' });

  // Sortierung auf "Neueste" umschalten (DE & EN Fallback)
  try {
    // Dropdown öffnen
    const sortButtonSelectors = [
      'button:has-text("Sortieren")',
      'div[role="button"]:has-text("Sortieren")',
      'button:has-text("Sort by")',
      'div[role="button"]:has-text("Sort by")'
    ];
    for (const sel of sortButtonSelectors) {
      const btn = page.locator(sel);
      if (await btn.first().isVisible().catch(() => false)) { await btn.first().click(); break; }
    }

    // Option "Neueste"/"Newest" wählen
    const newestOption = page.locator('text=Neueste, Newest');
    await newestOption.first().waitFor({ timeout: 4000 }).catch(() => {});
    if (await newestOption.first().isVisible().catch(() => false)) {
      await newestOption.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
    }
  } catch (e) {
    console.log('Sort-Umschalten nicht gefunden/übersprungen:', e.message);
  }

  const pngPath = path.join(OUT_DIR, 'review.png');
  await page.screenshot({ path: pngPath, fullPage: true });
  const b64 = fs.readFileSync(pngPath).toString('base64');

  await browser.close();

  // Payload für Zapier (optional)
  const payload = {
    content_type: 'image/png',
    filename: 'review.png',
    base64: b64,
    reviewUrl: REVIEW_URL
  };
  fs.writeFileSync(path.join(OUT_DIR, 'payload.json'), JSON.stringify(payload));

  if (RETURN_HOOK) {
    const { execSync } = require('child_process');
    try {
      execSync(`curl -s -X POST "${RETURN_HOOK}" -H "Content-Type: application/json" --data-binary @out/payload.json`, { stdio: 'inherit' });
    } catch (err) {
      console.error('POST an RETURN_HOOK fehlgeschlagen:', err.message);
      process.exit(2);
    }
  }
})();
