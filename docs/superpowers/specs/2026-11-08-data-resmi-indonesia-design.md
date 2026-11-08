# Desain — Skill #5 `data-resmi-indonesia`

- Tanggal: 2026-11-08
- Repo: `irhamullah/indonesian-dev-skills` (basis v1.3.0, 4 skill, clean @ `d243ef8`)
- Status: **disetujui pemilik** (2026-11-08); belum ada kode yang ditulis

## 1. Niat dan alasan

Bundle ini sudah punya 4 skill yang kuat untuk payment, hosting, data/form, dan notifikasi. Yang belum ada: **jalan ke data resmi pemerintah Indonesia** (BMKG, BPS, BI, Bapanas, Kemenag, Kemendagri, PDDikti) dan **angka berperiode yang wajib dihitung** dalam aplikasi Indonesia (PTKP, PPh 21 TER, PPN, BPJS, UMP).

Dorongan asalnya: katalog APIPedia (`apipedia.id`, 53 API, satu token) dipakai sebagai *daftar cakupan*. Keputusan pemilik repo: **implementasi sendiri ke sumber primer**, tidak bergantung ke gateway APIPedia, lalu **tambah yang APIPedia belum punya**.

Konsekuensi yang diterima: begitu lepas dari perantara, bundle ini mewarisi ketidakstabilan hulu (berkas Kepmendagri berubah saat ada DOB, BI masih SOAP ASMX, panel harga Bapanas kadang maintenance). Karena itu desain ini menaruh bobot pada *cara memverifikasi*, bukan pada jumlah endpoint.

Bahaya utama yang harus dicegah desain ini bukan "satu skill berisi dua topik", tapi **angka tanpa provenance**. Angka pajak/iuran/UMP yang salah lebih merusak daripada endpoint yang belum jadi.

## 2. Sasaran

Goals:

1. Satu skill baru `data-resmi-indonesia` dengan dua bagian yang aturannya beda tegas: **Data** (umpan dari sumber resmi) dan **Aturan** (angka berperiode yang dihitung).
2. **Nol angka aturan di dalam prosa.** Semua angka hidup di registry bertanggal; `SKILL.md` hanya menunjuk ke sana.
3. Gate mekanis: `scripts/validate-registry.mjs` (node polos, tanpa dependency) gagal kalau ada record tanpa sumber/tanggal berlaku, atau rentang bracket bercelah/tumpang tindih.
4. Perilaku **menolak, bukan menebak**: periode yang tidak tercakup registry tidak dihitung; agen menampilkan sumber resminya.
5. Setiap keluaran hitung membawa sumber + tanggal berlaku + label estimasi.
6. Repo naik ke **v1.4.0**; README/AGENTS/CHANGELOG/QUICKSTART/CONTRIBUTING ikut diperbarui (bagian 7).

Non-goals:

- Integrasi yang butuh kredensial/akun berisiko: coretax, e-Faktur, pelaporan SPT, klaim BPJS, OSS/KBLI.
- Menyimpan atau men-cache **data pribadi** (hasil pencarian PDDikti, NIK) — hanya diteruskan, tidak dipersist.
- Duplikasi skill #3: wilayah, kode pos, NIK, NPWP, ongkir tetap di `indonesian-data-forms` dan hanya **dirujuk**.
- Menyalin isi katalog APIPedia.

Anti-goals (gagal walau secara teknis "jalan"):

- Mengeluarkan angka pajak/UMP tanpa sumber dan tanggal berlaku.
- Menghitung untuk tahun/periode di luar registry.
- Menjanjikan endpoint yang belum diverifikasi (tidak ada endpoint karangan di `references/`).
- Memasang angka aturan di `SKILL.md` atau di prosa `references/aturan/*.md`.

## 3. Batasan

| Batasan | Isi | Dampak desain |
|---|---|---|
| Runtime | node polos, tanpa dependency; sisanya Markdown + contoh kode | registry pakai **JSON**, bukan YAML, supaya validator tidak butuh parser pihak ketiga |
| Kredensial | BPS WebAPI dan Bapanas WebAPI wajib API key gratis | **key milik pengguna, bukan milik repo**: dokumen hanya menamai env var (`BPS_API_KEY`, dst.), tidak ada kredensial atau contoh respons palsu di repo |
| BMKG | 60 permintaan/menit/IP; atribusi BMKG wajib tampil | bagian Data wajib menulis batas + pola cache/debounce |
| Bank Indonesia | warisan SOAP ASMX (`wskursbi.asmx`), bukan REST | perlu pembungkus XML; dicatat sebagai risiko berubah |
| Perubahan tahunan | pajak, BPJS, UMP berubah tiap tahun; Kepmendagri wilayah berubah saat ada DOB | registry **per periode** + tanggal review, bukan satu tabel "terbaru" |
| Atribusi | BMKG, BPS, BI, Bapanas, Kemenag mensyaratkan pencantuman sumber | satu berkas pola `verifikasi-dan-atribusi.md` jadi acuan semua halaman |

