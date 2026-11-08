# Bank Indonesia — Kurs (JISDOR, Kurs Acuan, Kurs Transaksi)

## Sumber & portal resmi

- Portal resmi Bank Indonesia: <https://www.bi.go.id/>
- Webservice kurs BI (WSDL): <https://www.bi.go.id/biwebservice/wskursbi.asmx?WSDL>
- Basis data: Bank Indonesia (BI)

Ini adalah sumber resmi pertama yang digunakan untuk kurs; **bukan** diganti
oleh data dari bank lain (mis. ECB) untuk kurs IDR. Kurs yang dikeluarkan BI
adalah rujukan resmi di Indonesia.

## Bentuk layanan: ASMX SOAP (bukan REST)

Webservice ini adalah **ASMX SOAP**, bukan REST. WSDL menyediakan tiga binding
per operasi:

- `wsKursBISoap` / `wsKursBISoap12` — SOAP 1.1 / 1.2 (XML envelope).
- `wsKursBIHttpGet` — HTTP GET; tiap operasi mengembalikan `<DataSet>`
  (diffgram XML), bukan JSON.
- `wsKursBIHttpPost` — HTTP POST.

``` `curl` di bawah memakai binding HTTP GET, yang paling mudah untuk skrip.
Getter SOAP memerlukan envelope `soap:Envelope` dan header `SOAPAction`.

## Daftar operasi

Empat kelompok operasi, masing-masing punya 4 varian:

| Varian | Arti | Parameter |
| --- | --- | --- |
| `1` | data terbaru (JISDOR: 14 record pertama) | tidak ada |
| `2` | data pada satu tanggal | `tgl` (YYYY-MM-DD) |
| `3` | data per mata uang pada interval tanggal | `mts` (kode mata uang), `startDate`/`endDate` |
| `4` | semua mata uang pada satu tanggal | `startDate` |

| Operasi | Isi |
| --- | --- |
| `getSubKursJisdor1..4` | Kurs **JISDOR** (Jakarta Interbank Spot Dollar Rate) |
| `getSubKursNonUSD_IDR1..4` | Kurs **Acuan** |
| `getSubKursLokal1..4` | Kurs **Transaksi** |
| `getSubKursAsing1..4` | Kurs **UKA** (Uang Kertas Asing) |

Catatan: kode mata uang (parameter `mts`) pada respons tampil sebagai string
dengan spasi trailing (mis. `USD  `); saat mencocokkan, potong spasi.

## Contoh `curl`

```bash
# Kurs JISDOR per tanggal (HTTP GET) — direkam 2026-11-08
curl -s "https://www.bi.go.id/biwebservice/wskursbi.asmx/getSubKursJisdor2?tgl=2026-11-06"

# Kurs Transaksi per tanggal
curl -s "https://www.bi.go.id/biwebservice/wskursbi.asmx/getSubKursLokal2?tgl=2026-11-06"

# Kurs Acuan per tanggal (lihat catatan 500 di bawah)
curl -s "https://www.bi.go.id/biwebservice/wskursbi.asmx/getSubKursNonUSD_IDR2?tgl=2026-11-06"
```

## Bentuk data

Tingkat atas adalah `<DataSet xmlns="http://tempuri.org/">`, berisi `<xs:schema>`
dengan definisi tabel, lalu `<diffgr:diffgram>` berisi `<NewDataSet>` dengan
elemen `<Table>` per baris.

Field tiap `<Table>` (JISDOR, Kurs Transaksi, Acuan, UKA — serupa namanya,
akhiran `_subkursasing` untuk UKA, `_subkurslokal` untuk transaksi,
`_subkursjisdor` untuk JISDOR, `_subkursnonusd_idr` untuk acuan):

- `id_*` — id baris.
- `lnk_*` — kode urut mata uang.
- `nil_*` — satuan (mis. `1.00`, `100.00` untuk JPY).
- `beli_*` — kurs beli.
- `jual_*` — kurs jual.
- `tgl_*` — tanggal (ISO 8601, offset `+07:00`).
- `mts_*` — kode mata uang (string, spasi trailing).

Contoh potongan respons nyata JISDOR (direkam 2026-11-08, untuk
`2026-11-06`):

```xml
<Table diffgr:id="Table1" msdata:rowOrder="0">
  <id_subkursasing>2352</id_subkursasing>
  <lnk_subkursasing>23</lnk_subkursasing>
  <nil_subkursasing>1.00</nil_subkursasing>
  <beli_subkursasing>18130.00</beli_subkursasing>
  <jual_subkursasing>18130.00</jual_subkursasing>
  <tgl_subkursasing>2026-11-06T00:00:00+07:00</tgl_subkursasing>
  <mts_subkursasing>USD  </mts_subkursasing>
</Table>
```

Contoh potongan respons nyata Kurs Transaksi (direkam 2026-11-08): kurs
mata uang `VND` termuat sebagai `beli_subkurslokal` `0.70` dan
`jual_subkurslokal` `0.71`.

Catatan: angka dikirim sebagai teks XML; konversi ke angka (decimal/float)
perlu dilakukan saat berhitung. Kode mata uang dalam `mts_*` memuat spasi
trailing — gunakan `.trim()`.

## Kredensial

Tidak diperlukan. Layanan ini publik tanpa kunci.

## Batas akses

- Tidak ada rate limit yang didokumentasikan pada halaman WSDL; perlakukan
  sebagai sumber publik, dan jangan membanjiri dengan permintaan berulang.
- Kurs berubah tiap hari kerja; jangan simpan hasil untuk waktu lama tanpa
  mengindikasikan tanggal.

## Catatan perilaku yang teramati

- `curl` shell ke `www.bi.go.id` sering gagal dengan
  `LibreSSL SSL_read connection reset by peer errno 54`. Gunakan
  `webfetch` atau Node `fetch` (TLS bekerja di sana).
- `getSubKursNonUSD_IDR1`(HTTP GET) mengembalikan **HTTP 500** pada saat
  perekaman (2026-11-08). Jadikan apa adanya — jangan klaim layanan ini
  selalu bekerja; untuk kebutuhan praktis gunakan `getSubKursJisdor2`
  atau `getSubKursLokal2`.
- Data **Nowcast**/**CAP** (peringatan cuaca) BI **tidak** ada di katalog
  APIPedia; jangan panggil sebagai bagian dari layanan ini.

## Atribusi

> Sumber: Bank Indonesia

## Tanggal verifikasi

2026-11-08 — WSDL, JISDOR (`getSubKursJisdor2`), dan Kurs Transaksi
(`getSubKursLokal2`) direkam hidup pada tanggal ini. `getSubKursNonUSD_IDR1`
mengembalikan HTTP 500 (tercatat apa adanya).
