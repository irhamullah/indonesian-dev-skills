# Notifikasi Insiden Kebocoran Data (Pasal 46)

Ketika terjadi **kegagalan pelindungan data pribadi** (termasuk kebocoran,
pengungkapan tidak sah, atau akses tidak sah), Pengendali wajib
memberitahukan **secara tertulis paling lambat 3×24 jam** kepada:

1. **Subjek Data Pribadi** yang terdampak.
2. **Lembaga Pelindungan Data Pribadi**.

## Isi minimal pemberitahuan (Pasal 46 ayat 2)

- Data pribadi apa yang terungkap.
- Kapan & bagaimana data diungkap / diakses.
- Langkah penanganan yang telah diambil.
- Dampak yang mungkin terjadi.

## Alur respons insiden

1. **Deteksi & klasifikasi** — pastikan benar-benar kegagalan pelindungan data
   (bukan sekadar alarm palsu / event non-data).
2. **Mitigasi segera** — hentikan/mitigasi (ganti kredensial, isolasi sistem,
   reset sesi).
3. **Notifikasi** — sampaikan pemberitahuan tertulis ≤ 3×24 jam ke subjek data
   & lembaga (isi minimal di atas).
4. **Dokumentasi & koordinasi** — catat kronologi, tindakan, dan koordinasi
   dgn penegak hukum bila ada indikasi pidana.
5. **Evaluasi & perbaikan** — tutup celah agar tidak terulang.

## Anti-patterns

- Menunda notifikasi menunggu hasil investigasi penuh (tenggat 3×24 jam tetap
  berlaku untuk pemberitahuan awal).
- Menyembunyikan insiden / hanya memberitahu sebagian subjek data.
- Menyimpan log insiden yang justru memuat data pribadi tanpa anonimisasi.