## 4. Pendekatan yang dipertimbangkan

**A. Skill provider `apipedia-gateway-indonesia`** — ditolak. APIPedia sudah menerbitkan Agent Skill resmi (`apipedia.id/skills/apipedia/SKILL.md`, 180 operasi, dibangkitkan dari OpenAPI) plus MCP server. Menyalinnya melanggar prinsip repo sendiri di README: *"Original, not derivative — tidak copy/repackage existing skills"*.

**B. Dua skill terpisah** (`data-publik-indonesia` + `payroll-pajak-indonesia`) — rekomendasi awal saya, tapi ditolak oleh pemilik: harus satu skill, boleh ada item yang tidak diikutkan.

**C. Satu skill, dua bagian, pemisahan lewat bentuk artefak + pengaman mekanis** — **dipilih.** Yang dipisah bukan skill-nya, melainkan *di mana angka boleh hidup*: keluar dari prosa, masuk ke registry JSON bertanggal yang digerbangi validator, dengan perilaku menolak saat di luar cakupan.

Alasan C aman meski satu skill: risiko sesungguhnya terkonsentrasi pada angka, dan C memindahkan seluruh angka ke satu tempat yang bisa diperiksa mesin dan punya satu jalur keluar (menolak).

### 4.1 Keputusan yang saya ambil (bukan dari pemilik)

- **Skema registry per jenis, dengan pembeda `jenis`.** `jenis: bracket` (PPh 21 TER, PPN) — dicek celah/tumpang tindih di 0..∞ dan wajib punya entri penutup. `jenis: daftar` (PTKP ambang, UMP per provinsi) — dicek kelengkapan kunci, bukan rentang. `jenis: komponen` (BPJS: beberapa program dengan batas upah masing-masing) — dicek kelengkapan program. Validator memilih pemeriksaan dari field `jenis`; hanya `bracket` yang kena cek rentang.
- **Satu JSON per aturan per periode.** Nama berkas selalu berperiode (`pph21-ter-2026.json`, `umpp-2026.json`, dst.); berkas `.md` pasangannya satu per aturan dan menampilkan daftar periode yang tersedia. Tidak ada berkas "terbaru" tanpa tahun.
- **Cakupan pemeriksaan "tanpa angka di prosa".** Validator memindai `skills/data-resmi-indonesia/SKILL.md` dan `skills/data-resmi-indonesia/references/aturan/*.md`. Skill #1–#4 tidak dipindai (memang memuat contoh `Rp`/persen). `examples.md` **dikecualikan** supaya contoh payroll bisa konkret, dengan syarat setiap angka pada contoh membawa sumber + tanggal berlaku.
- **Kebijakan menyalin data pemerintah.** Yang ditulis di repo hanya fakta turunan minimum (mis. 38 angka UMP + nomor SK, daftar libur per tahun + nomor SKB), selalu dengan atribusi. Dataset besar (kode wilayah Kepmendagri, NPSN, direktori RS/kampus) **dirujuk, tidak di-dump** ke repo.
- **Jaringan tersedia.** Dibuktikan dalam sesi ini: unduhan ke `apipedia.id`, `data.bmkg.go.id`, dan `api.myquran.com` berhasil, jadi verifikasi endpoint saat implementasi bisa dilakukan langsung.
- **Kredensial milik pengguna.** Karena repo ini publik, tidak ada key yang didaftarkan atau disimpan. Contoh kode memakai env var; berkas data sumber berkey menyediakan perintah self-check untuk dijalankan pengguna dengan key-nya sendiri. Konsekuensinya: skill #5 tidak pernah mengklaim "terverifikasi" untuk sumber berkey.

## 5. Desain

### 5.1 Struktur berkas

