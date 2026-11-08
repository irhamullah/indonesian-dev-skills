# Hari libur nasional & cuti bersama

## Sumber penetapan resmi

Hari libur nasional dan cuti bersama di Indonesia ditetapkan setiap tahun melalui
**Surat Keputusan Bersama (SKB) 3 Menteri**: Menteri Agama, Menteri
Ketenagakerjaan, dan Menteri PANRB (Pendayagunaan Aparatur Negara dan Reformasi
Birokrasi).

- Portal resmi: Kemenko PMK — <https://www.kemenkopmk.go.id/>
- SKB 2026 (PDF resmi): <https://www.kemenkopmk.go.id/sites/default/files/pengumuman/2025-09/SKB%20Libur%20Nasional%20dan%20Cuti%20Bersama%20Tahun%202026.pdf>

## Prinsip wajib

- **Tahun tanpa SKB/aturan belum terbit → menolak.** Jika SKB untuk tahun yang
  diminta belum terbit, jangan mengembalikan daftar kosong atau memakai tabel tahun
  lain. Laporkan bahwa SKB tahun itu belum terbit + rujuk sumber resmi.
- Tabel di bawah ini hanya memuat tahun yang dokumen SKB-nya sudah terbit dan
  terverifikasi.

## Hari libur nasional 2026 (17 hari)

SKB 3 Menteri (Agama, Ketenagakerjaan, PANRB) tentang Hari Libur Nasional dan Cuti
Bersama Tahun 2026.

| Tanggal | Hari | Peristiwa |
| --- | --- | --- |
| 1 Januari | Kamis | Tahun Baru 2026 Masehi |
| 16 Januari | Jumat | Isra Mikraj Nabi Muhammad SAW |
| 17 Februari | Selasa | Tahun Baru Imlek 2577 Kongzili |
| 19 Maret | Kamis | Hari Suci Nyepi (Tahun Baru Saka 1948) |
| 21–22 Maret | Sabtu–Minggu | Hari Raya Idul Fitri 1447 H |
| 3 April | Jumat | Wafat Yesus Kristus |
| 5 April | Minggu | Kebangkitan Yesus Kristus (Paskah) |
| 1 Mei | Jumat | Hari Buruh Internasional |
| 14 Mei | Kamis | Kenaikan Yesus Kristus |
| 27 Mei | Rabu | Hari Raya Idul Adha 1447 H |
| 31 Mei | Minggu | Hari Raya Waisak 2570 BE |
| 1 Juni | Senin | Hari Lahir Pancasila |
| 16 Juni | Selasa | Tahun Baru Islam 1448 H |
| 17 Agustus | Senin | Hari Kemerdekaan RI |
| 25 Agustus | Selasa | Maulid Nabi Muhammad SAW |
| 25 Desember | Jumat | Hari Raya Natal |

## Cuti bersama 2026 (8 hari)

| Tanggal | Hari | Peristiwa |
| --- | --- | --- |
| 16 Februari | Senin | Cuti bersama Tahun Baru Imlek |
| 18 Maret | Rabu | Cuti bersama Hari Suci Nyepi |
| 20, 23, 24 Maret | Jumat, Senin, Selasa | Cuti bersama Hari Raya Idul Fitri 1447 H |
| 15 Mei | Jumat | Cuti bersama Kenaikan Yesus Kristus |
| 28 Mei | Kamis | Cuti bersama Hari Raya Idul Adha 1447 H |
| 24 Desember | Kamis | Cuti bersama Hari Raya Natal |

## Menghitung hari kerja / SLA

Algoritma menghitung jumlah hari kerja antara dua tanggal (memotong akhir pekan +
hari libur + cuti bersama):

```
function hitungHariKerja(mulai, selesai, himpunanLibur):
    hari = 0
    untuk t dari mulai s.d. selesai:
        jika t bukan Sabtu/Minggu DAN t ∉ himpunanLibur:
            hari = hari + 1
    kembali hari
```

Catatan:

- Gunakan **dataset hari libur/cuti bersama tahun yang sama** dengan rentang tanggal
  yang dihitung. Jangan mencampur tahun.
- Baris-angkanya hidup di berkas ini; angka **tarif/aturan** lain ada di registry
  JSON (lihat `references/pola/registry-bertanggal.md`).
- Jika rentang melintasi tahun yang SKB-nya belum terbit → memolak, jangan
  menghitung dengan data tahun lain.

## Atribusi

> Sumber: Keputusan Bersama Menteri Agama, Menteri Ketenagakerjaan, dan Menteri
> PANRB tentang Hari Libur Nasional dan Cuti Bersama Tahun 2026

## Tanggal verifikasi

2026-11-08 — SKB 2026 diverifikasi (tolok: PDF resmi Kemenko PMK; rentang 25 hari
libur = 17 nasional + 8 cuti bersama). Tahun lain: cek dulu SKB-nya sebelum
menghitung.
