# T’wwasteful — Industrial Circular Marketplace

Marketplace B2B yang menghubungkan perusahaan penghasil sisa produksi dengan perusahaan yang membutuhkan material tersebut sebagai bahan baku atau bahan pendukung produksi.

## Fitur yang tersedia

- Landing page dengan informasi bisnis, kategori material, alur kerja, dan daftar material.
- Katalog marketplace: pencarian, filter kategori dan lokasi, pengurutan harga.
- Registrasi akun dengan profil perusahaan (nama, industri, alamat, NIB opsional, kontak) dan peran pembeli / penjual / keduanya.
- Login dengan sesi cookie `HttpOnly`.
- Listing penjualan: spesifikasi, volume, minimum pembelian, harga per kg, lokasi pickup, kondisi material, foto, serta konfirmasi wajib bahwa material merupakan non-B3.
- Penawaran B2B: pembeli mengirim volume dan harga tawaran; penjual menerima atau menolak.
- Pesanan: dibuat otomatis ketika penjual menerima penawaran.
- Tahap pembayaran: pembeli mengirim referensi transfer; penjual meninjau dan mengonfirmasi penerimaan dana.
- Tahap logistik: penjual mengisi jadwal pengambilan; pembeli mengonfirmasi material diterima.
- Dashboard perusahaan, notifikasi, arsip listing, dan status verifikasi perusahaan.
- Endpoint admin untuk meninjau verifikasi perusahaan.
- Data contoh (Karawang dan Bekasi) otomatis dimasukkan ke database pertama kali. Nama perusahaan dan harga contoh merupakan data simulasi untuk demonstrasi, bukan penawaran pasar aktif.

## Teknologi

**Frontend:** React, Vite, Tailwind CSS, CSS responsif, React Router, Lucide icons.

**Backend:** Node.js, Express, SQLite (`better-sqlite3`), bcrypt, JWT cookie, Zod validation, Helmet, Express Rate Limit, Multer.

## Menjalankan di komputer lokal

Persyaratan: Node.js 20 atau lebih baru dan npm.

1. Buka folder project ini di terminal.
2. Instal dependency root dan aplikasi:

   ```bash
   npm install
   npm --prefix client install
   npm --prefix server install
   ```

3. Buat file environment:

   ```bash
   cp server/.env.example server/.env
   ```

   Pada Windows PowerShell:

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

4. Ubah `JWT_SECRET` pada `server/.env` menjadi string acak yang panjang. Untuk membuat akun admin, isi `ADMIN_EMAIL` dan `ADMIN_PASSWORD` dengan kredensial milikmu sendiri. Jangan gunakan password contoh untuk deployment.
5. Jalankan frontend dan backend:

   ```bash
   npm run dev
   ```

6. Buka alamat Vite yang tampil di terminal, biasanya `http://localhost:5173`.

API berjalan di `http://localhost:4000`. Vite meneruskan `/api` dan `/uploads` ke backend. SQLite akan dibuat otomatis di `server/data/twwasteful.db`.

## Cara mencoba alur marketplace

1. Buka marketplace. Listing contoh dapat dilihat tanpa login.
2. Daftarkan akun perusahaan baru dan pilih peran **Keduanya** untuk mencoba sisi pembeli sekaligus penjual.
3. Untuk mencoba menjual, buka **Jual material**, isi spesifikasi, jumlah, minimum order, harga/kg dan lokasi.
4. Untuk menguji penawaran lintas perusahaan, buat akun kedua di browser incognito atau browser lain. Masuk sebagai pembeli, pilih listing akun pertama, lalu kirim penawaran.
5. Kembali ke akun penjual, buka Dashboard → Penawaran, lalu terima penawaran. Pesanan otomatis dibuat.
6. Pembeli mengisi referensi transfer pada Dashboard → Pesanan. Penjual memeriksa mutasi pada kanal pembayaran perusahaannya, kemudian mengonfirmasi pembayaran di dashboard.
7. Penjual menetapkan jadwal pengambilan. Setelah material diterima, pembeli mengonfirmasi pesanan selesai.

## Struktur folder

```text
twwasteful-marketplace/
├── client/
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── components/       # Navbar, brand, material visual, listing card, footer
│       ├── pages/            # Landing, marketplace, auth, detail, sell, dashboard
│       ├── api.js            # API helper dan format harga
│       ├── AuthContext.jsx   # Session state
│       ├── App.jsx
│       └── styles.css
└── server/
    ├── src/
    │   ├── routes/           # auth, listings, offers, orders, dashboard, admin
│   │   ├── db.js             # SQLite schema, seed, notification helper
│   │   ├── middleware.js     # auth dan role guard
│   │   └── index.js          # Express server
│   ├── uploads/
│   └── .env.example
```

## Desain alur bisnis

Lihat [`docs/SYSTEM-FLOW.md`](docs/SYSTEM-FLOW.md) untuk diagram alur transaksi, hak akses setiap peran, prinsip harga dan stok, serta batas versi MVP.

## Ringkasan endpoint API

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/auth/register` | Daftar akun dan perusahaan |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Profil sesi aktif |
| GET | `/api/listings` | Katalog dengan filter `q`, `category`, `city`, `sort` |
| GET | `/api/listings/:id` | Detail listing |
| GET | `/api/listings/mine` | Listing perusahaan sendiri |
| POST | `/api/listings` | Buat listing, multipart/form-data |
| PATCH | `/api/listings/:id` | Arsip/aktifkan listing |
| GET / POST | `/api/offers` | Lihat dan buat penawaran |
| POST | `/api/offers/:id/respond` | Terima/tolak penawaran |
| GET | `/api/orders` | Daftar pesanan perusahaan |
| POST | `/api/orders/:id/payment` | Kirim referensi pembayaran |
| POST | `/api/orders/:id/action` | Konfirmasi pembayaran, jadwalkan pickup, selesaikan atau batalkan |
| GET | `/api/dashboard` | Statistik dan notifikasi |
| GET | `/api/admin/companies` | Daftar perusahaan untuk admin |
| POST | `/api/admin/companies/:id/verify` | Ubah status verifikasi |

## Catatan operasional penting

Versi ini adalah **MVP operasional untuk demonstrasi dan pengembangan lanjutan**, bukan layanan pembayaran/logistik yang telah terhubung ke pihak ketiga. Konfirmasi pembayaran hanya menyimpan referensi yang dikirim pembeli; penjual tetap wajib memeriksa dana pada kanal resmi mereka. Jadwal pickup disepakati langsung antarperusahaan. Untuk produksi, integrasikan payment gateway resmi, proses sengketa, audit log, layanan logistik, backup database, monitoring, dan kebijakan privasi.

Tahap awal sebaiknya hanya menerima material **non-B3**. Platform ini belum memverifikasi klasifikasi, izin, atau dokumen pengangkutan limbah; perusahaan wajib memastikan material dan aktivitasnya sesuai ketentuan lingkungan hidup dan perizinan yang berlaku sebelum transaksi.

## Deployment

- Build frontend: `npm run build`.
- Atur `NODE_ENV=production`, `JWT_SECRET` yang kuat, `PORT`, `ADMIN_EMAIL` (opsional) dan `ADMIN_PASSWORD` (opsional) di environment hosting.
- Jalankan `npm start` dari root project.
- Express menyajikan `client/dist` serta API pada origin yang sama.
- Gunakan persistent disk untuk `server/data` dan `server/uploads`. Atur HTTPS pada hosting agar cookie sesi memakai atribut `Secure`.
