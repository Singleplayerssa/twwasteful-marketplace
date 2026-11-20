# T'wwasteful backend migration

The API now uses:
- Express + `pg` for Supabase PostgreSQL
- Supabase Storage for public listing images
- HttpOnly JWT session cookies
- Parameterized PostgreSQL statements and transactions for order flows

The frontend remains React + Vite + Tailwind. It calls `/api/...`; after the Render service is online, add the external API rewrite to `client/vercel.json` as shown in `DEPLOY-POSTGRES.md`.

Read `DEPLOY-POSTGRES.md` before deploying. Never commit `.env`, `DATABASE_URL`, or `SUPABASE_SECRET_KEY`.
