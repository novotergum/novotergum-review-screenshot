npm i
npx playwright install
npx playwright open --save-storage=auth/google.json "https://search.google.com/local/reviews?placeid=ChIJtSnXiV_UuEcRUzqBdUg1NPM"
# → Im geöffneten Browser bei Google einloggen, kurz warten, Browser schließen.
# Die Datei auth/google.json enthält jetzt deine Session.