```
skills/data-resmi-indonesia/
  SKILL.md                          # router: bagian Data vs bagian Aturan
  examples.md                       # contoh end-to-end (cuaca, libur+SLA, gaji bruto→neto)
  references/
    data/
      bmkg-gempa.md
      bmkg-cuaca.md
      bmkg-nowcast.md
      bps-statistik.md
      bi-kurs.md
      bapanas-pangan.md
      kalender-masehi-hijriah-jawa.md
      hari-libur-cuti-bersama.md
      jadwal-sholat.md
      direktori-sekolah-rs-kampus.md
    aturan/
      ptkp.md            ptkp-2026.json
      pph21-ter.md       pph21-ter-2026.json
      ppn.md             ppn-2026.json
      bpjs.md            bpjs-2026.json
      umpp.md            umpp-2026.json
    pola/
      registry-bertanggal.md
      verifikasi-dan-atribusi.md
  scripts/
    validate-registry.mjs
```

### 5.2 Bagian Data (umpan)

Setiap berkas `references/data/*.md` wajib memuat: sumber + portal resmi, contoh `curl` nyata, bentuk data (JSON/XML/RSS), kebutuhan kredensial, batas akses, kewajiban atribusi, dan tanggal verifikasi.

Dua kelas sumber, dengan **syarat bukti berbeda**:

- **publik tanpa kunci** (BMKG, BI, MyQuran): wajib contoh respons **nyata** yang direkam saat implementasi.
- **kunci milik pengguna** (BPS, Bapanas): wajib contoh bentuk respons yang **ditandai jelas sebagai bentuk, bukan rekaman**, plus perintah self-check yang bisa dijalankan pengguna dengan key-nya sendiri. Tidak boleh diberi label "terverifikasi".

| Topik | Sumber | Endpoint/bentuk | Kredensial | Status verifikasi |
|---|---|---|---|---|
| Gempa | BMKG Data Terbuka | `data.bmkg.go.id/DataMKG/TEWS/autogempa.json` (+`gempaterkini`, `gempadirasakan`; juga XML) — 3 jenis: M5.0+, dirasakan, berpotensi tsunami; shakemap `static.bmkg.go.id/[kode].jpg` | — | terverifikasi (halaman Data Terbuka) |
| Prakiraan cuaca | BMKG | `api.bmkg.go.id/publik/prakiraan-cuaca?adm4=31.71.03.1001` JSON, per 3 jam, 3 hari; kode wilayah level IV per Kepmendagri | — | terverifikasi (halaman Data Terbuka) |
| **Peringatan dini cuaca (nowcast)** | BMKG | `bmkg.go.id/alerts/nowcast/id` (RSS daftar provinsi) + `…/id/{kode}_alert.xml` (CAP XML, sampai kecamatan) | — | terverifikasi (halaman Data Terbuka) — **tidak ada di katalog APIPedia** |
| Statistik | BPS WebAPI | `webapi.bps.go.id/v1/api/list|view/model/data/domain/{kode}/var/{var}/key/{key}`; kode wilayah BPS (`0000` nasional) | API key gratis | terverifikasi (portal + dokumentasi) |
| Kurs & suku bunga | Bank Indonesia | `wskursbi.asmx` — `getSubKursJisdor1..4`, `getSubKursNonUSD_IDR*` (kurs acuan), `getSubKursLokal*`; BI-Rate via halaman indikator | — | terverifikasi (service description) |
| Harga pangan | Bapanas | `webapi.badanpangan.go.id` (wajib login) + `data.badanpangan.go.id` (dataset bulanan, rilis resmi) | API key / login | terverifikasi (portal); bentuk respons **perlu verifikasi saat implementasi** |
| Kalender Masehi/Hijriah/Jawa | penetapan Kemenag + perhitungan | konversi tabel/aritmetik; rujuk SKB 3 Menteri untuk tanggal resmi | — | perlu verifikasi saat implementasi |
| Hari libur & cuti bersama | SKB 3 Menteri | tabel per tahun; dipakai untuk hitung hari kerja/SLA | — | perlu verifikasi saat implementasi |
| Jadwal sholat | Kemenag (Bimasislam) | endpoint resmi **perlu verifikasi**; mirror komunitas `api.myquran.com/v2/sholat/kota/semua` terbukti hidup | mirror: — | mirror terverifikasi; sumber utama perlu verifikasi |
| Direktori sekolah/RS/kampus | Kemendikdasmen (DAPODIK/NPSN), Kemenkes (SIRS), PDDikti | pencarian publik per portal | — | perlu verifikasi saat implementasi |

Catatan lintas-skill: wilayah, kode pos, NIK, NPWP, ongkir **tidak** ditulis ulang di sini — `SKILL.md` menautkan ke `indonesian-data-forms`.

