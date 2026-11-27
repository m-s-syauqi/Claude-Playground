# Gerak 🌱

**Gerak** adalah aplikasi produktivitas yang memadukan agenda per jam, review tiap jam, skill ber-level ala game, dan peliharaan virtual yang tumbuh dari kedisiplinanmu.

Berjalan sepenuhnya di browser. Tanpa akun, tanpa server, dan semua data tersimpan di perangkatmu sendiri (localStorage). Bisa di-install ke layar utama HP seperti aplikasi biasa.

## Cara kerja

1. **Susun agenda besok, jam per jam.** Agenda hanya bisa dibuat untuk hari yang belum tiba (besok sampai 7 hari ke depan). Begitu tanggalnya mulai, rencana **terkunci**.
2. **Review tiap jam.** Mulai menit ke-50 setiap jam, tandai kegiatan itu: **Sesuai**, **Sebagian**, atau **Meleset**, dan boleh tambahkan catatan apa yang sebenarnya terjadi.
3. **Dapat hadiah** untuk setiap jam yang sesuai rencana:

| Kejadian | Hadiah |
| --- | --- |
| Jam **sesuai** rencana | +20 XP (ke skill terkait) · +10 koin |
| Jam **sebagian** sesuai | +8 XP · +4 koin |
| Review **tepat waktu** (≤ 1 jam setelah slot selesai) | +2 koin |
| **Combo**: jam sesuai berturut-turut | +2 koin per combo (maks +10) |
| Agenda hari ini sudah disiapkan kemarin (≥ 3 jam) | +10 koin |
| **Hari sempurna** (semua jam sesuai, ≥ 4 jam) | +30 koin |
| **Streak** (≥ 70% jam sesuai, hari berturut-turut) | +5 koin × streak (maks +50) |

Jam terencana yang tidak direview sampai hari berganti membuat peliharaanmu sedih.

## Skill

Setiap kegiatan di rencana bisa dihubungkan ke sebuah skill, misalnya Bahasa Inggris, Excel, Berbicara, Menulis, Olahraga, atau Process Engineering. Kamu juga bisa menambah skill sendiri. Tiap skill punya XP, level, dan pangkat:

Pemula → Pelajar → Terampil → Mahir → Ahli → Master → Grandmaster

Semua XP juga dihitung ke **Level Gerak** milikmu sendiri.

## Peliharaan

Mulai dari sebuah **telur** yang menetas setelah 40 XP, lalu berevolusi seiring total XP-mu:

Telur → Bayi → Anak (tumbuh tunas) → Remaja (punya tangan) → Dewasa (ikat kepala) → Legenda (bermahkota)

- **Kenyang** dan **Senang** berkurang seiring waktu (lebih lambat saat tidur di luar jam aktif).
- Belanja di **Toko** pakai koin: makanan, mainan, obat, dan aksesori (kacamata, topi, syal).
- Kalau kenyang habis, peliharaan **sakit**, dan XP dari review dibagi dua sampai diberi obat.
- Ketuk peliharaanmu untuk menyapanya. Ia juga mengingatkan review yang tertunda dan agenda besok yang belum siap.

## Menjalankan

Buka `index.html` di browser. Agar bisa di-install dan dipakai offline, sajikan lewat HTTPS (mis. GitHub Pages), lalu pilih **Add to Home Screen** / **Install app**.

Pengingat review tiap jam bisa diaktifkan di ⚙ Pengaturan. Notifikasi muncul selama aplikasi terbuka atau masih berjalan di latar belakang. Browser tidak mengizinkan web app menjadwalkan notifikasi saat benar-benar ditutup tanpa server push.

Untuk mencoba alur review tanpa menunggu, tambahkan `?now=2026-11-28T09:55` di URL untuk menggeser jam aplikasi.

## Berkas

| Berkas | Isi |
| --- | --- |
| `index.html` | Struktur halaman dan dialog |
| `styles.css` | Tampilan (terang & gelap, mobile & desktop) |
| `app.js` | Logika agenda, review, hadiah, skill, peliharaan |
| `sw.js`, `manifest.webmanifest`, `icons/` | Install ke layar utama & mode offline |
