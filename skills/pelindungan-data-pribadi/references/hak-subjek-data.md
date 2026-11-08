# Hak Subjek Data Pribadi (UU 27/2022 pasal 5–15)

Subjek data memiliki hak-hak berikut. Pengendali wajib menyediakan mekanisme
yang dapat ditindak (formulir, endpoint API, atau saluran dukungan), dan
menanggapinya tanpa menunda-nunda.

## Daftar hak

| Hak | Pasal | Implementasi praktis |
| --- | --- | --- |
| **Informasi** | 5 | Privacy policy ringkas, jelas, pada saat pengumpulan data. |
| **Akses** | 7 | Memberikan salinan data pribadi yang diproses. |
| **Perbaikan** | 8 | Fasilitasi koreksi data yang tidak akurat / keliru. |
| **Penghapusan / pemusnahan** | 9 | Hapus data sesuai permintaan, kecuali ada dasar hukum untuk menyimpan. |
| **Pembatasan pemrosesan** | 10–12 | Hentikan/batasi pemrosesan atas permintaan (paling lambat 3×24 jam, Pasal 41). |
| **Portabilitas** | 13 | Memberikan data dalam format terstruktur, dapat dibaca mesin. |
| **Menarik persetujuan** | 14 | Hentikan pemrosesan berbasis consent saat ditarik. |
| **Keberatan (objeksi)** | 15 | Menghentikan pemrosesan untuk kepentingan sah/marketing bila keberatan diajukan. |

## Alur penanganan permintaan

1. Verifikasi **identitas** pemohon (tanpa menyimpan bukti berlebihan).
2. Catat permintaan; jawab dengan tenggat jelas (mis. 3×24 jam untuk
   pembatasan; sesegera mungkin untuk lainnya).
3. Periksa dasar hukum untuk **menolak** (mis. kewajiban hukum ik mempertahankan
   data).
4. Dokumentasikan permintaan & hasilnya untuk audit.

## Anti-patterns

- Meminta data yang tidak perlu saat verifikasi (mis. KTP untuk permintaan
  sederhana).
- Menggunakan "hapus akun" yang tidak benar-benar menghapus data.
- Tidak menyediakan jalur elektronik, sehingga hak sulit digunakan.
