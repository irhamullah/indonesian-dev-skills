# Sanksi UU PDP

## Sanksi Administratif (Pasal 57)

Dijatuhkan oleh Lembaga Pelindungan Data Pribadi, berupa:

1. Peringatan tertulis.
2. Penghentian sementara kegiatan pemrosesan.
3. Penghapusan / pemusnahan data pribadi.
4. **Denda administratif** — paling tinggi **2% dari pendapatan tahunan** atau
   penerimaan tahunan terhadap variabel pelanggaran (Pasal 57 ayat 3).

PP 33/2026 menjadi acuan penegakan sanksi administratif ini.

## Sanksi Pidana (Pasal 65–71)

| Perbuatan | Ancaman pidana |
| --- | --- |
| Memproses data pribadi secara melawan hukum (menguntungkan diri/orang lain, merugikan subjek) | Penjara ≤ 5 tahun &/atau denda ≤ Rp5 miliar |
| Memperoleh/mengumpulkan data pribadi bukan miliknya dengan maksud melawan hukum | Penjara ≤ 5 tahun &/atau denda ≤ Rp5 miliar |
| Mengungkapkan data pribadi secara melawan hukum | Penjara ≤ 4 tahun &/atau denda ≤ Rp4 miliar |
| Menggunakan data pribadi secara melawan hukum | Penjara ≤ 4 tahun &/atau denda ≤ Rp4 miliar |
| Membuat data pribadi palsu / memalsu data pribadi | Penjara ≤ 6 tahun &/atau denda ≤ Rp6 miliar |

## Dampak praktis bagi pengembang

- **Data spesifik** (kesehatan, biometrik, keuangan, anak, dll.) membawa risiko
  pidana lebih tinggi — perketat governance-nya.
- **Denda administratif** dihitung terhadap pendapatan tahunan, sehingga skala
  besar makin rentan.
- **Notifikasi telat** (> 3×24 jam) selain menjadi pelanggaran, memperbesar
  risiko reputasi & tuntutan.

## Matriks risiko kepatuhan

| Kondisi | Tingkat risiko | Tindakan |
| --- | --- | --- |
| Mengekspos data spesifik tanpa consent eksplisit | Tinggi | Segera hentikan & perbaiki consent flow |
| Transfer lintas negara tanpa mekanisme | Tinggi | Dokumentasikan mekanisme / hentikan |
| Tidak ada jalur hak subjek data | Sedang | Implementasikan formulir/endpoint |
| Log menyimpan data pribadi | Sedang | Anonimisasi/redaksi di log |
| Tidak ada prosedur notifikasi insiden | Tinggi | Siapkan runbook 3×24 jam |