### 5.3 Bagian Aturan (registry)

Skema JSON (contoh bentuk, angka diisi saat implementasi dari sumber resmi):

```json
{
  "aturan": "PPh 21 tarif efektif rata-rata (TER) bulanan",
  "jenis": "bracket",
  "dasar_hukum": "PMK 168/2023",
  "berlaku_dari": "2026-01-01",
  "berlaku_sampai": null,
  "sumber": "https://www.pajak.go.id/...",
  "diverifikasi_pada": "2026-11-08",
  "kategori": {
    "A": [ { "batas_atas": 5400000, "tarif": 0 }, { "batas_atas": null, "tarif": 0.34 } ]
  }
}
```

Aturan yang mengikat semua registry:

- Field wajib: `aturan`, `jenis`, `dasar_hukum`, `berlaku_dari`, `sumber`, `diverifikasi_pada`.
- `batas_atas: null` hanya boleh pada entri terakhir (penutup rentang), dan hanya pada `jenis: bracket`.
- Rentang bracket harus menutup 0..∞ tanpa celah dan tanpa tumpang tindih.
- `berlaku_dari` tidak boleh di masa depan relatif hari validasi; `diverifikasi_pada` lebih tua dari 400 hari dianggap kedaluwarsa.
- Angka hanya boleh muncul di JSON. Berkas `.md` pasangannya menjelaskan aturan dan menautkan JSON-nya.

Perilaku agen (bagian Aturan):

1. Petakan tanggal transaksi → periode registry.
2. Kalau tidak ada record yang mencakup → **berhenti**, tampilkan sumber resmi, jangan menghitung.
3. Kalau record kedaluwarsa (`diverifikasi_pada` > 400 hari) → hitung boleh, tapi wajib menandai "perlu verifikasi ulang" beserta tanggal verifikasi terakhir.
4. Setiap keluaran menyertakan: dasar hukum, tanggal berlaku, sumber, dan label *estimasi — bukan nasihat pajak/kepatuhan*.

### 5.4 Gate: `scripts/validate-registry.mjs`

Node polos, tanpa dependency, dijalankan dari akar repo. Gagal (exit 1) kalau:

- ada berkas `references/aturan/*.json` yang gagal `JSON.parse`;
- ada field wajib yang hilang/kosong;
- bracket punya celah, tumpang tindih, atau tidak punya entri penutup;
- angka muncul di `.md` pasangan tanpa ada di JSON (deteksi sederhana: token numerik yang bukan bagian tautan/kode contoh);
- `berlaku_dari` di masa depan.

Ini yang membuat "satu skill" tetap aman: tabel setengah jadi tidak bisa masuk repo.

### 5.5 Atribusi, privasi, batas perilaku

- **Atribusi wajib** (BMKG, BPS, BI, Bapanas, Kemenag) ditulis sebagai bagian tetap di setiap halaman Data dan disalin ke output aplikasi pengguna.
- **Privasi:** hasil PDDikti/NIK diteruskan tanpa disimpan; tidak ada contoh kode yang menulis data pribadi ke log atau cache.
- **Batas agen:** untuk pertanyaan nasihat pajak/kepatuhan, agen mengarahkan ke konsultan/DJP, bukan mengarang jawaban.

## 6. Cakupan: diambil / ditambah / dibuang

| Diambil dari cakupan APIPedia (implementasi sendiri) | Tambahan yang APIPedia belum punya | Dibuang (keputusan pemilik: aman dulu) |
|---|---|---|
| Gempa, prakiraan cuaca, hari libur nasional, jadwal sholat, kalender Hijriah/Jawa, direktori sekolah/RS/kampus/PDDikti | BMKG **peringatan dini cuaca (nowcast/CAP)**, statistik **BPS**, **JISDOR + BI-Rate** (bukan ECB), **harga pangan Bapanas**, **UMP per provinsi**, aturan **PTKP/PPh 21 TER/PPN/BPJS** | coretax & e-Faktur, pelaporan SPT, aturan klaim BPJS, KBLI/OSS, **UMK per kabupaten/kota** |
| Kurs mata uang (diganti ke sumber BI) | | |

## 7. Perubahan repo lain (gerbong 3)

