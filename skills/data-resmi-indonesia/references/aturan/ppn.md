# PPN — Pajak Pertambahan Nilai

## Kegunaan

Tarif Pajak Pertambahan Nilai atas penyerahan Barang Kena Pajak dan Jasa
Kena Pajak untuk periode 2026.

## Dasar hukum

PMK 131/2024 sebagai pelaksanaan UU 7/2021. Dasar hukum dan sumber
tercatat di dalam berkas JSON pasangannya.

## Periode yang tersedia

| Periode | Berkas |
| --- | --- |
| 2026 | [ppn-2026.json](./ppn-2026.json) |

Periode lain **tidak** tercakup registry ini.

## Cara membaca

- `kategori.umum` — untuk barang dan jasa yang **bukan** barang mewah.
  `tarif` di sini adalah tarif **efektif**, hasil dari tarif PPN dikalikan
  Dasar Pengenaan Pajak (DPP) nilai lain sebesar 11/12 dari harga jual
  atau nilai impor.
- `kategori.mewah` — untuk barang yang tergolong mewah (obyek PPnBM),
  dikenakan atas DPP normal (harga jual / nilai impor).
- `tarif` disimpan sebagai pecahan desimal, bukan persen.
- Entri `batas_atas: null` menandakan tarif berlaku tanpa batas nilai.

## Pseudokode

```
fungsi hitungPPN(dpp, mewah):
  kategori = mewah ? "mewah" : "umum"
  tarif    = ppn2026.kategori[kategori][0].tarif
  # untuk kategori umum, tarif sudah tarif efektif (DPP nilai lain)
  kembali dpp * tarif
```

## Catatan

- Jangan mencampur tarif efektif (umum) dengan tarif dikali DPP nilai lain:
  memilih salah satu saja agar tidak dihitung dua kali.
- Barang mewah spesifik diatur daftar tersendiri; klasifikasi mewah bukan
  urusan registry ini.
- Ini estimasi, bukan nasihat kepatuhan pajak.

## Sumber

Lihat field `sumber`, `dasar_hukum`, dan `diverifikasi_pada` di
`ppn-2026.json`.

**Angka tarif ada di `ppn-2026.json` — jangan salin angka ke dokumen ini.**
