// render.js
const fs = require('fs');
const path = require('path');

function safeParse(input) {
  let v = input;
  try {
    // 1. Wenn es ein String mit Quotes ist -> parse
    if (typeof v === 'string') v = JSON.parse(v);
  } catch (_) { /* ignore */ }
  try {
    // 2. Falls nach dem ersten Parse immer noch ein String -> nochmal parse
    if (typeof v === 'string') v = JSON.parse(v);
  } catch (_) { /* ignore */ }
  // 3. Fallback: leeres Objekt
  if (v === null || typeof v !== 'object') v = {};
  return v;
}

// RAW arg aus Actions
const raw = process.argv[2] || '';
console.log('RAW_ARG (first 200):', String(raw).slice(0,200));

const data = safeParse(raw);
console.log('PARSED keys:', Object.keys(data));

// Erwartete Felder (mit Defaults)
const {
  place = '',
  rating = '',
  author = '',
  text = '',
  date = '',
  reviewUrl = ''
} = data;

// ... hier dein HTML/Screenshot Code …

// payload.json schreiben (für den Zap-B Hook)
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync(
  path.join('out', 'payload.json'),
  JSON.stringify({
    content_type: 'image/png',
    filename: 'review.png',
    base64,               // <- dein erzeugter Screenshot als Base64 OHNE data:-Prefix
    place, rating, author, date, reviewUrl
  })
);
console.log('payload.json written');
