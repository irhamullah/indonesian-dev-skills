# Kalender Masehi ↔ Hijriah ↔ Jawa

## Sumber & rujukan resmi

- **Hijriah:** Kementerian Agama (Bimasislam) menetapkan awal bulan kamariah
  (hisab dan rukyat) untuk keperluan ibadah dan hari besar Islam. Portal:
  <https://bimasislam.kemenag.go.id/>
- **Kalender Jawa (Almanak Jawa):** tidak ada API publik resmi; rujukan umum
  adalah almanak dan situs konversi (mis. ki-demang.com, almnk.com). Jangan
  memperlakukan situs konversi sebagai sumber penetapan resmi.
- **Masehi:** kalender Gregorian standar.

## Prinsip wajib

- **Tanggal bulan Islam & Jawa bisa bergeser ±1 hari.** Penetapan resmi
  Kemenag dilakukan per bulan (hisab/rukyat). Almanak menghitung secara
  aritmetik, sehingga hasilnya **dapat berbeda satu hari** dari penetapan
  resmi — dan bahkan antar-almanak dapat berbeda. Jangan klaim satu tanggal
  sebagai "pasti" tanpa rujuk penetapan Kemenag untuk bulan itu.
- Ketika menampilkan konversi, **sertakan sumber dan tanggal** konversi itu
  direkam.

## Bentuk keluaran

Tampilkan selalu keempat komponen: tanggal Masehi, tanggal Jawa, tanggal
Hijriah, dan pasaran/weton (untuk Jawa).

```
Masehi  : Selasa, 1 Desember 2026
Jawa    : 20 Jumadil Akhir 1960, Selasa Pahing
Hijriah : 21 Jumada Tsania 1448 H
```

## Contoh konversi yang direkam (2026-11-08)

Berikut konversi yang direkam dari dua almanak (ki-demang.com dan almnk.com)
pada 2026-11-08. Perhatikan contoh di baris pertama memperlihatkan **beda satu
hari** antar-sumber — ini contoh nyata dari peringatan "bisa bergeser".

| Tanggal Masehi 2026 | Jawa (ki-demang) | Hijriah (ki-demang) | Jawa / Hijriah (almnk) | Pasaran |
| --- | --- | --- | --- | --- |
| Selasa, 1 Desember | 20 Jumadil Akhir 1960 | 20 Jumada Tsania 1448 | 20 Jumadil Akhir 1960 / 21 Jumada Tsania 1448 | Pahing |
| Kamis, 3 Desember | 22 Jumadil Akhir 1960 | — | — | Wage |
| Selasa, 29 Desember | — | 20 Rajab 1448 | — | — |

Catatan: pada 1 Des 2026, ki-demang mencatat Hijriah **20**, sedangkan almnk
mencatat **21** — selisih satu hari. Untuk keperluan yang menuntut penetapan
resmi, rujuk Kemenag untuk bulan yang bersangkutan; jangan memakai konversi
aritmetik almanak sebagai dasar penetapan ibadah.

## Cara menampilkan yang aman

1. Selalu sebutkan **sumber konversi** dan tanggal perekaman.
2. Jika butuh tanggal yang pasti (mis. awal Ramadhan), **jangan** memakai
   almanak; pakai penetapan Kemenag / data resmi yang terbit.
3. Jika hanya butuh perkiraan (mis. label "21 Jumadil Akhir 1448"), tampilkan
   dengan catatan "perkiraan aritmetik, bisa bergeser ±1 hari".

## Atribusi

> Sumber: Kementerian Agama (Bimasislam) untuk penetapan Hijriah; almanak
> konversi (ki-demang.com, almnk.com) untuk contoh konversi Jawa/Hijriah
> aritmetik.

## Tanggal verifikasi

2026-11-08 — contoh konversi di atas direkam hidup dari ki-demang.com dan
almnk.com. Konversi Hijriah resmi per bulan tetap harus dirujuk ke penetapan
Kemenag.
