# T'wwasteful — Deploy frontend + Express API on Vercel

This version keeps the React/Vite interface and runs the Express API as a Vercel Node.js Function. PostgreSQL and image storage remain in Supabase. No Render Web Service is used.

## 1. Vercel project settings

The existing Vercel project can be reused.

- **Root Directory:** `client` (keep this setting; it is the existing project root).
- **Framework:** Express. The `client/vercel.json` file sets this automatically.
- **Build Command:** `npm run build` (also set in `vercel.json`).
- **Output Directory:** `public` (also set in `vercel.json`).
- **Node.js:** 20 or newer.

`client/index.js` exports the Express app. Vercel detects it and deploys it as a Node.js Function. Vite builds the unchanged React frontend into `client/public`; Vercel serves those static assets through its CDN. The rewrite in `vercel.json` sends frontend routes such as `/marketplace`, `/login`, and `/dashboard` to `index.html`, while leaving `/api/*` for Express.

## 2. Supabase database connection — important for serverless

For Vercel Functions, use the Supabase **Transaction Pooler**, not the Session Pooler:

1. Supabase Dashboard → project → **Connect**.
2. Choose **Transaction pooler**.
3. Choose **URI**.
4. Replace the password placeholder with the database password you set in Supabase.
5. Confirm the port is **6543**.

The URI resembles:

`postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@POOLER_HOST:6543/postgres`

Do not use port `5432` Session Pooler for this serverless deployment. Supabase recommends transaction mode for serverless functions because they create short-lived connections. The code uses a module-scope `pg` pool with one client and Vercel's `attachDatabasePool` helper. The app does not use named prepared statements or session-level state.

If the database password contains reserved URI characters (for example `@`, `:`, `/`, `#`, or `%`), URL-encode the password component before saving the URI. Keep the entire URI private.

## 3. Supabase Storage

The app expects a public bucket named `twwasteful-materials`.

- Supabase → Storage → Buckets.
- Confirm the bucket exists and is **Public** so visitors can see listing photos.
- Uploads are performed only by the backend using the Secret Key. The key is not sent to the browser.

The app limits listing photos to JPG, PNG, or WEBP and 3 MB to stay below Vercel's ordinary function request-body limit.

## 4. Vercel Environment Variables

Open Vercel → project `twwasteful-marketplace` → Settings → Environment Variables. Add these to **Production** (and Preview if you want preview deployments to work). Do not put them in frontend-prefixed variables.

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase Transaction Pooler URI, port `6543` |
| `PGSSL` | `true` |
| `JWT_SECRET` | A fresh random secret, at least 32 characters |
| `SUPABASE_URL` | Supabase Project URL, e.g. `https://PROJECT_REF.supabase.co` |
| `SUPABASE_SECRET_KEY` | A newly rotated Supabase Secret Key (`sb_secret_...`) |
| `SUPABASE_STORAGE_BUCKET` | `twwasteful-materials` |

Optional administrator bootstrap:

| Variable | Value |
|---|---|
| `ADMIN_NAME` | Administrator T'wwasteful |
| `ADMIN_EMAIL` | A dedicated admin email address |
| `ADMIN_PASSWORD` | A unique, strong admin password |

If all three admin variables are set, the API creates a separate verified platform company and admin account the first time the API is called, but only if that email does not already exist. If the email exists with a non-admin role, the code does not silently elevate it.

Generate a new JWT secret locally with:

`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Do not paste secrets into chat, source files, GitHub, screenshots, or `client/.env`. If any Supabase Secret Key or JWT secret was previously exposed, rotate it and only use the new value.

## 5. Function region

The current `vercel.json` sets the function region to `icn1` (Seoul), matching the Supabase pooler hostname previously shown for this project (`ap-northeast-2`). Vercel serves static assets globally, while the API function runs near the database. If the actual Supabase pooler hostname in your dashboard is `ap-southeast-1`, change `icn1` to `sin1` instead.

## 6. Push and deploy

From the **repository root** (the folder containing `client`, `server`, and the root `package.json`):

```bash
npm install
npm --prefix client install
npm --prefix server install
npm --prefix client run build
```

If your existing client/server lockfiles are from the previous SQLite version, let `npm install` refresh them and include the updated lockfiles in the commit. Then:

```bash
git add .
git status
git commit -m "Deploy Express API as Vercel Function"
git push
```

Vercel will automatically redeploy from GitHub. Keep the Vercel Root Directory set to `client`.

## 7. Verify the deployment

Open:

`https://YOUR-VERCEL-DOMAIN/api/health`

Expected JSON includes:

```json
{
  "ok": true,
  "service": "T’wwasteful API",
  "database": "connected",
  "storage": "configured"
}
```

Then test:

1. Homepage `/` and deep links `/marketplace`, `/login`, `/register`.
2. Register two test companies using test email addresses.
3. Log in as the seller and create a non-B3 listing.
4. Log in as the second company and send an offer.
5. Accept the offer as the seller; check that the order appears in both dashboards.
6. Submit a payment reference as the buyer; the seller manually checks the payment outside the platform and confirms it.
7. Schedule pickup as the seller; confirm receipt as the buyer.
8. Test listing image upload with an image smaller than 3 MB.

Payments are still manual-reference confirmation. No bank or payment gateway is connected.

## 8. Local development

- Create `server/.env` from `server/.env.example` and fill in the same Supabase variables.
- Install dependencies as described above.
- Run `npm run dev` from the repository root.
- Vite runs on `http://localhost:5173` and proxies `/api` to the local Express server on port `4000`.

The frontend design and React pages are unchanged. The backend source is shared from `client/backend` by both the local runner and the Vercel Express Function.
