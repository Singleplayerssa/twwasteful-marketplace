# T'wwasteful: Supabase + Render + Vercel deployment

This branch migrates the Express API from local SQLite to Supabase PostgreSQL and stores uploaded listing images in Supabase Storage. Keep all database URLs and Supabase Secret Keys on the backend only.

## 1. Supabase database connection

1. In the Supabase project, open **Connect**.
2. Choose **Session pooler** and copy the URI (port `5432`). Render's network is IPv4; Supabase documents the shared session pooler as IPv4-compatible. Do not use transaction pooler port `6543` for this persistent `pg` pool.
3. The URI format looks like `postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres`. Use your exact generated URI. URL-encode special characters in the password if Supabase does not provide a ready-to-copy URI.
4. Never place this URI in the frontend, GitHub, or this chat.

The backend connects as the project database owner using the server-only Postgres URI. The database tables have RLS enabled; do not add an `anon`/`authenticated` allow-all policy. The application performs authorization in Express, and the database credentials stay private in Render.

## 2. Supabase Storage bucket

1. In Supabase, open **Storage** > **New bucket**.
2. Name it `twwasteful-materials`.
3. Set it to **Public bucket** so listing photos can be shown to marketplace visitors. Only the backend receives the Secret Key and can upload files; never put that key in Vercel or browser code.
4. Keep upload limits enforced by the API: JPG, PNG, WEBP; maximum 5 MB.

## 3. Deploy the backend to Render

1. Open Render and create **New > Web Service**.
2. Connect GitHub repository `Singleplayerssa/twwasteful-marketplace` and select the branch containing this migration.
3. Set Root Directory to `server`.
4. Build Command: `npm install`.
5. Start Command: `npm start`.
6. Add environment variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = the Supabase **Session pooler** URI (port 5432)
   - `PGSSL` = `true`
   - `PG_POOL_MAX` = `5`
   - `JWT_SECRET` = a newly generated random value with at least 32 characters
   - `SUPABASE_URL` = Project URL from Supabase
   - `SUPABASE_SECRET_KEY` = Supabase Settings > API Keys > **Secret key** (`sb_secret_...`). Use the legacy `service_role` only if the new Secret key is not available yet; prefer the new Secret key.
   - `SUPABASE_STORAGE_BUCKET` = `twwasteful-materials`
7. Deploy and wait until the service is Live.
8. Test `https://YOUR-RENDER-SERVICE.onrender.com/api/health`. It must return JSON with `ok: true` and `database: "connected"`.

For the first test you may use Render Free. Free web services sleep after 15 minutes of inactivity and have ephemeral local filesystems. This backend does not depend on local persistent files: PostgreSQL stores data and Supabase Storage stores photos. A sleeping service can take around a minute to wake. This is suitable for testing, not a high-availability production workload.

## 4. Connect Vercel to the API

After Render gives you the exact service hostname, edit `client/vercel.json`. Put the API rewrite before the SPA fallback:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-RENDER-SERVICE.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Replace the hostname with the exact Render service URL (no trailing slash), commit and push to GitHub. Vercel will redeploy. This proxy keeps the browser API on the same website origin, so the existing HttpOnly session cookie can be used without exposing backend credentials.

## 5. Test the real marketplace

- `GET /api/health` returns `ok: true` and `database: connected`.
- Homepage and `/marketplace` load without blank screens.
- Register a test company with a test email.
- Log in and create a listing without an image.
- Create a listing with a JPG/PNG/WEBP image and check its public photo URL.
- Use a second test company/account to submit an offer.
- Accept the offer and verify the order appears on both dashboards.
- Test payment-reference review, seller confirmation, pickup scheduling, buyer receipt confirmation, and cancellation rules.

Payments remain manual-reference confirmation; this code does not connect to a bank or payment gateway.
