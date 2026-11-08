# UMP — Upah Minimum Provinsi

## Kegunaan

Upah bulanan terendah per provinsi, dipakai sebagai acuan batas bawah upah
dan sebagai masukan tidak langsung untuk batas bawah iuran BPJS Kesehatan
PPU.

## Dasar hukum

PP 49/2025 (perubahan kedua atas PP 36/2021 tentang Pengupahan). UMP
ditetapkan oleh Gubernur melalui Keputusan Gubernur dan berlaku mulai
1 Januari tahun berjalan.

## Periode yang tersedia

| Periode | Berkas |
| --- | --- |
| 2026 | [umpp-2026.json](./umpp-2026.json) |

Periode lain **tidak** tercakup registry ini; berhenti dan tampilkan sumber
resmi.

## Cara membaca

- `jenis: "daftar"` — berkas memuat array `entri`.
- Setiap entri: `kunci` (nama provinsi, huruf kapital), `nilai` (rupiah per
  bulan), `satuan`.
- `kunci` memakai usulan provinsi seperti ditetapkan pemerintah; cocokkan
  persis setelah menormalkan huruf besar/kecil.
- Beberapa provinsi memakai pecahan sen pada `nilai`; jangan bulatkan tanpa
  memberi tahu pemanggil.

## Pseudokode

```
fungsi ambilUMP(provinsi, registry):
  kunci = provinsi.trim().toUpperCase()
  entri = cari entri dengan kunci == kunci
  jika entri tidak ada: berhenti dan tampilkan sumber resmi
  kembali entri.nilai
```

## Peringatan: UMK kabupaten/kota TIDAK disediakan

Registry ini hanya memuat UMP (tingkat provinsi). **Upah Minimum
Kabupaten/Kota (UMK) dan Upah Minimum Sektoral tidak disediakan.** UMK
ditetapkan terpisah oleh bupati/wali kota dan sering lebih tinggi dari UMP.
Untuk kebutuhan UMK, rujuk Keputusan Bupati/Wali Kota atau kanal resmi
pemerintah daerah, dan jangan turunkan UMK dari UMP.

## Catatan

- Upah minimum berlaku bagi pekerja dengan masa kerja kurang dari satu
  tahun; pekerja dengan masa kerja lebih lama tunduk pada struktur dan
  skala upah perusahaan.
- Nilai berlaku per tahun dan berubah setiap Januari; jangan pakai angka
  2026 untuk periode lain.
- Nilai resmi dapat berbeda-beda antar sumber berita; Keputusan Gubernur
  tiap provinsi adalah sumber pengikat.

**Angka UMP ada di `umpp-2026.json` — jangan salin angka ke dokumen ini.**
