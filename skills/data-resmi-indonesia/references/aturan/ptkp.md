# PTKP — Penghasilan Tidak Kena Pajak

## Kegunaan

Batasan penghasilan tahunan yang tidak dikenai PPh orang pribadi, per
status wajib pajak. Dipakai untuk menentukan kategori TER dan untuk
menghitung Penghasilan Kena Pajak (PKP) pada perhitungan tahunan.

## Dasar hukum

PMK 101/PMK.010/2016, yang masih berlaku sampai periode 2026. Dasar hukum
dan sumber tercatat di dalam berkas JSON pasangannya.

## Periode yang tersedia

| Periode | Berkas |
| --- | --- |
| 2026 | [ptkp-2026.json](./ptkp-2026.json) |

Periode lain **tidak** tercakup registry ini. Untuk periode di luar cakupan,
berhenti dan tampilkan sumber resmi.

## Cara membaca

- `jenis: "daftar"` — berkas memuat array `entri`.
- Setiap entri: `kunci` (status PTKP), `nilai` (dalam rupiah per tahun),
  `satuan`.
- Status mengikuti pola: `TK/n` (tidak kawin), `K/n` (kawin), `K/I/n`
  (penghasilan suami dan istri digabung), dengan `n` jumlah tanggungan
  paling banyak tiga.
- Nilai sudah berupa PTKP tahunan; jangan dikalikan lagi.

## Pseudokode

```
fungsi ambilPTKP(status, registry):
  entri = cari entri dengan kunci == status
  jika entri tidak ada: berhenti dan tampilkan sumber resmi
  kembali entri.nilai

fungsi hitungPKP(brutoSetahun, status, registry):
  ptkp = ambilPTKP(status, registry)
  kembali maksimum(brutoSetahun - ptkp, 0)
```

## Catatan

- Tanggungan maksimal tiga orang; tanggungan keempat dan seterusnya tidak
  menambah PTKP.
- Status ditentukan pada awal tahun pajak.

## Sumber

Lihat field `sumber`, `dasar_hukum`, dan `diverifikasi_pada` di
`ptkp-2026.json`.

**Angka PTKP ada di `ptkp-2026.json` — jangan salin angka ke dokumen ini.**