- `README.md` — tambah seksi **5. Data Resmi Indonesia** + daftar berkasnya; perbarui kalimat "Skills Included".
- `AGENTS.md` — baris tabel routing untuk `data-resmi-indonesia`; tambah di "Skills Overview"; sesuaikan blok instalasi bila perlu.
- `CHANGELOG.md` — isi `[Unreleased]` → **`[1.4.0] - 2026-11-08`**, plus tautan `compare/v1.3.0...v1.4.0` dan perbaikan tautan `[Unreleased]`.
- `QUICKSTART.md` — buang narasi basi ("skill pertama", langkah `git init` + `gh repo create`) dan ganti dengan kondisi repo sekarang (v1.4.0, 5 skill).
- `CONTRIBUTING.md` — hapus usulan skill yang sudah jadi (#1 dan #2 di daftar "High Priority" sudah terwujud sebagai skill #2 dan #3); perbaiki instruksi rilis karena `gh` tidak terpasang di mesin ini (pakai git + web/API).
- `docs/superpowers/specs/2026-11-08-data-resmi-indonesia-design.md` — dokumen ini, ikut di-commit.

### 7.1 Gerbong 2 — skill #1–#4 (rujukan silang + penyegaran isi)

Keputusan pemilik: dikerjakan, dengan metode **audit dulu, patch kemudian** — supaya "penyegaran" tidak berubah jadi penulisan ulang tanpa dasar.

1. **Inventaris.** Sisir 4 skill lama untuk klaim yang bisa basi: versi/endpoint API provider (Midtrans, Xendit, Doku, Meta Cloud API, gateway WA, ongkir), daftar provider, tautan mati, dan angka/kebijakan yang berperiode. Hasilnya satu daftar temuan.
2. **Serahkan daftar temuan ke pemilik** untuk diveto (pemilik memilih mana yang dipatch).
3. **Patch** hanya yang disetujui.
4. **Rujukan silang wajib** (bagian yang sudah objektif): `indonesian-data-forms` menunjuk ke `data-resmi-indonesia` untuk hari libur/hari kerja, kurs BI, UMP, dan aturan pajak; `data-resmi-indonesia` menunjuk balik untuk wilayah, kode pos, NIK, NPWP, ongkir. Tidak ada duplikasi isi di antara keduanya.

## 8. Terbuka (belum diputuskan)

1. Nama final skill — usul `data-resmi-indonesia`; keputusan saya, boleh diganti.
2. Jadwal sholat: sumber utama Kemenag vs mirror komunitas, diputuskan saat verifikasi.
3. Cakupan UMP: cukup 38 provinsi (tanpa UMK kabupaten/kota).

Diputuskan pemilik pada 2026-11-08:

- **Kredensial** — key milik pengguna; repo tidak menyimpan kredensial apa pun.
- **Gerbong 2** — dikerjakan: rujukan silang + penyegaran isi, dengan metode audit-first (§7.1).
- **Cakupan registry** — fokus 2026; tambah periode sebelumnya hanya bila sumbernya mudah diverifikasi; sisanya jalur menolak.

## 9. Yang diserahkan ke builder

- Verifikasi tiap endpoint di bagian 5.2 pada saat implementasi, dan **ganti "perlu verifikasi" hanya setelah ada contoh respons nyata**; yang gagal diverifikasi dikeluarkan dari skill, tidak ditulis.
- Isi registry dengan angka dari sumber resmi + `sumber` + `diverifikasi_pada`; jangan menulis angka dari ingatan.
- Bapanas: karena key milik pengguna, tulis perintah self-check + contoh bentuk yang ditandai; jangan mengaku terverifikasi.
- Tentukan sumber utama jadwal sholat.
- Konfirmasi berkas Kepmendagri terbaru untuk kode wilayah.
- Tulis `examples.md` dengan 3 contoh end-to-end yang benar-benar jalan.

## 10. Cara membuktikan selesai

1. `node skills/data-resmi-indonesia/scripts/validate-registry.mjs` → exit 0.
2. Uji menolak: minta hitung PPh 21 untuk tahun yang tidak ada di registry → agen menolak dan menampilkan sumber, bukan angka.
3. Uji cakupan: setiap angka di `references/aturan/*.md` ada padanannya di JSON.
4. Setiap berkas di `references/data/` punya ≥1 `curl` + atribusi. Sumber tanpa kunci: contoh respons **nyata**. Sumber berkey: contoh bentuk yang ditandai + perintah self-check.
5. Tidak ada endpoint berlabel "perlu verifikasi" yang tersisa; sumber berkey berlabel tegas "kredensial pengguna".
6. `CHANGELOG.md` 1.4.0 cocok dengan diff; `git status` bersih setelah commit.
