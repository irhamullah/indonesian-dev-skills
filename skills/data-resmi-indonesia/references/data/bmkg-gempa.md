# BMKG — Data Gempa Bumi

## Sumber & portal resmi

- Portal Data Terbuka BMKG: <https://data.bmkg.go.id/>
- Halaman gempa BMKG: <https://www.bmkg.go.id/gempabumi/>
- Basis data: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)

## Tiga jenis data gempa

| Jenis | Endpoint | Isi |
| --- | --- | --- |
| Gempa terkini (satu, terbaru) | `https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json` | gempa terakhir + tautan shakemap |
| Gempa M ≥ 5.0 | `https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json` | daftar gempa berkekuatan besar terakhir |
| Gempa dirasakan | `https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json` | daftar gempa yang dirasakan masyarakat |

Versi XML tersedia dengan mengganti akhiran `.json` → `.xml`
(mis. `autogempa.xml`), berguna bila butuh parser XML.

Setiap entri memuat field `Potensi` yang menyatakan potensi tsunami
(mis. "Tidak berpotensi tsunami"). **Shakemap** disediakan per gempa lewat
field `Shakemap` (mis. `20261108015412.mmi.jpg`) pada URL
`https://static.bmkg.go.id/<Shakemap>`; URL ini **mengalihkan (301)** ke
`https://cdn.bmkg.go.id/<Shakemap>` yang menyajikan JPEG.

## Contoh `curl`

```bash
curl -s "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json"
curl -s "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json"
curl -s "https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json"
curl -sL "https://static.bmkg.go.id/20261108015412.mmi.jpg" -o shakemap.jpg
```

## Bentuk data

JSON (atau XML). Tingkat atas `Infogempa`, berisi `gempa` berupa objek (pada
`autogempa`) atau array (pada `gempaterkini`/`gempadirasakan`). Field tiap
entri: `Tanggal`, `Jam`, `DateTime`, `Coordinates`, `Lintang`, `Bujur`,
`Magnitude`, `Kedalaman`, `Wilayah`, `Potensi`, dan pada sebagian data
`Dirasakan`/`Shakemap`.

Contoh potongan respons nyata (direkam 2026-11-08):

```json
{
  "Infogempa": {
    "gempa": {
      "Tanggal": "08 Nov 2026",
      "Jam": "01:54:12 WIB",
      "DateTime": "2026-11-07T18:54:12+00:00",
      "Coordinates": "-4.01,122.69",
      "Magnitude": "3.3",
      "Kedalaman": "5 km",
      "Wilayah": "Pusat gempa berada di darat 20 km timur Kendari",
      "Potensi": "Gempa ini dirasakan untuk diteruskan pada masyarakat",
      "Shakemap": "20261108015412.mmi.jpg"
    }
  }
}
```

Catatan: `Magnitude` dikirim sebagai string, bukan angka — konversi sendiri
bila perlu berhitung.

## Kredensial

Tidak diperlukan.

## Batas akses

- BMKG membatasi **60 permintaan per menit per IP**.
- Data gempa bersifat mendesak dan berubah cepat; **jangan di-cache lintas
  hari**.

## Atribusi

> Sumber: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)

## Tanggal verifikasi

2026-11-08 — ketiga endpoint + shakemap direkam hidup pada tanggal ini.
