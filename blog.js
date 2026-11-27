(() => {
  'use strict';

  // ---------- Articles ----------
  // body: HTML. <div data-tool="pace"></div> and <div data-tool="hr"></div> become calculators.
  const POSTS = [
    {
      slug: 'jenis-lari',
      title: '10 Jenis Lari dan Kapan Melakukannya',
      label: 'Latihan',
      excerpt: 'Easy run, long run, tempo, interval, fartlek, dan lainnya. Apa tujuannya, seberapa cepat, dan seberapa sering?',
      body: `
<p>Tidak semua lari sama. Setiap jenis lari melatih hal yang berbeda: daya tahan, kecepatan, atau sekadar membantu tubuh pulih. Minggu latihan yang baik mencampur beberapa jenis, dengan sebagian besar lari tetap santai.</p>

<h3>1. Easy run (lari santai)</h3>
<p>Fondasi dari semua latihan. Pace-nya cukup pelan sampai kamu bisa mengobrol dalam kalimat lengkap. Easy run membangun jantung, paru, pembuluh darah kecil di otot, dan ketahanan tendon tanpa membuat tubuh terlalu lelah. Sebagian besar lari mingguan sebaiknya easy run.</p>

<h3>2. Recovery run (lari pemulihan)</h3>
<p>Lebih pendek dan lebih pelan lagi dari easy run, biasanya sehari setelah lari berat. Tujuannya melancarkan aliran darah, bukan menambah kebugaran. Kalau kaki terasa berat sekali, istirahat total juga pilihan yang baik.</p>

<h3>3. Long run (lari jarak jauh)</h3>
<p>Lari terpanjang dalam seminggu, dengan pace santai. Melatih daya tahan, pemakaian lemak sebagai energi, dan mental. Naikkan jaraknya bertahap, misalnya 1 km setiap satu atau dua minggu. Banyak pelari melakukannya di akhir pekan pagi.</p>

<h3>4. Tempo run (lari ambang)</h3>
<p>Lari "nyaman tapi berat" selama 15 sampai 30 menit, di sekitar ambang laktat: pace yang kira-kira bisa kamu pertahankan selama satu jam balapan. Kamu masih bisa bicara beberapa kata, tapi tidak mengobrol. Selalu awali dengan pemanasan 10 sampai 15 menit lari santai.</p>

<h3>5. Interval</h3>
<p>Repetisi cepat dengan jeda pemulihan, misalnya 6 × 400 m cepat dengan 200 m jalan atau jogging di antaranya. Melatih VO2max dan kecepatan. Cukup sekali seminggu, dan jangan di minggu-minggu pertama kamu mulai lari.</p>

<h3>6. Fartlek</h3>
<p>Bahasa Swedia untuk "bermain kecepatan". Di tengah easy run, kamu menyelipkan bagian cepat tanpa aturan kaku: lari cepat sampai tiang listrik berikutnya, lalu santai lagi. Cara yang menyenangkan untuk mulai latihan kecepatan.</p>

<h3>7. Hill repeats (tanjakan)</h3>
<p>Lari menanjak dengan usaha tinggi selama 30 sampai 90 detik, lalu jalan atau jogging turun sebagai pemulihan. Menguatkan otot kaki dan memperbaiki teknik dengan risiko benturan lebih rendah dari sprint di jalan datar. Di kota yang datar, jembatan penyeberangan atau flyover yang aman bisa jadi alternatif.</p>

<h3>8. Progression run</h3>
<p>Mulai santai lalu makin cepat secara bertahap, misalnya sepertiga terakhir di pace tempo. Melatih kemampuan berlari cepat saat sudah lelah, yang berguna untuk akhir balapan.</p>

<h3>9. Strides</h3>
<p>Akselerasi pendek 15 sampai 20 detik sampai hampir kencang, dengan langkah ringan dan rileks, lalu jalan sampai napas pulih. Lakukan 4 sampai 6 kali setelah easy run. Melatih kecepatan dan teknik tanpa membuat lelah.</p>

<h3>10. Race (balapan) dan time trial</h3>
<p>Usaha maksimal di jarak tertentu. Time trial adalah "balapan" sendirian untuk mengukur kemajuan, misalnya 5 km setiap 6 sampai 8 minggu.</p>

<h3>Contoh minggu untuk pelari rekreasi</h3>
<table>
  <thead><tr><th>Hari</th><th>Lari</th></tr></thead>
  <tbody>
    <tr><td>Senin</td><td>Istirahat</td></tr>
    <tr><td>Selasa</td><td>Easy run 30–40 menit + 4 strides</td></tr>
    <tr><td>Rabu</td><td>Istirahat atau latihan kekuatan</td></tr>
    <tr><td>Kamis</td><td>Tempo atau interval (dengan pemanasan)</td></tr>
    <tr><td>Jumat</td><td>Istirahat</td></tr>
    <tr><td>Sabtu</td><td>Long run santai</td></tr>
    <tr><td>Minggu</td><td>Recovery run atau istirahat</td></tr>
  </tbody>
</table>
<p class="note">Di Stride, setiap jenis punya warna sendiri saat kamu menambah lari, dan tombol <b>Suggest run</b> memilihkan jenis lari berikutnya berdasarkan lari yang sudah kamu catat.</p>`,
    },
    {
      slug: 'pace-dan-kecepatan',
      title: 'Memahami Pace: dari Menit per Kilometer sampai Prediksi Waktu Race',
      label: 'Pace & Detak Jantung',
      excerpt: 'Apa itu pace, bagaimana mengubahnya ke km/jam, dan kalkulator untuk menghitung pace serta memperkirakan waktu balapanmu.',
      body: `
<p><b>Pace</b> adalah waktu yang kamu butuhkan untuk menempuh satu kilometer, misalnya 6:30/km. <b>Kecepatan</b> adalah kebalikannya: jarak per jam, misalnya 9,2 km/jam. Pelari lebih sering memakai pace karena lebih mudah dibayangkan saat berlari: "setiap kilometer kira-kira enam setengah menit."</p>

<h3>Rumus</h3>
<ul>
  <li><b>Pace</b> = waktu ÷ jarak. Contoh: 33 menit 20 detik untuk 5 km = 2000 detik ÷ 5 = 400 detik = 6:40/km.</li>
  <li><b>Kecepatan (km/jam)</b> = 60 ÷ pace dalam menit. Contoh: 6:00/km → 60 ÷ 6 = 10 km/jam.</li>
</ul>

<h3>Tabel pace dan kecepatan</h3>
<table>
  <thead><tr><th>Pace</th><th>km/jam</th><th>Waktu 5K</th><th>Waktu 10K</th></tr></thead>
  <tbody>
    <tr><td>4:30/km</td><td>13,3</td><td>22:30</td><td>45:00</td></tr>
    <tr><td>5:00/km</td><td>12,0</td><td>25:00</td><td>50:00</td></tr>
    <tr><td>5:30/km</td><td>10,9</td><td>27:30</td><td>55:00</td></tr>
    <tr><td>6:00/km</td><td>10,0</td><td>30:00</td><td>1:00:00</td></tr>
    <tr><td>6:30/km</td><td>9,2</td><td>32:30</td><td>1:05:00</td></tr>
    <tr><td>7:00/km</td><td>8,6</td><td>35:00</td><td>1:10:00</td></tr>
    <tr><td>7:30/km</td><td>8,0</td><td>37:30</td><td>1:15:00</td></tr>
    <tr><td>8:00/km</td><td>7,5</td><td>40:00</td><td>1:20:00</td></tr>
  </tbody>
</table>

<h3>Kalkulator pace dan prediksi waktu</h3>
<p>Masukkan jarak dan waktu dari lari terbaikmu. Kalkulator menghitung pace dan kecepatan, lalu memperkirakan waktumu di jarak lain dengan rumus Riegel.</p>
<div data-tool="pace"></div>
<p class="note">Rumus Riegel (waktu₂ = waktu₁ × (jarak₂ ÷ jarak₁)<sup>1,06</sup>) paling akurat untuk jarak yang tidak terlalu jauh berbeda, dan mengasumsikan kamu sudah berlatih untuk jarak tujuan. Prediksi half marathon atau marathon dari hasil 5K biasanya terlalu optimistis kalau long run-mu masih pendek.</p>

<h3>Pace yang tepat untuk tiap latihan</h3>
<p>Pace latihan sebaiknya diukur dari kemampuanmu sekarang, bukan dari target. Patokan kasar berdasarkan pace 5K terbaikmu:</p>
<ul>
  <li><b>Easy dan long run:</b> sekitar 1:00 sampai 2:00 per km lebih lambat dari pace 5K.</li>
  <li><b>Tempo:</b> sekitar 0:20 sampai 0:30 per km lebih lambat dari pace 5K.</li>
  <li><b>Interval 400 sampai 1000 m:</b> sekitar pace 5K atau sedikit lebih cepat.</li>
</ul>
<p>Tanpa jam pun bisa: pakai <b>talk test</b>. Kalau bisa mengobrol lancar, itu easy. Kalau hanya bisa beberapa kata, itu tempo. Kalau tidak bisa bicara sama sekali, itu interval atau sprint.</p>
<p class="note">Cuaca panas, tanjakan, dan kurang tidur membuat pace yang sama terasa lebih berat. Di hari seperti itu, ikuti rasa usaha, bukan angka di jam.</p>`,
    },
    {
      slug: 'zona-detak-jantung',
      title: 'Zona Detak Jantung dan Aturan 80/20',
      label: 'Pace & Detak Jantung',
      excerpt: 'Lima zona detak jantung, cara memperkirakan HR maksimal, dan kenapa sebagian besar lari sebaiknya terasa mudah.',
      body: `
<p>Detak jantung (heart rate, HR) menunjukkan seberapa keras tubuhmu bekerja. Latihan berdasarkan zona HR membantu memastikan lari santai benar-benar santai, dan lari keras benar-benar keras.</p>

<h3>Memperkirakan HR maksimal</h3>
<p>Rumus populer <b>220 − usia</b> sangat kasar: HR maksimal orang dengan usia sama bisa berbeda 10 sampai 20 bpm. Rumus <b>Tanaka</b> (208 − 0,7 × usia) sedikit lebih akurat untuk orang dewasa. Cara paling akurat adalah tes lapangan atau tes laboratorium, tapi tes maksimal sebaiknya hanya untuk yang sehat dan sudah terbiasa berlatih.</p>

<h3>Lima zona</h3>
<table>
  <thead><tr><th>Zona</th><th>% HR maks</th><th>Rasanya</th><th>Untuk apa</th></tr></thead>
  <tbody>
    <tr><td>Z1</td><td>50–60%</td><td>Sangat ringan</td><td>Pemulihan, pemanasan</td></tr>
    <tr><td>Z2</td><td>60–70%</td><td>Bisa mengobrol</td><td>Easy run, long run, fondasi daya tahan</td></tr>
    <tr><td>Z3</td><td>70–80%</td><td>Mulai terengah</td><td>Lari "sedang", marathon pace</td></tr>
    <tr><td>Z4</td><td>80–90%</td><td>Berat, beberapa kata</td><td>Tempo, ambang laktat</td></tr>
    <tr><td>Z5</td><td>90–100%</td><td>Maksimal</td><td>Interval pendek, sprint</td></tr>
  </tbody>
</table>
<p>Kalau kamu tahu <b>HR istirahat</b> (ukur saat bangun tidur, sebelum bangun dari kasur), metode <b>Karvonen</b> memberi zona yang lebih personal: zona dihitung dari cadangan detak jantung (HR maks − HR istirahat).</p>

<h3>Kalkulator zona</h3>
<div data-tool="hr"></div>

<h3>Aturan 80/20</h3>
<p>Penelitian pada atlet ketahanan, terutama oleh Stephen Seiler, menemukan pola yang konsisten: sekitar 80% sesi latihan dilakukan dengan intensitas rendah, dan hanya sekitar 20% yang berat. Banyak pelari rekreasi justru terjebak di tengah: setiap lari "lumayan berat", sehingga lari santainya tidak cukup santai untuk pulih, dan lari kerasnya tidak cukup keras untuk meningkatkan kecepatan.</p>
<p>Kalau sebagian besar lari kamu ber-HR rata-rata di atas 150 bpm, coba perlambat easy run sampai kamu bisa mengobrol. Awalnya terasa terlalu pelan, tapi dalam beberapa minggu pace santaimu biasanya ikut membaik.</p>

<h3>Soal akurasi jam</h3>
<p>Sensor HR optik di pergelangan tangan cukup baik untuk lari santai yang stabil, tapi bisa meleset saat interval, saat tangan berkeringat, atau kalau jam terlalu longgar. Chest strap (sabuk dada) lebih akurat. Pakai jam agak ke atas dari tulang pergelangan dan cukup kencang.</p>`,
    },
    {
      slug: 'perlengkapan-lari',
      title: 'Perlengkapan Lari: Mana yang Wajib, Mana yang Bonus',
      label: 'Perlengkapan',
      excerpt: 'Dari sepatu sampai lampu kepala. Daftar perlengkapan lari menurut prioritas, plus yang perlu diperhatikan untuk cuaca tropis.',
      body: `
<p>Lari termasuk olahraga paling murah. Tapi beberapa barang membuat lari jauh lebih nyaman dan aman. Berikut urutannya dari yang paling penting.</p>

<h3>Wajib</h3>
<ul>
  <li><b>Sepatu lari</b> yang pas dan nyaman. Ini satu-satunya investasi yang benar-benar penting. Lihat artikel <a href="#/post/memilih-sepatu">Cara Memilih Sepatu Lari</a>.</li>
  <li><b>Kaos dan celana berbahan sintetis</b> (polyester, nilon, "dry-fit"). Bahan ini cepat kering. Hindari katun: menyerap keringat, jadi berat, dan memicu lecet.</li>
  <li><b>Kaus kaki lari</b> berbahan sintetis atau wol merino, tanpa jahitan tebal di ujung jari. Kaus kaki katun adalah penyebab umum lepuh.</li>
</ul>

<h3>Sangat membantu</h3>
<ul>
  <li><b>Jam GPS atau aplikasi di HP</b> untuk mencatat jarak, pace, dan HR. Hasilnya bisa kamu catat di Stride, termasuk lewat screenshot.</li>
  <li><b>Topi atau visor dan kacamata hitam</b> untuk lari siang atau sore yang terik.</li>
  <li><b>Botol atau hydration vest/belt</b> untuk lari lebih dari 45 sampai 60 menit, terutama di cuaca panas.</li>
  <li><b>Anti-lecet</b> (petroleum jelly atau balm khusus) untuk ketiak, selangkangan, dan dada di lari jauh.</li>
  <li><b>Sports bra</b> yang menopang dengan baik, untuk pelari perempuan.</li>
</ul>

<h3>Untuk keamanan</h3>
<ul>
  <li><b>Pakaian terang atau reflektif dan lampu kecil</b> kalau lari subuh atau malam. Pengendara harus bisa melihatmu.</li>
  <li><b>Identitas dan kontak darurat</b>: kartu di saku, gelang ID, atau info darurat di layar kunci HP.</li>
  <li><b>Uang kecil atau e-wallet</b> untuk membeli minum atau pulang kalau terjadi sesuatu.</li>
</ul>

<h3>Bonus (tidak wajib)</h3>
<ul>
  <li><b>Chest strap HR</b> kalau kamu serius latihan berdasarkan zona HR.</li>
  <li><b>Sepatu kedua</b> untuk bergantian. Memberi waktu busa sepatu kembali mengembang dan berguna kalau satu pasang basah.</li>
  <li><b>Sepatu balap dengan pelat karbon</b>. Bisa membuatmu sedikit lebih cepat di balapan, tapi mahal, cepat aus, dan tidak perlu untuk latihan harian.</li>
  <li><b>Foam roller</b> untuk membantu otot terasa lebih lentur setelah lari.</li>
</ul>
<p class="note">Aturan emas sebelum balapan: jangan memakai apa pun yang baru di hari H. Coba dulu sepatu, pakaian, dan gel energi di beberapa latihan.</p>`,
    },
    {
      slug: 'memilih-sepatu',
      title: 'Cara Memilih Sepatu Lari',
      label: 'Perlengkapan',
      excerpt: 'Road atau trail, empuk atau responsif, drop dan stack. Cara memilih sepatu yang pas, dan kapan harus menggantinya.',
      body: `
<p>Tidak ada satu sepatu terbaik untuk semua orang. Penelitian menunjukkan bahwa <b>rasa nyaman</b> saat mencoba sepatu adalah salah satu patokan terbaik untuk memilih. Berikut hal-hal yang perlu kamu tahu agar pilihannya lebih terarah.</p>

<h3>Road atau trail</h3>
<p><b>Sepatu road</b> untuk aspal, beton, dan trek. <b>Sepatu trail</b> punya sol bergerigi (lug) yang mencengkeram tanah, lumpur, dan batu, dan biasanya lebih kokoh. Memakai sepatu trail di aspal membuat lug cepat aus.</p>

<h3>Istilah yang sering muncul</h3>
<ul>
  <li><b>Cushioning</b>: seberapa empuk. Sepatu "max cushion" nyaman untuk lari jauh dan pemulihan.</li>
  <li><b>Stack height</b>: tebal sol di bawah kaki. Makin tinggi, biasanya makin empuk tapi kurang stabil.</li>
  <li><b>Drop</b>: selisih tinggi sol tumit dan depan, umumnya 0 sampai 12 mm. Kalau terbiasa drop tinggi, pindah ke drop rendah sebaiknya bertahap, karena beban betis dan tendon Achilles bertambah.</li>
  <li><b>Neutral atau stability</b>: sepatu stability punya penopang tambahan untuk kaki yang banyak masuk ke dalam (overpronasi). Sebagian besar pelari cocok dengan sepatu neutral.</li>
  <li><b>Pelat karbon</b>: biasanya di sepatu balap, membuat langkah terasa memantul.</li>
</ul>

<h3>Tips saat mencoba</h3>
<ul>
  <li>Coba di sore hari, saat kaki sedikit membengkak, dan pakai kaus kaki lari.</li>
  <li>Sisakan ruang sekitar satu lebar ibu jari di depan jari terpanjang. Kaki bergeser maju saat berlari, terutama di turunan.</li>
  <li>Tumit tidak boleh terangkat dan bagian tengah kaki harus terkunci, tapi tidak menekan.</li>
  <li>Kalau bisa, coba berlari sebentar di toko atau treadmill.</li>
  <li>Ukuran tiap merek bisa berbeda. Jangan terpaku pada nomor.</li>
</ul>

<h3>Kapan harus ganti</h3>
<p>Patokan umum adalah sekitar <b>500 sampai 800 km</b>, tergantung berat badan, gaya lari, dan jenis sepatu. Tanda-tanda lain: sol luar aus sampai busanya terlihat, busa terasa "mati" atau keras, ada kerutan dalam di busa samping, atau kaki dan lutut mulai sering pegal padahal latihan tidak berubah. Catatan jarak di Stride bisa membantumu memperkirakan kapan sepatumu sudah tua.</p>`,
    },
    {
      slug: 'lari-cuaca-panas',
      title: 'Lari di Cuaca Panas dan Lembap ala Jakarta',
      label: 'Kesehatan & Cedera',
      excerpt: 'Panas dan lembap membuat lari terasa jauh lebih berat. Kapan sebaiknya lari, cara menyesuaikan pace, dan tanda bahaya heat stroke.',
      body: `
<p>Di udara panas, tubuh mengirim lebih banyak darah ke kulit untuk membuang panas, sehingga jantung harus bekerja lebih keras untuk pace yang sama. Di udara lembap, keringat sulit menguap, sehingga pendinginan tubuh kurang efektif. Hasilnya: HR lebih tinggi dan pace terasa lebih berat. Itu normal, bukan berarti kamu tidak bugar.</p>

<h3>Atur waktunya</h3>
<ul>
  <li>Lari <b>pagi sebelum sekitar pukul 07.00</b> atau <b>sore menjelang matahari terbenam</b>. Hindari tengah hari.</li>
  <li>Pilih rute teduh, seperti taman atau jalan dengan pepohonan.</li>
  <li>Cek <b>kualitas udara (AQI)</b> sebelum lari. Kalau AQI di atas 150 (kategori tidak sehat), sebaiknya kurangi lari keras di luar ruangan atau pindah ke treadmill.</li>
</ul>

<h3>Sesuaikan pace</h3>
<p>Lari berdasarkan rasa usaha atau HR, bukan target pace. Di hari yang panas dan lembap, wajar kalau pace sama terasa jauh lebih berat atau kamu perlu melambat 10 sampai 30 detik per km, bahkan lebih.</p>

<h3>Minum</h3>
<ul>
  <li>Datang dalam keadaan cukup minum: urine berwarna kuning muda adalah tanda yang baik.</li>
  <li>Untuk lari lebih dari 45 sampai 60 menit, bawa minum dan pertimbangkan elektrolit (garam), terutama kalau keringatmu banyak atau meninggalkan bekas putih di baju.</li>
  <li>Jangan berlebihan. Minum jauh melebihi rasa haus selama berjam-jam juga berbahaya (hiponatremia).</li>
</ul>

<h3>Aklimatisasi</h3>
<p>Tubuh beradaptasi dengan panas dalam sekitar <b>10 sampai 14 hari</b> berlatih rutin di cuaca panas: keringat keluar lebih awal dan HR lebih rendah. Kalau baru pindah dari daerah sejuk atau habis lama tidak lari, mulailah pendek dan santai.</p>

<h3>Tanda bahaya</h3>
<p><b>Kelelahan panas (heat exhaustion):</b> pusing, mual, sakit kepala, lemas, kulit dingin dan lembap, kram. Berhenti, pindah ke tempat teduh, minum, dan dinginkan tubuh.</p>
<p><b>Heat stroke</b> adalah keadaan darurat: bingung atau bicara tidak jelas, perilaku aneh, pingsan, atau suhu tubuh sangat tinggi. Hubungi <b>112</b> atau <b>119</b>, dan segera dinginkan tubuhnya dengan air dingin atau es sambil menunggu bantuan.</p>`,
    },
    {
      slug: 'pemanasan-dan-cedera',
      title: 'Pemanasan, Pendinginan, dan Cedera yang Sering Dialami Pelari',
      label: 'Kesehatan & Cedera',
      excerpt: 'Pemanasan dinamis 5 menit, kenapa lonjakan jarak berbahaya, dan mengenali shin splints, runner\'s knee, sampai plantar fasciitis.',
      body: `
<h3>Pemanasan: dinamis, bukan statis</h3>
<p>Sebelum lari, gerakkan otot, jangan menahan peregangan lama. Peregangan statis panjang sebelum lari tidak terbukti mencegah cedera. Contoh pemanasan 5 sampai 10 menit:</p>
<ol>
  <li>Jalan cepat atau jogging pelan 3 sampai 5 menit.</li>
  <li>Leg swing depan-belakang dan samping, 10 kali per kaki.</li>
  <li>High knees dan butt kicks, masing-masing sekitar 20 meter.</li>
  <li>Walking lunges, 8 kali per kaki.</li>
  <li>Untuk latihan cepat: tambah 2 sampai 4 strides.</li>
</ol>

<h3>Pendinginan</h3>
<p>Akhiri dengan jogging pelan atau jalan 5 sampai 10 menit. Peregangan ringan setelah lari boleh dilakukan kalau terasa enak, terutama untuk betis, paha belakang, dan pinggul.</p>

<h3>Penyebab utama cedera: terlalu banyak, terlalu cepat</h3>
<p>Sebagian besar cedera lari adalah cedera "overuse": beban naik lebih cepat dari kemampuan tulang, tendon, dan otot beradaptasi. Aturan populer "jangan naik lebih dari 10% per minggu" bukan hukum pasti, tapi lonjakan besar memang berisiko. Sebuah studi pada pelari pemula di Denmark mengaitkan kenaikan jarak lebih dari 30% dalam dua minggu dengan risiko cedera yang lebih tinggi. Fitur <b>Suggest run</b> di Stride memperingatkan saat jarak mingguanmu melonjak.</p>

<h3>Cedera yang sering terjadi</h3>
<table>
  <thead><tr><th>Cedera</th><th>Gejala</th></tr></thead>
  <tbody>
    <tr><td>Shin splints</td><td>Nyeri di sepanjang sisi dalam tulang kering, sering di awal mulai lari</td></tr>
    <tr><td>Runner's knee</td><td>Nyeri di sekitar atau belakang tempurung lutut, makin terasa saat turun tangga atau jongkok</td></tr>
    <tr><td>IT band syndrome</td><td>Nyeri di sisi luar lutut, sering muncul di tengah lari</td></tr>
    <tr><td>Plantar fasciitis</td><td>Nyeri di tumit atau telapak kaki, paling terasa di langkah pertama pagi hari</td></tr>
    <tr><td>Tendinopati Achilles</td><td>Nyeri dan kaku di tendon belakang pergelangan kaki</td></tr>
    <tr><td>Stress fracture</td><td>Nyeri tulang di satu titik yang makin parah, bahkan saat jalan atau istirahat</td></tr>
  </tbody>
</table>
<p>Nyeri ringan yang hilang setelah pemanasan biasanya boleh dipantau sambil mengurangi jarak. Hentikan lari dan periksakan ke dokter atau fisioterapis kalau nyeri <b>membuatmu pincang</b>, <b>makin parah saat lari</b>, <b>terasa di satu titik tulang</b>, <b>ada bengkak</b>, atau <b>tidak membaik setelah satu sampai dua minggu</b>.</p>

<h3>Latihan kekuatan</h3>
<p>Dua sesi latihan kekuatan seminggu, masing-masing 20 sampai 30 menit, membantu tubuh menahan beban lari: squat, lunge, calf raise, glute bridge, plank, dan side plank. Tidak perlu gym. Berat badan sendiri sudah cukup untuk mulai.</p>`,
    },
    {
      slug: 'makan-dan-minum',
      title: 'Makan dan Minum Sebelum, Saat, dan Sesudah Lari',
      label: 'Nutrisi',
      excerpt: 'Kapan makan sebelum lari, kapan perlu gel atau minuman isotonik, dan apa yang dimakan setelahnya. Dengan contoh makanan sehari-hari.',
      body: `
<p>Untuk lari santai di bawah satu jam, kebanyakan orang tidak butuh makanan atau minuman khusus. Nutrisi mulai berpengaruh besar di lari yang lebih panjang atau lebih keras.</p>

<h3>Sebelum lari</h3>
<ul>
  <li><b>2 sampai 3 jam sebelum:</b> makan biasa yang kaya karbohidrat, cukup protein, tidak terlalu berlemak atau pedas. Contoh: nasi dengan lauk ayam atau telur, roti dengan selai kacang.</li>
  <li><b>30 sampai 60 menit sebelum:</b> camilan kecil yang mudah dicerna, seperti pisang, roti tawar dengan madu, atau beberapa butir kurma.</li>
  <li><b>Lari pagi:</b> lari santai pendek dalam keadaan perut kosong umumnya tidak masalah. Untuk lari jauh atau keras, makan sedikit dulu.</li>
</ul>

<h3>Saat lari</h3>
<ul>
  <li><b>Kurang dari 60 menit:</b> cukup air, kalau perlu.</li>
  <li><b>60 sampai 150 menit:</b> sekitar <b>30 sampai 60 gram karbohidrat per jam</b>. Satu gel energi biasanya berisi 20 sampai 30 gram. Pisang ukuran sedang sekitar 25 gram.</li>
  <li><b>Lebih dari 2,5 jam (mis. marathon):</b> sebagian pelari bisa menyerap sampai sekitar 90 gram per jam dengan campuran glukosa dan fruktosa, tapi perut perlu dilatih dulu di long run.</li>
  <li>Minum sesuai rasa haus. Di cuaca panas atau keringat banyak, minuman isotonik atau tablet elektrolit membantu mengganti garam.</li>
</ul>

<h3>Sesudah lari</h3>
<ul>
  <li>Dalam satu sampai dua jam, makan <b>karbohidrat dan protein</b>. Sekitar 20 sampai 25 gram protein sudah cukup untuk kebanyakan orang.</li>
  <li>Contoh: nasi dengan ayam atau ikan dan sayur, gado-gado dengan telur, susu cokelat, roti dengan telur, atau yogurt dengan buah.</li>
  <li>Minum untuk mengganti cairan yang hilang. Menimbang badan sebelum dan sesudah lari bisa menunjukkan seberapa banyak cairan yang keluar.</li>
</ul>

<h3>Kafein</h3>
<p>Kopi sekitar 30 sampai 60 menit sebelum lari bisa membuat usaha terasa lebih ringan bagi banyak orang. Kalau perutmu sensitif, coba dulu di latihan, bukan di hari balapan.</p>
<p class="note">Kebutuhan tiap orang berbeda, apalagi kalau kamu punya kondisi seperti diabetes atau gangguan ginjal. Untuk itu, konsultasikan dengan dokter atau ahli gizi.</p>`,
    },
    {
      slug: 'teknik-lari',
      title: 'Teknik Lari: Postur, Cadence, dan Pijakan',
      label: 'Latihan',
      excerpt: 'Tidak ada satu teknik sempurna, tapi beberapa hal kecil membuat lari lebih efisien dan ringan untuk sendi.',
      body: `
<p>Setiap orang punya gaya lari sendiri, dan tubuh cenderung menemukan cara yang efisien dengan sendirinya. Mengubah teknik secara drastis justru bisa memicu cedera. Tapi beberapa penyesuaian kecil umumnya membantu.</p>

<h3>Postur</h3>
<ul>
  <li>Tegak dan rileks, condong sedikit ke depan dari pergelangan kaki, bukan dari pinggang.</li>
  <li>Pandangan ke depan sekitar 10 sampai 20 meter, bukan ke kaki.</li>
  <li>Bahu turun dan rileks. Kalau bahu mulai naik ke telinga, kibaskan sebentar.</li>
  <li>Lengan diayun ke depan dan belakang dengan siku kira-kira 90 derajat, tidak menyilang di depan badan.</li>
</ul>

<h3>Cadence</h3>
<p>Cadence adalah jumlah langkah per menit (spm). Angka 180 spm sering disebut sebagai "ideal". Asalnya dari pengamatan pelatih Jack Daniels pada pelari elite di Olimpiade 1984, padahal mereka berlari jauh lebih cepat dari pelari rekreasi. Cadence wajar bervariasi menurut tinggi badan dan kecepatan.</p>
<p>Yang lebih berguna: kalau langkahmu panjang dan berat, menaikkan cadence sekitar <b>5 sampai 10%</b> dari angka sekarang terbukti mengurangi beban di lutut dan pinggul. Caranya: langkah sedikit lebih pendek dan lebih cepat, bukan lari lebih kencang. Banyak jam lari menampilkan cadence, dan metronom di HP bisa membantu.</p>

<h3>Pijakan kaki</h3>
<p>Perdebatan "mendarat di tumit atau di depan" sering dibesar-besarkan. Yang lebih penting adalah <b>di mana</b> kaki mendarat: usahakan dekat di bawah tubuh, bukan jauh di depan dengan kaki lurus (overstriding). Overstriding seperti mengerem di setiap langkah. Menaikkan cadence sedikit biasanya otomatis mengurangi overstriding.</p>

<h3>Napas</h3>
<p>Bernapas lewat hidung dan mulut sekaligus itu wajar. Saat lari santai, napas harus cukup tenang untuk bicara. Kalau sering kram di samping perut (side stitch), coba napas lebih dalam dari perut dan hembuskan saat kaki yang berlawanan mendarat.</p>

<h3>Latihan untuk teknik</h3>
<ul>
  <li><b>Strides</b> 4 sampai 6 kali setelah easy run.</li>
  <li><b>Drills</b> seperti A-skip, high knees, dan butt kicks sebelum latihan cepat.</li>
  <li><b>Hill repeats</b> pendek, yang secara alami memperbaiki postur dan ayunan lengan.</li>
  <li><b>Latihan kekuatan</b> untuk pinggul dan betis, yang membuat teknik lebih stabil saat lelah.</li>
</ul>`,
    },
    {
      slug: 'race-pertama',
      title: 'Persiapan Race Pertama: 5K atau 10K',
      label: 'Race',
      excerpt: 'Seminggu sebelum, malam sebelum, dan pagi hari balapan. Checklist dan strategi pacing supaya race pertamamu menyenangkan.',
      body: `
<p>Race pertama tidak harus cepat. Targetkan untuk <b>finish dengan senyum</b>, lalu pakai hasilnya sebagai patokan untuk latihan berikutnya.</p>

<h3>Seminggu sebelum</h3>
<ul>
  <li>Kurangi jarak latihan sekitar 30 sampai 50% (taper), tapi tetap lari beberapa kali dengan sedikit bagian cepat.</li>
  <li>Tidur cukup, terutama dua malam sebelum race.</li>
  <li>Pelajari rute, lokasi start, waktu start, dan tempat parkir atau transportasi.</li>
  <li>Ambil race pack (nomor dada atau bib) sesuai jadwal.</li>
</ul>

<h3>Malam sebelum</h3>
<ul>
  <li>Siapkan semuanya: sepatu, pakaian yang sudah pernah dipakai lari, bib dan peniti, jam yang sudah diisi daya, anti-lecet, uang atau e-wallet.</li>
  <li>Makan malam biasa yang kamu kenal. Untuk 5K dan 10K, carb loading besar-besaran tidak diperlukan.</li>
</ul>

<h3>Pagi hari</h3>
<ul>
  <li>Bangun cukup awal untuk sarapan ringan 1,5 sampai 3 jam sebelum start, misalnya roti, pisang, atau kurma.</li>
  <li>Datang 45 sampai 60 menit sebelum start. Antrean toilet bisa panjang.</li>
  <li>Pemanasan 10 menit: jogging pelan, beberapa drill, dan 2 sampai 3 strides.</li>
  <li>Masuk ke barisan start sesuai perkiraan pace-mu, jangan di paling depan.</li>
</ul>

<h3>Strategi pacing</h3>
<p>Kesalahan paling umum: start terlalu cepat karena terbawa suasana. Coba ini:</p>
<ul>
  <li><b>Kilometer pertama:</b> sedikit lebih lambat dari target.</li>
  <li><b>Tengah:</b> stabil di pace target.</li>
  <li><b>Akhir:</b> kalau masih ada tenaga, percepat bertahap. Paruh kedua yang lebih cepat dari paruh pertama disebut <i>negative split</i>.</li>
</ul>
<p>Belum tahu target pace? Pakai <a href="#/post/pace-dan-kecepatan">kalkulator pace</a> dengan hasil lari terbaikmu, atau lari dengan usaha "berat tapi masih terkendali".</p>

<h3>Setelah finish</h3>
<p>Terus berjalan beberapa menit, minum, dan makan. Catat hasilnya di Stride. Dua sampai tiga hari setelahnya, lari santai saja atau istirahat.</p>
<p class="note">Ingat aturan emas: tidak ada yang baru di hari H. Sepatu, pakaian, sarapan, dan gel harus sudah dicoba saat latihan.</p>`,
    },
    {
      slug: 'istilah-lari',
      title: 'Kamus Istilah Lari',
      label: 'Pemula',
      excerpt: 'PB, DNF, negative split, VO2max, taper, DOMS, dan istilah lain yang sering muncul di aplikasi dan obrolan pelari.',
      body: `
<p>Istilah-istilah yang sering kamu temui di aplikasi lari, grup lari, dan halaman balapan.</p>
<dl class="glossary">
  <dt>PB / PR</dt><dd>Personal best / personal record: waktu terbaikmu di suatu jarak.</dd>
  <dt>Pace</dt><dd>Waktu per kilometer (atau per mil), misalnya 6:30/km.</dd>
  <dt>Split</dt><dd>Waktu untuk satu bagian lari, misalnya waktu setiap kilometer.</dd>
  <dt>Negative split</dt><dd>Paruh kedua lari lebih cepat dari paruh pertama. Strategi pacing yang baik.</dd>
  <dt>Cadence</dt><dd>Jumlah langkah per menit.</dd>
  <dt>Easy run</dt><dd>Lari santai yang masih bisa sambil mengobrol.</dd>
  <dt>Tempo / threshold</dt><dd>Lari "nyaman tapi berat" di sekitar ambang laktat.</dd>
  <dt>Interval / repeats</dt><dd>Repetisi cepat dengan jeda pemulihan.</dd>
  <dt>Strides</dt><dd>Akselerasi pendek 15 sampai 20 detik untuk melatih kecepatan dan teknik.</dd>
  <dt>VO2max</dt><dd>Jumlah oksigen maksimal yang bisa dipakai tubuh. Ukuran kapasitas aerobik. Angka di jam lari adalah perkiraan.</dd>
  <dt>Ambang laktat</dt><dd>Intensitas di mana laktat mulai menumpuk lebih cepat dari yang bisa dibuang tubuh.</dd>
  <dt>HR / HRmax / RHR</dt><dd>Detak jantung, detak jantung maksimal, dan detak jantung istirahat.</dd>
  <dt>Elevation gain</dt><dd>Total tanjakan yang kamu daki selama lari, dalam meter.</dd>
  <dt>Taper</dt><dd>Mengurangi jarak latihan menjelang balapan agar tubuh segar di hari H.</dd>
  <dt>Carb loading</dt><dd>Makan lebih banyak karbohidrat 1 sampai 3 hari sebelum balapan panjang, seperti half marathon dan marathon.</dd>
  <dt>Bonk / hitting the wall</dt><dd>Lemas mendadak di lari panjang karena cadangan glikogen habis.</dd>
  <dt>DOMS</dt><dd>Delayed onset muscle soreness: pegal otot yang muncul 1 sampai 3 hari setelah latihan berat atau baru.</dd>
  <dt>Bib</dt><dd>Nomor dada peserta balapan, sering berisi chip pencatat waktu.</dd>
  <dt>Gun time / chip time</dt><dd>Waktu sejak pistol start / waktu sejak kamu melewati garis start sampai finish.</dd>
  <dt>COT</dt><dd>Cut-off time: batas waktu untuk menyelesaikan balapan.</dd>
  <dt>DNF / DNS</dt><dd>Did not finish / did not start.</dd>
  <dt>Pacer</dt><dd>Pelari yang ditugaskan berlari di pace tertentu untuk membantu peserta mencapai target waktu.</dd>
  <dt>5K, 10K, HM, FM</dt><dd>5 km, 10 km, half marathon (21,1 km), full marathon (42,2 km).</dd>
</dl>`,
    },
  ];

  // ---------- Helpers ----------
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const words = (html) => html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  POSTS.forEach((p) => { p.minutes = Math.max(1, Math.round(words(p.body) / 200)); });
  const labels = [...new Set(POSTS.map((p) => p.label))];
  const slugLabel = (l) => encodeURIComponent(l);
  const fmtTime = (sec) => {
    sec = Math.round(sec);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  };
  const num = (n, p = 1) => n.toLocaleString('id-ID', { maximumFractionDigits: p, minimumFractionDigits: p });
  const parseTime = (s) => {
    const parts = String(s).trim().split(/[:.]/).map(Number);
    if (!parts.length || parts.some((x) => Number.isNaN(x)) || parts.length > 3) return NaN;
    return parts.reduce((a, v) => a * 60 + v, 0);
  };

  // ---------- Rendering ----------
  const main = $('#blog-main');
  let query = '';

  function postCard(p) {
    return `
      <article class="card post-card">
        <a class="post-label" href="#/label/${slugLabel(p.label)}">${esc(p.label)}</a>
        <h3><a href="#/post/${p.slug}">${esc(p.title)}</a></h3>
        <p class="post-meta">${p.minutes} menit baca</p>
        <p>${esc(p.excerpt)}</p>
        <a class="read-more" href="#/post/${p.slug}">Baca selengkapnya &rsaquo;</a>
      </article>`;
  }

  function renderList(label) {
    const q = query.toLowerCase();
    const list = POSTS.filter((p) => (!label || p.label === label)
      && (!q || `${p.title} ${p.excerpt} ${p.label} ${p.body.replace(/<[^>]+>/g, ' ')}`.toLowerCase().includes(q)));
    const heading = label ? `Label: ${esc(label)}` : q ? `Hasil pencarian "${esc(query)}"` : 'Artikel terbaru';
    main.innerHTML = `
      <div class="list-head">
        <h2>${heading}</h2>
        ${label || q ? '<a href="#/" class="muted" data-clear>Tampilkan semua</a>' : ''}
      </div>
      ${list.length ? list.map(postCard).join('') : '<div class="card empty-card">Tidak ada artikel yang cocok. Coba kata lain.</div>'}`;
    document.title = label ? `${label} · Serba-serbi Lari` : 'Serba-serbi Lari · Stride';
  }

  function renderPost(slug) {
    const i = POSTS.findIndex((p) => p.slug === slug);
    if (i < 0) { renderList(); return; }
    const p = POSTS[i], prev = POSTS[i - 1], next = POSTS[i + 1];
    main.innerHTML = `
      <article class="card post">
        <a class="post-label" href="#/label/${slugLabel(p.label)}">${esc(p.label)}</a>
        <h2 class="post-title">${esc(p.title)}</h2>
        <p class="post-meta">${p.minutes} menit baca</p>
        <div class="post-body">${p.body}</div>
      </article>
      <nav class="post-nav" aria-label="Artikel lain">
        ${prev ? `<a class="card" href="#/post/${prev.slug}"><span class="muted">&lsaquo; Sebelumnya</span>${esc(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a class="card next" href="#/post/${next.slug}"><span class="muted">Berikutnya &rsaquo;</span>${esc(next.title)}</a>` : '<span></span>'}
      </nav>
      <p><a href="#/">&lsaquo; Kembali ke semua artikel</a></p>`;
    document.title = `${p.title} · Serba-serbi Lari`;
    main.querySelectorAll('.post-body > table').forEach((t) => {
      const w = document.createElement('div');
      w.className = 'table-wrap';
      t.replaceWith(w);
      w.appendChild(t);
    });
    main.querySelectorAll('[data-tool="pace"]').forEach(mountPaceTool);
    main.querySelectorAll('[data-tool="hr"]').forEach(mountHrTool);
  }

  function renderSidebar(current) {
    $('#label-list').innerHTML = labels.map((l) => {
      const n = POSTS.filter((p) => p.label === l).length;
      return `<li><a href="#/label/${slugLabel(l)}" ${current === `label:${l}` ? 'aria-current="page"' : ''}>${esc(l)} <span class="muted">(${n})</span></a></li>`;
    }).join('');
    $('#side-posts').innerHTML = POSTS.map((p) =>
      `<li><a href="#/post/${p.slug}" ${current === `post:${p.slug}` ? 'aria-current="page"' : ''}>${esc(p.title)}</a></li>`).join('');
  }

  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [kind, ...rest] = h.split('/');
    const arg = decodeURIComponent(rest.join('/'));
    if (kind === 'post') { renderPost(arg); renderSidebar(`post:${arg}`); }
    else if (kind === 'label' && labels.includes(arg)) { renderList(arg); renderSidebar(`label:${arg}`); }
    else { renderList(); renderSidebar(''); }
  }

  // ---------- Calculators ----------
  function mountPaceTool(el) {
    el.className = 'tool card';
    el.innerHTML = `
      <div class="tool-inputs">
        <label class="field"><span>Jarak (km)</span>
          <input type="number" name="dist" min="0.1" step="0.01" value="5" inputmode="decimal">
        </label>
        <label class="field"><span>Waktu (j:mm:dd atau mm:dd)</span>
          <input type="text" name="time" value="33:20" autocomplete="off" inputmode="numeric">
        </label>
      </div>
      <div class="tool-presets" role="group" aria-label="Pilih jarak">
        ${[['5K', 5], ['10K', 10], ['Half', 21.0975], ['Marathon', 42.195]].map(([n, d]) => `<button type="button" class="btn btn-ghost" data-d="${d}">${n}</button>`).join('')}
      </div>
      <div class="tool-out" aria-live="polite"></div>`;
    const dist = el.querySelector('[name=dist]'), time = el.querySelector('[name=time]'), out = el.querySelector('.tool-out');
    const calc = () => {
      const d = Number(dist.value), t = parseTime(time.value);
      if (!(d > 0) || !(t > 0)) { out.innerHTML = '<p class="muted">Isi jarak dan waktu, misalnya 5 dan 33:20.</p>'; return; }
      const pace = t / d;
      const rows = [['5K', 5], ['10K', 10], ['Half marathon', 21.0975], ['Marathon', 42.195]]
        .map(([n, d2]) => { const t2 = t * (d2 / d) ** 1.06; return `<tr><td>${n}</td><td>${fmtTime(t2)}</td><td>${fmtTime(t2 / d2)}/km</td></tr>`; }).join('');
      out.innerHTML = `
        <div class="tool-result">
          <div><span class="muted">Pace</span><b>${fmtTime(pace)}/km</b></div>
          <div><span class="muted">Kecepatan</span><b>${num(3600 / pace)} km/jam</b></div>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Perkiraan</th><th>Waktu</th><th>Pace</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    };
    el.addEventListener('input', calc);
    el.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => { dist.value = Number(b.dataset.d); calc(); }));
    calc();
  }

  function mountHrTool(el) {
    el.className = 'tool card';
    el.innerHTML = `
      <div class="tool-inputs">
        <label class="field"><span>Usia</span>
          <input type="number" name="age" min="10" max="100" value="30" inputmode="numeric">
        </label>
        <label class="field"><span>HR istirahat (opsional)</span>
          <input type="number" name="rest" min="30" max="120" placeholder="mis. 60" inputmode="numeric">
        </label>
        <label class="field"><span>HR maks (opsional, kalau tahu)</span>
          <input type="number" name="max" min="120" max="230" placeholder="dari tes" inputmode="numeric">
        </label>
      </div>
      <div class="tool-out" aria-live="polite"></div>`;
    const age = el.querySelector('[name=age]'), rest = el.querySelector('[name=rest]'), max = el.querySelector('[name=max]'), out = el.querySelector('.tool-out');
    const zones = [['Z1', 0.5, 0.6, 'Pemulihan'], ['Z2', 0.6, 0.7, 'Easy, long run'], ['Z3', 0.7, 0.8, 'Sedang'], ['Z4', 0.8, 0.9, 'Tempo'], ['Z5', 0.9, 1, 'Interval']];
    const calc = () => {
      const a = Number(age.value), r = Number(rest.value) || 0, m = Number(max.value) || 0;
      if (!m && !(a >= 10 && a <= 100)) { out.innerHTML = '<p class="muted">Isi usia (10–100) atau HR maks.</p>'; return; }
      const hrMax = m || Math.round(208 - 0.7 * a);
      const karvonen = r >= 30 && r < hrMax - 40;
      const bpm = (pct) => Math.round(karvonen ? r + pct * (hrMax - r) : pct * hrMax);
      out.innerHTML = `
        <p class="muted">HR maks ${m ? 'dari isianmu' : 'perkiraan (Tanaka)'}: <b>${hrMax} bpm</b>. ${karvonen ? 'Zona dihitung dengan metode Karvonen dari HR istirahat.' : 'Isi HR istirahat untuk zona yang lebih personal.'}</p>
        <div class="table-wrap"><table><thead><tr><th>Zona</th><th>Detak jantung</th><th>Untuk</th></tr></thead>
        <tbody>${zones.map(([z, lo, hi, use]) => `<tr><td>${z}</td><td>${bpm(lo)}–${bpm(hi)} bpm</td><td>${use}</td></tr>`).join('')}</tbody></table></div>`;
    };
    el.addEventListener('input', calc);
    calc();
  }

  // ---------- Events ----------
  const search = $('#blog-search');
  let t;
  search.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      query = search.value.trim();
      if (location.hash && location.hash !== '#/') location.hash = '#/'; else renderList();
    }, 150);
  });
  main.addEventListener('click', (e) => { if (e.target.closest('[data-clear]')) { query = ''; search.value = ''; } });
  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); main.focus({ preventScroll: true }); });
  route();
})();
