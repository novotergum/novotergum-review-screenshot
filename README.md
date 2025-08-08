# Review Screenshot (Zapier ↔ GitHub Actions)

Dieses Repo rendert aus Bewertungsdaten (JSON) ein PNG und sendet es per HTTP an einen Zapier Catch Hook zurück.

## Manuell testen
```bash
npm i
node render.js '{"place":"NOVOTERGUM Solingen","rating":1,"author":"Martina","text":"…","date":"2025-08-08"}'
open out/review.png
