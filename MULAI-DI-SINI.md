# Mulai di sini — T'wwasteful di Vercel + Supabase

Versi ini mempertahankan desain React/Tailwind dan fitur marketplace yang sudah ada. Express dijalankan sebagai satu Vercel Function. Supabase menyimpan PostgreSQL dan foto material.

## A. Pasang update ke folder GitHub lokal

1. Buat salinan cadangan folder project lama.
2. Ekstrak ZIP ini.
3. Salin **isi** folder `twwasteful-marketplace-pg` ke folder repository lokal:
   `C:\Users\user\Documents\visual studio code\Twwasteful-Marketplace-MVP\twwasteful-marketplace`
4. Pilih **Replace the files in the destination** jika diminta.
5. Jangan menghapus folder `.git` yang sudah ada.
6. Buka folder repository tersebut di VS Code.

## B. Install dan uji lokal

Dari terminal di folder repository utama:

```cmd
npm install
npm --prefix client install
npm --prefix server install
copy server\.env.example server\.env
```

Isi `server/.env` dengan nilai rahasia milik project Supabase. Untuk Vercel gunakan Transaction Pooler; untuk tes lokal, Transaction Pooler juga dapat dipakai.

Jalankan:

```cmd
npm run dev
```

Buka `http://localhost:5173`. API lokal tersedia di `http://localhost:4000/api/health`.

Lakukan build check:

```cmd
npm --prefix client run build
```

Jika berhasil, folder `client/public` akan dibuat otomatis. Folder itu tidak perlu di-commit karena Vercel menjalankan build sendiri.

## C. Simpan update ke GitHub

Pastikan terminal berada di folder repository utama — folder yang memiliki `client`, `server`, dan root `package.json`.

```cmd
git status
git add .
git commit -m "Move Express API to Vercel Functions"
git push
```

Jika Git mengatakan `nothing to commit`, periksa bahwa kamu sudah menyalin file ZIP ke folder repository yang benar.

## D. Atur project Vercel

Di Vercel → project `twwasteful-marketplace` → Settings → General / Build and Deployment:

- Root Directory: `client`
- Framework Preset: `Express`
- Build Command: `npm run build`
- Output Directory: `public`
- Install Command: `npm install`

File `client/vercel.json` juga berisi konfigurasi framework, build, output, region function, dan fallback untuk halaman React. Jangan mengubah Root Directory menjadi `server` atau folder repository utama.

## E. Tambahkan Environment Variables di Vercel

Buka Settings → Environment Variables. Tambahkan variabel ini untuk **Production** (dan Preview bila ingin memakai Preview Deployments):

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase Transaction Pooler URI, port `6543` |
| `PGSSL` | `true` |
| `JWT_SECRET` | Secret acak baru, minimal 32 karakter |
| `SUPABASE_URL` | Project URL Supabase |
| `SUPABASE_SECRET_KEY` | Supabase Secret Key baru yang sudah dirotasi |
| `SUPABASE_STORAGE_BUCKET` | `twwasteful-materials` |

Untuk Transaction Pooler, buka Supabase → Connect → Transaction pooler → URI. Username, host, dan password harus mengikuti string yang ditampilkan Supabase. Ganti placeholder password dengan Database Password. Port harus `6543`, bukan Session Pooler `5432`.

Bila password memiliki karakter khusus seperti `@`, `:`, `/`, `#`, atau `%`, URL-encode bagian password sebelum menyimpannya dalam URI.

Buat JWT secret baru di terminal lokal:

```cmd
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Jangan mengirim atau menyimpan secret pada chat, source code, file `.env` yang di-commit, atau GitHub. Karena secret lama pernah dibagikan, gunakan hanya Supabase Secret Key dan JWT Secret yang baru dirotasi.

Opsional: `ADMIN_NAME`, `ADMIN_EMAIL`, dan `ADMIN_PASSWORD` dapat ditambahkan untuk membuat akun administrator pertama. Gunakan email dan password khusus admin; jangan gunakan password yang sama dengan akun pribadi. Jika tidak diperlukan, biarkan ketiganya tidak diatur.

## F. Deploy dan uji

1. Setelah Environment Variables disimpan, buka Deployments dan lakukan Redeploy (atau push commit akan memicu deployment otomatis).
2. Pastikan deployment berstatus `Ready`.
3. Buka `https://twwasteful-marketplace.vercel.app/api/health`.
4. Respons yang diharapkan memuat `ok: true`, `database: "connected"`, dan `storage: "configured"`.
5. Uji `/`, `/marketplace`, `/login`, `/register`, dan `/dashboard`.
6. Daftarkan dua akun perusahaan uji: satu penjual dan satu pembeli.
7. Buat listing sebagai penjual, lalu kirim penawaran sebagai pembeli.
8. Terima penawaran sebagai penjual, kirim referensi pembayaran sebagai pembeli, konfirmasi pembayaran secara manual sebagai penjual, atur pengambilan, lalu konfirmasi penerimaan sebagai pembeli.
9. Uji foto listing menggunakan JPG/PNG/WEBP di bawah 3 MB.

Katalog akan kosong sampai ada perusahaan yang membuat listing. Data demo SQLite lokal lama tidak otomatis dipindahkan ke PostgreSQL.

## Batasan yang perlu diketahui

- Backend merupakan serverless function; tidak ada proses server yang terus berjalan.
- Supabase Transaction Pooler dipakai untuk koneksi serverless; pool lokal dibatasi satu koneksi per instance dan tidak memakai named prepared statements.
- Foto dibatasi 3 MB agar aman di bawah batas payload function standar.
- Payment gateway/bank belum terintegrasi. Sistem hanya mencatat referensi pembayaran dan konfirmasi manual antarpihak.
- Bucket foto `twwasteful-materials` harus public agar foto listing dapat ditampilkan; upload tetap dilakukan oleh backend menggunakan Secret Key.
- Ini adalah versi deployment untuk pengujian. Lakukan tes dua akun dan seluruh alur sebelum dipakai untuk transaksi sungguhan.
