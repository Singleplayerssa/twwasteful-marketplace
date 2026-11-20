# T’wwasteful — Industrial Circular Marketplace

Marketplace B2B yang menghubungkan perusahaan penghasil sisa produksi dengan perusahaan yang membutuhkan material tersebut sebagai bahan baku atau bahan pendukung produksi.

## Fitur aplikasi

- Landing page, katalog, pencarian, filter kategori/lokasi, dan pengurutan harga.
- Registrasi akun perusahaan dengan peran pembeli, penjual, atau keduanya.
- Login dengan sesi cookie `HttpOnly`.
- Listing material non-B3 dengan spesifikasi, volume, minimum pembelian, harga per kg, lokasi, kondisi, serta foto.
- Penawaran B2B: pembeli mengajukan jumlah dan harga; penjual menerima atau menolak.
- Pesanan dibuat saat penjual menyetujui penawaran.
- Tahapan pesanan: menunggu pembayaran, tinjauan pembayaran, pembayaran dikonfirmasi, jadwal pengambilan, selesai, atau dibatalkan.
- Dashboard perusahaan, notifikasi, arsip listing, dan verifikasi perusahaan oleh admin.

## Teknologi

**Frontend:** React, Vite, Tailwind CSS, React Router, Lucide icons, CSS responsif.

**Backend:** Node.js 20+, Express, PostgreSQL (`pg`), Supabase Storage, bcrypt, JWT cookie, Zod, Helmet, Express Rate Limit, Multer.

**Hosting yang disiapkan:** Vercel untuk frontend, Render untuk Express API, Supabase untuk PostgreSQL dan file storage.

## Menjalankan lokal

Persyaratan: Node.js 20 atau lebih baru dan npm.

1. Instal dependency:

   ```bash
   npm install
   npm --prefix client install
   npm --prefix server install
   ```

2. Buat file environment backend:

   PowerShell:

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

3. Isi `server/.env` dengan connection string Supabase Session Pooler, URL project, Supabase Secret Key (server-only), dan `JWT_SECRET`. Jangan commit file `.env` dan jangan masukkan Secret Key ke frontend.
4. Pastikan enam tabel PostgreSQL sudah dibuat di schema `public` dan bucket Storage `twwasteful-materials` sudah dibuat.
5. Jalankan:

   ```bash
   npm run dev
   ```

6. Buka `http://localhost:5173`. API lokal berjalan di `http://localhost:4000` melalui proxy Vite.

Database tidak diisi akun atau listing demo secara otomatis. Daftarkan akun perusahaan pertama melalui `/register`, lalu buat listing untuk mengisi katalog. Gunakan akun/perusahaan uji yang berbeda untuk menguji alur pembeli dan penjual.

## Alur marketplace

1. Perusahaan mendaftar sebagai pembeli, penjual, atau keduanya.
2. Penjual membuat listing dengan data material dan mengonfirmasi bahwa material non-B3.
3. Pembeli mencari material dan mengajukan penawaran jumlah serta harga.
4. Penjual menerima atau menolak penawaran.
5. Jika diterima, sistem membuat pesanan dan menahan listing.
6. Pembeli mengirim referensi pembayaran. Penjual memeriksa pembayaran melalui kanal resmi perusahaannya dan mengonfirmasi secara manual.
7. Penjual menjadwalkan pengambilan. Pembeli mengonfirmasi bahwa material sudah diterima.

Pembayaran belum terhubung ke bank/payment gateway dan logistik belum terhubung ke penyedia ekspedisi. Konfirmasi referensi pembayaran adalah proses manual.

## Struktur folder

```text
twwasteful-marketplace/
├── client/                  # React + Vite frontend
│   ├── src/components/
│   ├── src/pages/
│   ├── src/api.js
│   └── vercel.json           # SPA fallback + API rewrite setelah URL Render tersedia
├── server/                  # Express API
│   ├── src/routes/
│   ├── src/db.js             # PostgreSQL pool dan transaction helper
│   ├── src/storage.js        # Upload foto ke Supabase Storage
│   ├── src/middleware.js
│   └── .env.example
├── docs/SYSTEM-FLOW.md
├── DEPLOY-POSTGRES.md
└── render.yaml
```

## Deployment

Ikuti [`DEPLOY-POSTGRES.md`](DEPLOY-POSTGRES.md) untuk menghubungkan Supabase, membuat Storage bucket, deploy backend di Render, lalu menambahkan external rewrite Vercel ke URL Render.

## Keamanan dan batas MVP

- `DATABASE_URL`, `JWT_SECRET`, dan `SUPABASE_SECRET_KEY` hanya disimpan di environment backend (Render atau `server/.env` lokal).
- Tabel database memakai RLS. Backend memakai koneksi Postgres server-side dan memeriksa autentikasi serta hak akses di Express. Jangan membuat policy `anon` atau `authenticated` yang memberikan akses luas.
- Bucket foto material bersifat public agar foto listing dapat dilihat di katalog; upload hanya dilakukan server melalui Secret Key.
- API memvalidasi input, membatasi percobaan login, menggunakan password hash, cookie `HttpOnly`, dan membatasi unggahan gambar ke JPG/PNG/WEBP maksimal 5 MB.
- Tahap awal dibatasi ke material non-B3. Perusahaan harus memastikan klasifikasi material, izin, dan dokumen pengelolaan/pengangkutan sesuai aturan sebelum transaksi.
- Ini masih MVP untuk demonstrasi dan pengembangan. Sebelum penggunaan komersial perlu pengujian keamanan, backup, audit log, monitoring, proses sengketa, kebijakan privasi, payment gateway, dan koordinasi logistik resmi.
