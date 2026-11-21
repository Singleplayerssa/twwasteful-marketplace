# Install this Vercel update into your existing GitHub project

Use the Indonesian walkthrough in **MULAI-DI-SINI.md**. The key steps are:

1. Back up your existing repository folder.
2. Extract this ZIP and copy the contents of `twwasteful-marketplace-pg` into your existing repository folder.
3. Replace files when Windows asks, but never delete or replace the existing `.git` directory.
4. Keep the Vercel Root Directory set to `client`.
5. Install dependencies, create `server/.env` from the example, test locally, then commit and push.
6. Add production secrets in Vercel Environment Variables. Use Supabase Transaction Pooler (port 6543), the newly rotated Supabase Secret Key, and a new JWT secret.

Never commit or share database URLs, passwords, Supabase Secret Keys, JWT secrets, or admin passwords.
