# My Wallet

Aplikasi keuangan pribadi bergaya aplikasi HP, dikunci dengan PIN.

- **Akun**: saldo semua rekening bank, dompet digital, tunai, kartu kredit (tagihan dan cicilan), serta nilai investasi per platform. Data diambil dari berkas `data.js` artifact *Neraca Pribadi*, dengan rumus yang sama.
- **Catatan**: catat pemasukan dan pengeluaran harian, lengkap dengan ringkasan bulanan dan grafik per kategori.
- **PIN 6 angka**: terkunci 15 menit setelah 5 kali salah. Sesi berlaku 30 hari.
- Tombol mata untuk menyamarkan semua angka.
- Bisa dipasang di layar utama HP seperti aplikasi biasa.

Dibuat dengan Next.js 16. Data disimpan di Upstash Redis saat online, atau di folder `.data/` saat development. **Data keuangan tidak pernah disimpan di GitHub**: data akun diimpor lewat menu Pengaturan di dalam aplikasi.

## Deploy ke Vercel

Kode aplikasi ini ada di branch `my-wallet` pada repo `Claude-Playground`.

1. Buka [vercel.com/new](https://vercel.com/new), lalu import repo `Claude-Playground` dari GitHub.
2. Sebelum klik **Deploy**, buka **Environment Variables** dan isi:
   - `APP_PIN`: PIN 6 angka untuk masuk ke aplikasi
   - `SESSION_SECRET`: teks acak minimal 32 karakter. Buat dengan `openssl rand -base64 32`, atau ketik 40+ karakter acak.
3. Klik **Deploy**. Deploy pertama memakai branch `main`, yang hanya berisi README. Hasilnya belum berupa aplikasi dan bisa saja gagal, itu wajar.
4. Buka **Settings → Environments → Production**, lalu ubah **Branch Tracking** dari `main` menjadi `my-wallet`.
5. Buka tab **Storage**, pilih **Upstash** (Redis), lalu buat database dan hubungkan ke project ini. Vercel otomatis mengisi `KV_REST_API_URL` dan `KV_REST_API_TOKEN`.
6. Buka tab **Deployments**, cari deployment dari branch `my-wallet`, lalu pilih **Redeploy** (atau **Promote to Production**).

Setelah itu buka `https://<nama-project>.vercel.app`. Layar PIN akan muncul, dan tanpa PIN tidak ada data yang bisa dilihat.

### Mengisi data akun

1. Masuk dengan PIN, lalu buka menu **Pengaturan**.
2. Di bagian *Data akun*, pilih berkas `data.js` dari artifact Neraca Pribadi, lalu ketuk **Impor data**.
3. Untuk memperbarui saldo, impor lagi berkas `data.js` yang terbaru.

## Development lokal

```bash
cp .env.example .env.local   # lalu isi APP_PIN dan SESSION_SECRET
npm install
npm run dev
```

Buka http://localhost:3000. Tanpa variabel Redis, data disimpan di folder `.data/`.

## Keamanan

- Semua halaman dan aksi data mengecek sesi login di server.
- Cookie sesi bersifat `httpOnly` dan ditandatangani dengan HMAC memakai `SESSION_SECRET`.
- PIN salah diberi jeda, dan setelah 5 kali salah berturut-turut aplikasi terkunci 15 menit.
- Data akun hanya disimpan di database, tidak di repo yang publik.
- Halaman tidak diindeks mesin pencari (`robots.txt` dan meta `noindex`).
- Untuk logout di semua perangkat, ganti `SESSION_SECRET` di Vercel lalu redeploy.
