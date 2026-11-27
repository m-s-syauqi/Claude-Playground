# My Wallet

Aplikasi pencatat keuangan pribadi, dilindungi password.

- Catat pemasukan dan pengeluaran (jumlah, kategori, tanggal, catatan)
- Ringkasan per bulan: pemasukan, pengeluaran, dan total saldo
- Grafik pengeluaran per kategori
- Login dengan satu password (sesi berlaku 30 hari)

Dibuat dengan Next.js 16. Data disimpan di Upstash Redis saat online, atau di file lokal saat development.

## Deploy ke Vercel

Kode aplikasi ini ada di branch `my-wallet` pada repo `Claude-Playground`.

1. Buka [vercel.com/new](https://vercel.com/new), lalu import repo `Claude-Playground` dari GitHub.
2. Sebelum klik **Deploy**, buka **Environment Variables** dan isi:
   - `APP_PASSWORD`: password untuk masuk ke aplikasi
   - `SESSION_SECRET`: teks acak minimal 32 karakter. Buat dengan `openssl rand -base64 32`, atau ketik 40+ karakter acak.
3. Klik **Deploy**. Deploy pertama memakai branch `main`, yang hanya berisi README. Hasilnya belum berupa aplikasi dan bisa saja gagal, itu wajar.
4. Buka **Settings → Environments → Production**, lalu ubah **Branch Tracking** dari `main` menjadi `my-wallet`.
5. Buka tab **Storage**, pilih **Upstash** (Redis), lalu buat database dan hubungkan ke project ini. Vercel otomatis mengisi `KV_REST_API_URL` dan `KV_REST_API_TOKEN`.
6. Buka tab **Deployments**, cari deployment dari branch `my-wallet`, lalu pilih **Redeploy** (atau **Promote to Production**).

Setelah itu buka `https://<nama-project>.vercel.app`. Halaman login akan muncul, dan tanpa password tidak ada data yang bisa dilihat.

## Development lokal

```bash
cp .env.example .env.local   # lalu isi APP_PASSWORD dan SESSION_SECRET
npm install
npm run dev
```

Buka http://localhost:3000. Tanpa variabel Redis, data disimpan di `.data/transactions.json`.

## Keamanan

- Semua halaman dan aksi data mengecek sesi login di server.
- Cookie sesi bersifat `httpOnly` dan ditandatangani dengan HMAC memakai `SESSION_SECRET`.
- Password salah diberi jeda 1 detik untuk memperlambat tebakan.
- Halaman tidak diindeks mesin pencari (`robots.txt` dan meta `noindex`).
- Untuk logout di semua perangkat, ganti `SESSION_SECRET` di Vercel lalu redeploy.
