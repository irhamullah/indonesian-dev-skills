# WhatsApp Gateway Indonesia

Panduan lengkap WhatsApp gateway: unofficial (Fonnte, Wablas, Watzap) dan official (Meta Cloud API).

⚠️ **API bisa berubah.** Verify endpoint & format dengan docs provider terbaru.

---

## Official vs Unofficial

| Aspek | Unofficial Gateway | Official (Meta Cloud API) |
|-------|-------------------|---------------------------|
| **Contoh** | Fonnte, Wablas, Watzap, Woowa, Ruangwa | Meta, via BSP (Twilio, Qontak, Wati) |
| **Setup** | Cepat (scan QR / API key) | Lama (verifikasi bisnis, template approval) |
| **Biaya** | Flat/bulan atau per-pesan murah | Per-conversation (24h window) |
| **Risiko ban** | ⚠️ Tinggi kalau spam | ✅ Aman |
| **Template** | Bebas | Harus approved Meta |
| **24h rule** | Tidak ada | Ada (di luar 24h wajib template) |
| **Cocok untuk** | MVP, internal, low volume | Produksi serius, high volume |

**Aturan praktis:**
- 🚀 MVP / < 1000 pesan/hari → unofficial (Fonnte dsb)
- 🏢 Produksi / high volume / brand besar → official Meta Cloud API
- 🛡️ Selalu siapkan **fallback** kalau nomor unofficial kena ban

---

## Fonnte

**Daftar:** https://fonnte.com

**API:**
```
POST https://api.fonnte.com/send
Header: Authorization: <token>
Content-Type: application/x-www-form-urlencoded

Body:
  target=6281234567890
  message=Halo dari Fonnte
  countryCode=62
```

**Response:**
```json
{
  "detail": "success! message in queue",
  "id": [123456],
  "process": "pending",
  "status": true,
  "target": ["6281234567890"]
}
```

**Fitur:**
- Kirim teks, gambar, dokumen
- Device-based (scan QR)
- Ada tipe device: gratis (shared) & premium (dedicated nomor)

---

## Wablas

**Daftar:** https://wablas.com

**API:**
```
POST https://console.wablas.com/api/send-message
  (atau https://<domain>.wablas.com/api/send-message untuk dedicated)
Header: Authorization: <token>
Content-Type: application/x-www-form-urlencoded

Body:
  phone=6281234567890
  message=Halo dari Wablas
```

**Response:**
```json
{
  "status": true,
  "messages": [{ "id": "..." }]
}
```

**Kirim media:**
```
POST https://console.wablas.com/api/send-image
Body: phone, image (URL), caption
```

---

## Watzap

**Daftar:** https://watzap.id

**API:**
```
POST https://api.watzap.id/v1/send_message
Header: Content-Type: application/json

Body (JSON):
{
  "api_key": "your-api-key",
  "number_key": "your-number-key",
  "phone_no": "6281234567890",
  "message": "Halo dari Watzap"
}
```

**Response:**
```json
{
  "status": true,
  "message_id": "xxx"
}
```

⚠️ Watzap pakai **JSON body** + butuh **api_key + number_key** (2 kunci).

---

## Meta WhatsApp Cloud API (Official)

**Setup:**
1. Buat Meta Business Account → https://business.facebook.com
2. Buat App di https://developers.facebook.com → tipe "Business"
3. Tambah produk "WhatsApp"
4. Dapatkan: **Phone Number ID** + **Access Token** (temporary → generate permanent via System User)
5. Verifikasi business (untuk produksi)

**API:**
```
POST https://graph.facebook.com/v26.0/{PHONE_NUMBER_ID}/messages   # cek versi terbaru di changelog Meta
Header: Authorization: Bearer <access_token>
Content-Type: application/json

Body (text - hanya dalam 24h window):
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "text",
  "text": { "body": "Halo!" }
}
```

**Body (template - di luar 24h):**
```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "template",
  "template": {
    "name": "otp_verification",
    "language": { "code": "id" },
    "components": [{
      "type": "body",
      "parameters": [
        { "type": "text", "text": "123456" }
      ]
    }]
  }
}
```

**Key rules:**
- ⏰ **24-hour window:** hanya bisa kirim pesan bebas dalam 24 jam setelah user kirim pesan terakhir
- 📋 Di luar window → **wajib** template yang di-approve Meta
- 🇮🇩 Template Bahasa Indonesia → set `language.code: "id"`
- 💰 Biaya per conversation (business-initiated / user-initiated) beda rate

**Webhook status:**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "statuses": [{
          "id": "wamid.xxx",
          "status": "delivered",  // sent | delivered | read | failed
          "recipient_id": "6281234567890"
        }]
      }
    }]
  }]
}
```

---

## Normalisasi Nomor

Semua gateway butuh format berbeda:
- Fonnte/Wablas: `6281234567890` (tanpa +)
- Watzap: `6281234567890`
- Meta: `6281234567890` (tanpa +)

```typescript
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-().]/g, '').replace(/^\+/, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
  return cleaned;  // 6281234567890
}
```

---

## Rate Limiting & Anti-Ban (Unofficial)

Unofficial gateways bisa kena ban kalau:
- Kirim ke banyak nomor tidak dikenal (spam)
- Volume tinggi dalam waktu singkat
- Pesan mengandung link mencurigakan
- Banyak user "report/block" nomor kamu

**Mitigasi:**

```typescript
class WhatsAppRateLimiter {
  // Max 1 pesan per nomor per 5 detik
  // Max 50 pesan per menit total
  async send(phone: string, message: string) {
    const perNumber = await this.checkPerNumber(phone);
    if (!perNumber.allowed) {
      await this.delay(perNumber.waitMs);
    }

    if (await this.totalRateExceeded()) {
      await this.delay(60000);  // Backoff 1 menit
    }

    return this.gateway.send(phone, message);
  }
}
```

**Tips anti-ban:**
- Personalisasi pesan (jangan template identik ke semua)
- Hormati opt-out request
- Warm-up nomor baru (volume naik perlahan)
- Pisah nomor marketing vs transaksional
- Selalu punya nomor cadangan

---

## Checklist

- [ ] Pilih official vs unofficial sesuai skala
- [ ] API token di environment variable
- [ ] Normalisasi nomor ke format provider
- [ ] Handle response success/failure
- [ ] Rate limiting (terutama unofficial)
- [ ] Anti-ban untuk unofficial (personalisasi, opt-out)
- [ ] Fallback channel (SMS/Email) kalau WA gagal
- [ ] Monitoring delivery rate
- [ ] Untuk Meta: template approved + handle 24h window
- [ ] Webhook untuk status (sent/delivered/read)
