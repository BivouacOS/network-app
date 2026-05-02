# CLAUDE.md — network-app

## Privacy rules — NEVER commit

- `*.xlsx`, `*.xls`, `*.csv` — may contain real contact names, emails, phone numbers
- `scripts/seed-data.json` — baked contact data
- `public/seed.html` — baked contact data

These are gitignored. Never force-add them. Never suggest committing them.

## Seed workflow

1. User fills out `network-contacts-template.xlsx`
2. `node scripts/excel-to-seed.mjs` → writes `scripts/seed-data.json` + `public/seed.html`
3. Open `http://localhost:<port>/seed.html` to load into app

## Dev server

`npm run dev` — check port (5173–5175 depending on what's running)
