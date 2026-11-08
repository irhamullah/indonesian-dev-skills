# Direktori institusi (rumah sakit, sekolah, kampus)

## Sumber yang lolos verifikasi

Halaman ini hanya memuat sumber yang berhasil diverifikasi hidup saat
perekaman. Sumber yang gagal diverifikasi **dikeluarkan** dari halaman (lihat
"Yang gagal diverifikasi" di bawah) dan dilaporkan ke pemilik skill.

## SIRS — Rumah Sakit (Kementerian Kesehatan)

- Portal: <https://sirs.kemkes.go.id/fo/>
- Basis data: Kementerian Kesehatan RI — SIRS (Sistem Informasi Rumah Sakit)
- Status: **terverifikasi** (publik tanpa kunci, HTTP 200 saat perekaman).

Dashboard `RS Online` menampilkan informasi rumah sakit dalam bentuk peta dan
grafik; `SIRANAP` menampilkan ketersediaan tempat tidur rumah sakit.

Contoh `curl` (dashboard publik):

```bash
curl -sL "https://sirs.kemkes.go.id/fo/" | head -c 600
```

Potongan respons nyata (direkam 2026-11-08, HTTP 200):

```html
RS Online  Beranda  Informasi  Hubungi Kami  Log In
DASHBOARD INFORMASI
  Dashboard RS Online — Dashboard Informasi Rumah Sakit disajikan dalam bentuk peta dan Grafik
  Dashboard SIRANAP — Dashboard Informasi Ketersediaan Tempat Tidur di Rumah Sakit
```

Catatan batas akses:

- Dashboard `SIRANAP` (detail ketersediaan tempat tidur) dialihkan ke SSO
  `akun-yankes.kemkes.go.id` — butuh login akun pengguna; **bukan** data
  publik terbuka. Untuk data ketersediaan tempat tidur, akses terbatas login.
- Dashboard `RS Online` (statistik umum / peta) dapat diakses tanpa login.

## Yang gagal diverifikasi (dikeluarkan)

Berkut kandidat yang **tidak** lolos verifikasi pada 2026-11-08 dan karenanya
**tidak** dimuat ke halaman ini:

- **Referensi data sekolah (Kemdikbud/DAPODIK)** — `referensi.data.kemdikbud.go.id`
  dan `dapo.kemdikbud.go.id` tidak dapat di-resolve (DNS ENOTFOUND) dari
  lingkungan perekaman. Tidak dapat direkam.
- **PDDikti (kampus/mahasiswa/dosen/prodi)** — `pddikti.kemdikbud.go.id`
  tidak dapat di-resolve (DNS ENOTFOUND) dari lingkungan perekaman. Tidak dapat
  direkam.
- **EMIS pendis (Kemenag)** — `emispendis.kemenag.go.id` tidak dapat
  di-resolve (DNS ENOTFOUND). Tidak dapat direkam.

Jika salah satu dari ketiganya dibutuhkan, verifikasi ulang dari lingkungan
yang jangkaunannya ke `*.kemdikbud.go.id` / `*.kemenag.go.id` berhasil, lalu
perbarui halaman ini (baru tulis setelah ada bukti respons nyata).

## Prinsip privasi

- **Data pribadi tidak boleh dipersist.** Nama, NIM/NIDN, NIK, tanggal lahir,
  atau data identitas lain (termasuk dari PDDikti/EMIS bila nanti diaktifkan)
  hanya boleh diteruskan ke pemanggil — **dilarang** masuk log, cache, contoh,
  atau berkas apa pun di skill ini. Beri tahu pengguna keterbatasan ini.
- Jangan menaruh kunci/kredensial apa pun di repo (lihat pola verifikasi &
  atribusi).

## Atribusi

> Sumber: Kementerian Kesehatan RI (SIRS) · Kemdikbud (dikeluarkan,
> gagal verifikasi)

## Tanggal verifikasi

2026-11-08 — SIRS (`sirs.kemkes.go.id/fo/`) direkam hidup (HTTP 200);
SIRANAP detail mengarah ke SSO `akun-yankes.kemkes.go.id`. Kemdikbud sekolah,
PDDikti, dan EMIS gagal DNS dan **dikeluarkan** dari halaman ini.
