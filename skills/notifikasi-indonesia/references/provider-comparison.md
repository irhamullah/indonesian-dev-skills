# Provider Comparison - Notifikasi Indonesia

Perbandingan channel & provider + rekomendasi kapan pakai apa.

---

## Channel Comparison

| Channel | Reach di ID | Biaya | Delivery Rate | Cocok untuk |
|---------|-------------|-------|---------------|-------------|
| **WhatsApp** | ~90% smartphone | Rendah-menengah | ⭐⭐⭐⭐⭐ | OTP, transaksional, customer |
| **Telegram** | ~10-15% | Gratis | ⭐⭐⭐⭐⭐ | Internal, alert, admin |
| **Email** | Universal | Gratis-sangat murah | ⭐⭐⭐ | Invoice, formal, arsip |
| **SMS** | Universal | Tinggi (~Rp 300-500/pesan) | ⭐⭐⭐⭐ | Fallback OTP |

**Kesimpulan:**
- Customer-facing → **WhatsApp**
- Internal/team → **Telegram**
- Formal/dokumen → **Email**
- Fallback → **SMS**

---

## WhatsApp Provider Comparison

| Provider | Tipe | Biaya | Setup | Ban Risk | Fitur |
|----------|------|-------|-------|----------|-------|
| **Fonnte** | Unofficial | ~Rp 100rb/bln | Sangat mudah | ⚠️ Sedang | Teks, gambar, doc |
| **Wablas** | Unofficial | ~Rp 150rb/bln | Mudah | ⚠️ Sedang | Teks, media, API lengkap |
| **Watzap** | Unofficial | Per-pesan | Mudah | ⚠️ Sedang | Teks, media |
| **Woowa** | Unofficial | ~Rp 100rb/bln | Mudah | ⚠️ Sedang | Teks, media |
| **Meta Cloud API** | Official | Per-conversation | Lama (verifikasi) | ✅ Aman | Official, template, webhook |
| **Twilio (BSP)** | Official | Per-conversation | Sedang | ✅ Aman | Global, reliable |
| **Qontak** | BSP | Enterprise | Sedang | ✅ Aman | CRM + omnichannel |

### Kapan Pakai Unofficial

✅ MVP / prototype
✅ Internal notifications
✅ Low volume (< 1000/hari)
✅ Budget terbatas
✅ Butuh setup cepat

### Kapan Pakai Official

✅ Produksi serius
✅ High volume
✅ Brand besar (butuh verified business)
✅ Butuh reliability & compliance
✅ Butuh green tick (centang hijau)

---

## Email Provider Comparison

| Provider | Free Tier | Harga | Deliverability | Setup |
|----------|-----------|-------|----------------|-------|
| **Gmail SMTP** | 500/hari | Gratis | ⚠️ Terbatas | Sangat mudah |
| **Resend** | 3000/bln | $20/50k | ✅ Bagus | Mudah |
| **SendGrid** | 100/hari | $20/50k | ✅ Bagus | Sedang |
| **Mailgun** | 100/hari | $35/50k | ✅ Bagus | Sedang |
| **Amazon SES** | 62k/bln (dari EC2) | $0.10/1000 | ✅ Bagus | Kompleks |
| **Postmark** | Trial | $15/10k | ✅ Terbaik | Mudah |

**Recommendation:**
- Dev → Gmail SMTP
- Produksi kecil-menengah → Resend (DX terbaik)
- High volume → Amazon SES

---

## Decision Tree

```
Butuh kirim notifikasi…
│
├─ Ke customer (OTP, order)?
│   ├─ Volume < 1000/hari & budget terbatas → WhatsApp unofficial (Fonnte)
│   └─ Volume tinggi / brand serius → WhatsApp official (Meta Cloud API)
│
├─ Ke tim internal (alert, monitoring)?
│   └─ Telegram (gratis, terbaik untuk ini)
│
├─ Dokumen formal (invoice, kontrak)?
│   └─ Email (Resend/SendGrid)
│
└─ Notif kritikal (harus sampai)?
    └─ Multi-channel: WhatsApp → Email → SMS
```

---

## Cost Estimation

### Scenario: 10.000 OTP/bulan

| Channel | Biaya |
|---------|-------|
| SMS | ~Rp 3-5 juta |
| WhatsApp unofficial (Fonnte) | ~Rp 100-300rb (flat) |
| WhatsApp official (Meta) | ~Rp 1-3 juta (per-conversation) |
| Telegram | Rp 0 |
| Email | ~Rp 0-500rb |

**Untuk OTP → WhatsApp unofficial jauh lebih murah** dari SMS (10x+).

---

## Hybrid Strategy (Recommended)

```typescript
// Strategi berlapis
const notificationStrategy = {
  otp: {
    primary: 'whatsapp',      // unofficial untuk hemat
    fallback: ['sms'],        // kalau WA gagal
  },
  transactional: {
    primary: 'whatsapp',
    fallback: ['email'],
  },
  marketing: {
    primary: 'email',         // WA marketing berisiko ban
    channel: 'whatsapp',      // hanya untuk opted-in
  },
  internal: {
    primary: 'telegram',      // gratis, real-time
  },
};
```

---

## Migration Path (Unofficial → Official)

Kalau aplikasi tumbuh:

```
1. Mulai dengan Fonnte (cepat, murah)
   ↓ (volume naik, risiko ban naik)
2. Tambah Meta Cloud API untuk transaksional penting
   ↓ (butuh template approval, verifikasi bisnis)
3. Full official + BSP untuk scale
```

**Code tetap sama** berkat abstraction layer (`NotificationProvider`) — cuma ganti adapter.

---

## Checklist Pemilihan

- [ ] Tentukan jenis notif (OTP / transaksional / marketing / internal)
- [ ] Estimasi volume per bulan
- [ ] Budget tersedia
- [ ] Butuh official (compliance/brand) atau unofficial cukup?
- [ ] Butuh dua arah (customer support)?
- [ ] Siapkan fallback channel
- [ ] Rencanakan migration path
