# Pola: verifikasi dan atribusi

Aturan bukti untuk halaman `references/data/*.md`: apa yang boleh diklaim
"terverifikasi", apa yang harus ditandai sebagai bentuk saja, dan atribusi
apa yang wajib ikut di setiap keluaran.

## Dua kelas sumber, dua syarat bukti

| Kelas | Contoh | Syarat bukti | Label |
| --- | --- | --- | --- |
| **Publik tanpa kunci** | BMKG, Bank Indonesia, MyQuran | Wajib contoh **respons nyata** yang direkam saat implementasi | boleh `terverifikasi` |
| **Kunci milik pengguna** | BPS WebAPI, Bapanas | Wajib contoh **bentuk** respons yang ditandai jelas sebagai bentuk, plus perintah self-check; dilarang `terverifikasi` | `bentuk — verifikasi dengan key Anda` |

Repo tidak pernah menyimpan kredensial, key contoh, atau respons palsu. Nama
env var yang dipakai: `BPS_API_KEY`, `BAPANAS_API_KEY`.

Sumber yang gagal diverifikasi **dikeluarkan** dari skill — tidak ditulis
dengan label "kira-kira" atau "perlu dicek".

## Format wajib setiap halaman data

Setiap berkas `references/data/*.md` wajib memuat, dengan heading yang jelas:

1. **Sumber & portal resmi** — nama instansi + URL portal resmi (bukan hanya
   endpoint mentah).
2. **Contoh `curl` nyata** — perintah yang benar-benar bisa disalin dan
   dijalankan, lengkap dengan parameter contoh.
3. **Bentuk data** — JSON / XML / RSS, dan struktur tingkat atasnya.
4. **Kredensial** — tanpa kunci, atau nama env var yang dibutuhkan.
5. **Batas akses** — rate limit, kuota, atau syarat pemakaian.
6. **Atribusi** — kutipan atribusi wajib (lihat bawah).
7. **Tanggal verifikasi** — kapan respons nyata terakhir direkam.

## Atribusi wajib per instansi

Kutipan atribusi disalin apa adanya ke keluaran aplikasi pengguna.

- **BMKG** — "Sumber: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)".
- **BPS** — "Sumber: Badan Pusat Statistik (BPS)".
- **Bank Indonesia** — "Sumber: Bank Indonesia".
- **Badan Pangan Nasional** — "Sumber: Badan Pangan Nasional (Bapanas)".
- **Kemenag** — "Sumber: Kementerian Agama Republik Indonesia".

## Privasi

- Hasil yang memuat data pribadi (hasil pencarian **PDDikti**, **NIK**)
  diteruskan ke pengguna **tanpa disimpan dan tanpa di-cache**.
- Tidak ada contoh kode yang menulis data pribadi ke log, berkas, atau cache.
- Data gempa dan nowcast BMKG bersifat mendesak; jangan di-cache lintas hari.

## Kalau sumber berubah bentuk atau mati

1. Halaman wajib menyatakan **bentuk apa adanya** — jangan mengklaim normal.
2. Sediakan langkah penanganan: endpoint pengganti, mirror komunitas yang
   terbukti hidup, atau arahkan ke portal resmi.
3. Turunkan label: hapus `terverifikasi` sampai ada respons nyata yang baru
   direkam.
4. Perbarui tanggal verifikasi hanya setelah respons nyata baru direkam.

## Batas perilaku

Untuk pertanyaan nasihat pajak/kepatuhan, agen mengarahkan ke konsultan atau
DJP, bukan mengarang jawaban. Untuk data yang tidak lolos verifikasi, agen
berhenti dan menampilkan sumber resmi, bukan mengira-ngira.
