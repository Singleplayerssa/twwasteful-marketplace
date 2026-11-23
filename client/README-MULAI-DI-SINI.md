# T'wwasteful Demo Rebuild

Versi demo sederhana: Vite + React + Supabase Auth + satu tabel listing + Supabase Storage. Tidak ada Express, Render, PostgreSQL connection string, JWT secret, atau service-role key di frontend.

## 1. Supabase
1. Buka Supabase project yang akan dipakai.
2. SQL Editor -> New query.
3. Salin seluruh isi `SUPABASE-SETUP.sql`, lalu Run.
4. Project Settings -> API (atau API Keys), salin Project URL dan anon/public/publishable key.
5. Authentication -> Providers -> Email. Untuk demo presentasi, kamu boleh menonaktifkan Confirm email agar akun baru bisa langsung login. Jika tetap aktif, pengguna harus konfirmasi email.

## 2. Environment variables
Di Vercel Project -> Settings -> Environment Variables, tambahkan:
- `VITE_SUPABASE_URL` = Project URL
- `VITE_SUPABASE_ANON_KEY` = anon/public/publishable key

Jangan pernah memasukkan Supabase Secret/service_role key atau database password ke variable `VITE_` atau kode frontend.

## 3. Deploy
- Root Directory: `.` jika repo ini berdiri sendiri, atau `client` jika isi folder ini ditempatkan di folder client repo lama.
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Fitur
- Register dan login email/password via Supabase Auth.
- Membuat listing material.
- Upload foto ke bucket `twwasteful-materials`.
- Marketplace membaca listing dari database bersama sehingga pengguna di perangkat lain dapat melihatnya.
- Pencarian dan filter kategori.
- Detail listing.
- Ada beberapa listing contoh untuk demo tampilan.

Catatan: belum ada chat, penawaran, pembayaran, dan transaksi sungguhan. Listing contoh hanya data tampilan, bukan data database.
