# Jadwal sholat

## Sumber utama & jalur praktis

- **Sumber utama resmi:** Kementerian Agama (Bimasislam) — penetapan waktu salat untuk
  bandar/bandara (Kasemen, dll.) dan rilis jadwal. Portal: <https://bimasislam.kemenag.go.id/>
- **Jalur praktis (mirror):** MyQuran API — <https://api.myquran.com> (pihak ketiga
  yang menghimpun data waktu salat untuk kota/kabupaten di Indonesia).

Karena endpoint resmi Kemenag tidak memiliki API publik yang stabil untuk jadwal per
kota, halaman ini memakai MyQuran sebagai jalur praktis dengan contoh rekaman nyata,
dan mencantumkan Kemenag sebagai sumber otoritatif.

## Endpoint MyQuran

```
https://api.myquran.com/v2/sholat/kota/semua        # daftar kota/kabupaten
https://api.myquran.com/v2/sholat/jadwal/<id_kota>/<tahun>/<bulan>   # jadwal bulanan
```

`<id_kota>` adalah ID 4 digit dari daftar kota; `jadwal` per bulan (format `tahun`/
`bulan`).

## Catatan zona waktu

Waktu salat dikembalikan dalam **waktu setempat** (WIB/WITA/WIT sesuai lokasi).
Perhatikan offset zona saat memakai di aplikasi lintas zona.

## Contoh respons nyata (direkam 2026-11-08)

Daftar kota:

```bash
curl -s "https://api.myquran.com/v2/sholat/kota/semua" | head -c 400
```

```json
{"status":true,"request":{"path":"/sholat/kota/semua"},"data":[
  {"id":"1001","lokasi":"KAB. LAMPUNG TENGAH"},
  {"id":"1002","lokasi":"KAB. LAMPUNG UTARA"},
  ...
]}
```

Jadwal Kota Jakarta (id 1301), November 2026:

```bash
curl -s "https://api.myquran.com/v2/sholat/jadwal/1301/2026/11"
```

```json
{"status":true,"request":{"path":"/sholat/jadwal/1301/2026/11"},
 "data":{
   "id":1301,"lokasi":"KOTA JAKARTA","daerah":"DKI JAKARTA",
   "jadwal":[
     {"tanggal":"Minggu, 01/11/2026","imsak":"03:59","subuh":"04:09",
      "terbit":"05:23","dhuha":"05:51","dzuhur":"11:40","ashar":"14:55",
      "maghrib":"17:49","isya":"19:00","date":"2026-11-01"},
     ...
   ]}}
```

Bentuk data: JSON. Setiap entri `jadwal` berisi `tanggal` (label hari), `date`
(ISO YYYY-MM-DD), dan waktu `imsak`, `subuh`, `terbit`, `dhuha`, `dzuhur`,
`ashar`, `maghrib`, `isya`.

## Kredensial

- MyQuran: tidak ada (public, tanpa kunci).
- Kemenag: sesi web; tanpa API publik yang stabil.

## Batas akses

- MyQuran: gunakan cukup sopan; jangan memanggil beruntun tanpa jeda.
- Jadwal berlaku per bulan; jangan meng-cache lintas bulan tanpa memverifikasi ulang.

## Atribusi

> Sumber: Kementerian Agama (Bimasislam) · data jadwal setempat via MyQuran API

## Tanggal verifikasi

2026-11-08 — endpoint daftar kota dan jadwal bulanan MyQuran direkam hidup (status
`true`, data berisi id/lokasi/jadwal). Periode yang tersedia per bulan; verifikasi
kembali saat mengganti bulan/tahun.
