# BPJS — Kesehatan dan Ketenagakerjaan (pekerja penerima upah)

## Kegunaan

Tarif iuran dan batas upah untuk pekerja penerima upah (PPU) pada program
BPJS Kesehatan dan BPJS Ketenagakerjaan, dipakai untuk menghitung potongan
dan beban pemberi kerja per bulan.

## Dasar hukum

- JKK dan JKM — PP 44/2015.
- JP — PP 45/2015, dengan batas upah tertinggi disesuaikan tiap tahun.
- JHT — PP 46/2015.
- BPJS Kesehatan PPU — Perpres 82/2018 sebagaimana diubah terakhir oleh
  Perpres 59/2024.

Dasar hukum lengkap dan nomor surat edaran tercatat di dalam berkas JSON
pasangannya.

## Periode yang tersedia

| Periode | Berkas |
| --- | --- |
| Maret–Desember 2026 | [bpjs-2026.json](./bpjs-2026.json) |

**Periode Januari–Februari 2026 tidak tercakup.** Batas upah JP disesuaikan
setiap Maret mengikuti inflasi tahun sebelumnya, sehingga dua bulan pertama
2026 memakai batas upah yang berbeda dari batas yang berlaku sejak Maret.
Untuk bulan tersebut, berhenti, tampilkan sumber resmi, dan jangan pakai
angka registry ini. Periode setelah 2026 juga di luar cakupan.

## Cara membaca

- `jenis: "komponen"` — berkas memuat array `komponen`.
- Setiap komponen: `nama`, `batas_upah` (batas upah sebagai dasar
  perhitungan; `null` berarti tanpa batas), `tarif_pemberi`,
  `tarif_pekerja`.
- `tarif_pemberi` dan `tarif_pekerja` adalah pecahan desimal dari upah
  bulanan, bukan persen.
- `batas_upah` berupa rupiah per bulan; hitung dari `min(upah, batas_upah)`
  bila `batas_upah` tidak `null`.

## Pseudokode

```
fungsi hitungKomponen(upah, komponen, pihak):
  dasar = komponen.batas_upah == null ? upah : min(upah, komponen.batas_upah)
  tarif = pihak == "pemberi" ? komponen.tarif_pemberi : komponen.tarif_pekerja
  kembali dasar * tarif

fungsi pilihJKK(kelasRisiko):
  # kelasRisiko: sangat rendah | rendah | sedang | tinggi | sangat tinggi
  kembali komponen dengan nama == ("JKK risiko " + kelasRisiko)
```

## Catatan

- JKK dan JKM ditanggung sepenuhnya oleh pemberi kerja.
- JKK punya lima kelas risiko dengan tarif berbeda; kelas ditetapkan oleh
  BPJS Ketenagakerjaan, bukan dipilih sendiri oleh perusahaan.
- JHT dan JP ditanggung bersama pemberi kerja dan pekerja.
- JP dan BPJS Kesehatan PPU punya batas upah; komponen lain tidak.
- BPJS Kesehatan PPU dihitung dari upah tanpa batas bawah khusus di registry
  ini (batas bawah mengikuti upah minimum setempat).
- Ini estimasi iuran, bukan nasihat kepatuhan.

**Angka iuran ada di `bpjs-2026.json` — jangan salin angka ke dokumen ini.**
