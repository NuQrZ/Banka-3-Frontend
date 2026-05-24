# Banka 3 Frontend

Frontend sada podrzava runtime API konfiguraciju bez rebuild-a.

Kako radi:
- browser prvo ucita `/app-config.js`
- frontend cita `window.__APP_CONFIG__.API_BASE_URL`
- nginx startup skripta pri paljenju kontejnera generise taj fajl iz `APP_API_BASE_URL`

Tipicne vrednosti:
- lokalni docker: `APP_API_BASE_URL=/api`
- fakultetski klaster: `APP_API_BASE_URL=https://domen/gateway/api`

Lokalni Vite dev server i dalje moze da koristi `VITE_API_URL`, ali to je samo pomocni dev fallback i nije potreban za deploy.
