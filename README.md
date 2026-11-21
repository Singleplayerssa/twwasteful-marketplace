# T'wwasteful — Industrial Circular Marketplace

Marketplace B2B yang menghubungkan perusahaan penghasil sisa produksi dengan perusahaan yang membutuhkan material tersebut sebagai bahan baku atau bahan pendukung produksi.

## Fitur aplikasi

- Landing page, katalog, pencarian, filter kategori/lokasi, dan pengurutan harga.
- Registrasi akun perusahaan dengan peran pembeli, penjual, atau keduanya.
- Login dengan cookie sesi `HttpOnly` dan password hash bcrypt.
- Listing material non-B3 dengan spesifikasi, volume, minimum pembelian, harga per kg, lokasi, kondisi, dan foto.
- Penawaran B2B: pembeli mengajukan jumlah dan harga; penjual menerima atau menolak.
- Pesanan dibuat saat penjual menyetujui penawaran.
- Tahapan pesanan: menunggu pembayaran, tinjauan pembayaran, pembayaran dikonfirmasi, jadwal pengambilan, selesai, atau dibatalkan.
- Dashboard perusahaan, notifikasi, arsip listing, dan endpoint verifikasi perusahaan untuk admin.
- UI responsive untuk desktop, tablet, dan ponsel.

## Teknologi

- **Frontend:** React, Vite, Tailwind CSS, React Router, Lucide icons, responsive CSS.
- **Backend:** Express sebagai satu Vercel Node.js Function.
- **Database:** Supabase PostgreSQL melalui Transaction Pooler.
- **Image storage:** Supabase Storage.
- **Hosting:** Vercel (frontend + Express API dalam satu project).

## Menjalankan lokal

Persyaratan: Node.js 20+ dan npm.

```bash
npm install
npm --prefix client install
npm --prefix server install
```

Buat file environment lokal:

```powershell
Copy-Item server/.env.example server/.env
```

Isi `server/.env` dengan Supabase Transaction Pooler URI (port 6543), Supabase Project URL, Supabase Secret Key, dan JWT secret. Jangan commit `.env`.

Jalankan aplikasi dari folder repository utama:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
API lokal: `http://localhost:4000/api/health`

## Deployment

Baca **[DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md)** untuk konfigurasi Vercel, Supabase, environment variables, dan checklist pengujian.

## Alur transaksi

1. Perusahaan mendaftar sebagai pembeli, penjual, atau keduanya.
2. Penjual membuat listing dengan informasi material dan konfirmasi bahwa material non-B3.
3. Pembeli mencari material dan mengirim penawaran jumlah/harga.
4. Penjual menerima atau menolak. Penawaran yang diterima membentuk pesanan.
5. Pembeli mengirim referensi pembayaran; penjual memeriksa penerimaan dana secara manual.
6. Penjual mengatur jadwal pengambilan; pembeli mengonfirmasi penerimaan material.

Data katalog akan kosong sampai perusahaan mendaftar dan membuat listing. Pembayaran masih manual dan belum terhubung ke payment gateway atau bank.
