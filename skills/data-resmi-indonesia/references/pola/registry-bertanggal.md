# Pola: registry bertanggal

Cara menaruh aturan berperiode (tarif, batas upah, upah minimum) supaya tidak
ada angka dari ingatan, tidak ada tabel setengah jadi, dan periode yang tidak
dicakup selalu ditolak.

## Prinsip

1. **Angka hanya boleh muncul di JSON.** Berkas `.md` pasangannya menjelaskan
   cara membaca dan menautkan JSON-nya. Gate `scripts/validate-registry.mjs`
   menegakkannya: token numerik aturan di prosa `.md` (atau di `SKILL.md`)
   menggagalkan validasi.
2. **Satu berkas per aturan per periode.** Nama berkas selalu memuat tahun
   (`ptkp-2026.json`, `bpjs-2026.json`, …). Tidak ada registry tanpa tahun.
3. **Angka ditulis dari sumber resmi + jejak provenance.** Jangan tulis angka
   dari ingatan. Field `sumber` dan `diverifikasi_pada` wajib terisi.

## Skema

Field wajib setiap registry: `aturan`, `jenis`, `dasar_hukum`, `berlaku_dari`,
`sumber`, `diverifikasi_pada`.

Field opsional: `berlaku_sampai` (`null` berarti tanpa batas diketahui).

`jenis` hanya boleh salah satu:

| `jenis` | Payload | Dipakai untuk |
| --- | --- | --- |
| `bracket` | `kategori.<KODE>: [{ batas_atas, tarif }]` | tarif berjenjang (PPh 21 TER, PPN) |
| `daftar` | `entri: [{ kunci, nilai, satuan }]` | daftar nilai per kunci (PTKP per status, UMP per provinsi) |
| `komponen` | `komponen: [{ nama, batas_upah, tarif_pemberi, tarif_pekerja }]` | iuran berkomponen (BPJS) |

Aturan bentuk:

- `batas_atas: null` hanya boleh pada entri terakhir sebuah kategori, dan
  hanya pada `jenis: bracket`. Ini penutup rentang.
- **Setiap kategori adalah jadwal lengkap yang berdiri sendiri.** PPh 21 TER
  punya tiga jadwal sekaligus (A/B/C); PPN punya `umum` dan `mewah`. Kontinuitas
  dicek per kategori, bukan digabung lintas kategori.
- Rentang bracket harus menutup `0..∞` tanpa celah dan tanpa tumpang tindih.
- `tarif` disimpan sebagai **pecahan desimal** (mis. `0.11`), bukan persen.
- `batas_upah: null` pada `komponen` berarti komponen tidak punya batas upah.

## Prosedur menambah periode baru

1. Cari sumber resmi periode baru (regulasi/SK/portal instansi).
2. Buat `<aturan>-<tahun>.json` baru; jangan menimpa berkas periode lama.
3. Isi field wajib; `berlaku_dari` = awal berlaku resmi (lebih sempit dari
   kalender bila ada perubahan di tengah tahun — lihat di bawah).
4. Tulis/perbarui `.md` pasangannya: kegunaan, dasar hukum, tabel periode,
   cara membaca, pseudokode, catatan. Tanpa angka aturan.
5. Jalankan `node skills/data-resmi-indonesia/scripts/validate-registry.mjs`
   dari akar repo; perbaiki sampai exit 0.
6. Commit JSON + `.md` bersama, dengan dasar hukum di pesan commit.

**Perubahan di tengah tahun.** Kalau satu nilai berubah bukan pada 1 Januari
(mis. batas upah JP disesuaikan tiap Maret), schema tidak punya dimensi
per-periode di dalam satu berkas. Berkas dikunci ke rentang yang datanya
seragam (`berlaku_dari` = tanggal penyesuaian, `berlaku_sampai` = akhir
tahun), dan bulan di luar rentang itu **ditolak**. Lebih baik menolak
sebagian daripada mengembalikan angka yang salah untuk sebagian bulan.

## Tiga perilaku wajib agen

1. **Di luar cakupan → menolak.** Petakan tanggal transaksi ke periode
   registry. Kalau tidak ada record yang mencakup, **berhenti**, tampilkan
   sumber resmi, dan jangan menghitung dengan tabel periode lain.
2. **Kedaluwarsa → boleh jalan, wajib ditandai.** Kalau `diverifikasi_pada`
   lebih tua dari 400 hari, hitung boleh, tetapi keluaran wajib menandai
   *"perlu verifikasi ulang"* beserta tanggal verifikasi terakhir.
3. **Aturan belum terbit → menolak.** Kalau dasar hukum periode itu belum ada
   (mis. SKB hari libur tahun depan belum terbit), JANGAN mengembalikan tahun
   itu apa adanya. Berhenti dan arahkan ke sumber resmi.

## Format jejak keluaran

Setiap keluaran bagian Aturan wajib menyertakan:

- **dasar hukum** — dari field `dasar_hukum`;
- **berlaku_dari** — dari field `berlaku_dari` (dan `berlaku_sampai` bila ada);
- **sumber** — dari field `sumber` (URL resmi);
- **label** — `estimasi — bukan nasihat pajak/kepatuhan`.

Untuk pertanyaan yang meminta nasihat pajak/kepatuhan, arahkan ke konsultan
atau DJP; jangan mengarang jawaban.
