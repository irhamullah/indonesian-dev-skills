# PPh 21 — Tarif Efektif Rata-rata (TER) bulanan

## Kegunaan

Menghitung pemotongan PPh Pasal 21 pegawai tetap untuk setiap masa pajak
selain masa pajak terakhir, dengan mengalikan penghasilan bruto bulanan
dengan tarif efektif pada kategori yang sesuai.

## Dasar hukum

PMK 168/2023. Aturan ini berlaku sejak awal tahun pajak 2024 dan belum
diganti; tabelnya masih dipakai untuk periode 2026. Dasar hukum tercatat
di dalam berkas JSON pasangannya.

## Periode yang tersedia

| Periode | Berkas |
| --- | --- |
| 2026 | [pph21-ter-2026.json](./pph21-ter-2026.json) |

Periode lain **tidak** tercakup registry ini. Untuk periode di luar cakupan,
berhenti, tampilkan sumber resmi, dan jangan menghitung dengan tabel 2026.

## Cara membaca

- `kategori` berisi tiga jadwal terpisah: `A`, `B`, dan `C`. Pilih satu
  kategori berdasarkan status PTKP (lihat `ptkp-2026.json`), bukan
  menggabungkan ketiganya.
- Setiap kategori adalah daftar entri `{ batas_atas, tarif }` yang
  berurutan naik.
- `batas_atas` bersifat **inklusif**: penghasilan yang tepat sama dengan
  sebuah `batas_atas` masuk ke bracket itu, bukan bracket berikutnya.
- Entri terakhir punya `batas_atas: null` — penutup rentang, berlaku untuk
  penghasilan di atas batas tertinggi yang berangka.
- `tarif` disimpan sebagai pecahan desimal, bukan persen.

## Pseudokode

```
fungsi pilihKategori(statusPTKP):
  TK/0, TK/1, K/0        -> "A"
  TK/2, TK/3, K/1, K/2   -> "B"
  K/3                    -> "C"

fungsi hitungTER(kategori, brutoBulanan):
  untuk entri pada kategori:            # urut naik
    jika entri.batas_atas == null atau brutoBulanan <= entri.batas_atas:
      kembali brutoBulanan * entri.tarif
  # tidak tercapai: entri terakhir selalu null
```

## Catatan

- Untuk masa pajak terakhir (Desember, atau bulan pegawai berhenti), hitung
  ulang setahun dengan tarif Pasal 17, **bukan** TER.
- TER dihitung dari penghasilan bruto; jangan kurangi PTKP dulu.
- Jangan gunakan untuk pegawai tidak tetap (ada TER harian tersendiri).

## Sumber

Lihat field `sumber`, `dasar_hukum`, dan `diverifikasi_pada` di
`pph21-ter-2026.json`.

**Angka tarif ada di `pph21-ter-2026.json` — jangan salin angka ke dokumen ini.**
