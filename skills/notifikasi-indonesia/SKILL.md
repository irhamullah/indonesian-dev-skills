---
name: notifikasi-indonesia
description: Use when sending notifications via WhatsApp (Fonnte, Wablas, Watzap, official Meta Cloud API), Telegram Bot, or Email (SMTP/Gmail) for Indonesian users. Triggers on "kirim WhatsApp", "notifikasi WhatsApp", "WA gateway", "Fonnte", "Wablas", "Telegram bot notif", "OTP WhatsApp", "kirim email dari aplikasi", "notification service", "alert ke WhatsApp/Telegram"
---

# Notifikasi Indonesia (WhatsApp, Telegram, Email)

## Overview

Kirim notifikasi ke user Indonesia via channel yang benar-benar mereka pakai: **WhatsApp** (dominan), **Telegram** (internal/alert), dan **Email** (formal/transaksional). Skill ini mengatasi pain point: banyak pilihan WhatsApp gateway dengan API berbeda-beda, dan tidak ada abstraksi yang konsisten antara WA/Telegram/Email.

**Approach:** Unified `NotificationChannel` interface + adapters per provider. Business logic provider-agnostic.

## When to Use

- Kirim OTP / verifikasi via WhatsApp
- Notifikasi transaksi (order, pembayaran) ke customer
- Alert internal (worker down, error spike) ke Telegram/WhatsApp
- Email transaksional (invoice, reset password)
- Multi-channel fallback (WA → SMS → Email)
- Migrasi antar WhatsApp gateway (Fonnte ↔ Wablas ↔ official)

**Jangan pakai kalau:**
- Payment webhook (lihat `payment-gateway-indonesia`)
- Push notification mobile (FCM/APNs) - berbeda

## Core Principles

### Prinsip 1: Channel Abstraction

Satu interface untuk semua channel. Business logic tidak tahu detail provider.

```typescript
// Bad: Business logic tahu detail provider
if (channel === 'fonnte') {
  await axios.post('https://api.fonnte.com/send', { ... });
} else if (channel === 'telegram') {
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { ... });
}

// Good: Provider-agnostic
await notifier.send({
  channel: 'whatsapp',
  to: '+6281234567890',
  template: 'otp',
  data: { code: '123456' },
});
```

### Prinsip 2: Pilih Channel Sesuai Konteks

```
OTP / verifikasi     → WhatsApp (delivery rate tinggi di ID)
Notif transaksional  → WhatsApp + Email (redundansi)
Alert internal       → Telegram (gratis, cepat, kaya fitur)
Dokumen formal       → Email (invoice, kontrak)
Marketing            → WhatsApp (opt-in wajib)
```

### Prinsip 3: WhatsApp Official vs Unofficial

| Jenis | Contoh | Risiko Ban | Biaya | Kapan pakai |
|-------|--------|------------|-------|-------------|
| **Official (Meta Cloud API)** | Meta, via BSP (Twilio, Qontak) | ✅ Aman | Per-conversation | Produksi serius, high volume |
| **Unofficial gateway** | Fonnte, Wablas, Watzap, Woowa | ⚠️ Bisa kena ban | Murah/flat | MVP, internal, low volume |

⚠️ **Unofficial = nomor bisa di-ban WhatsApp** kalau kirim spam/high volume. Selalu siapkan fallback.

### Prinsip 4: Idempotency & Rate Limit

```typescript
// Jangan kirim OTP berkali-kali untuk request yang sama
// Rate limit per nomor: max 3 OTP per 5 menit
```

## Workflow

### Step 1: Define Unified Interface

```typescript
// types/notification.ts

export type NotificationChannel = 'whatsapp' | 'telegram' | 'email';

export interface NotificationRequest {
  channel: NotificationChannel;
  to: string;                    // +62812... | chat_id | email
  template?: string;             // template name
  message?: string;              // raw message (jika tanpa template)
  data?: Record<string, string>; // template variables
  priority?: 'high' | 'normal';
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  channel: NotificationChannel;
  error?: string;
}

export interface NotificationProvider {
  send(request: NotificationRequest): Promise<NotificationResult>;
  isConfigured(): boolean;
}
```

### Step 2: Implement Adapters

```typescript
// adapters/whatsapp-fonnte.adapter.ts

export class FonnteWhatsAppProvider implements NotificationProvider {
  constructor(private token: string, private sender?: string) {}

  isConfigured(): boolean {
    return !!this.token;
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    try {
      const response = await axios.post(
        'https://api.fonnte.com/send',
        new URLSearchParams({
          target: normalizePhone(request.to),
          message: this.renderMessage(request),
          ...(this.sender && { countryCode: '62' }),
        }),
        {
          headers: { Authorization: this.token },
        }
      );

      return {
        success: response.data.status === true,
        messageId: response.data.id?.[0]?.toString(),
        channel: 'whatsapp',
      };
    } catch (error: any) {
      return { success: false, channel: 'whatsapp', error: error.message };
    }
  }

  private renderMessage(request: NotificationRequest): string {
    if (request.message) return request.message;
    return renderTemplate(request.template!, request.data || {});
  }
}
```

**See `examples.md`** for full adapters: Fonnte, Wablas, Watzap, Meta Cloud API, Telegram, Email.

### Step 3: Notification Service (Orchestrator)

```typescript
// notification.service.ts

export class NotificationService {
  private providers: Map<NotificationChannel, NotificationProvider> = new Map();
  private templates: TemplateEngine;

  registerProvider(channel: NotificationChannel, provider: NotificationProvider) {
    this.providers.set(channel, provider);
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const provider = this.providers.get(request.channel);
    if (!provider?.isConfigured()) {
      return { success: false, channel: request.channel, error: `${request.channel} not configured` };
    }

    const result = await provider.send(request);

    // Log untuk observability (tanpa data sensitif)
    logger.info('notification.sent', {
      channel: request.channel,
      template: request.template,
      success: result.success,
      recipient: maskRecipient(request.to),
    });

    return result;
  }
}
```

### Step 4: Multi-Channel Fallback

```typescript
async function sendCriticalNotification(user: User, payload: NotificationPayload) {
  const channels: NotificationChannel[] = ['whatsapp', 'email'];

  for (const channel of channels) {
    const to = channel === 'email' ? user.email : user.phone;
    if (!to) continue;

    const result = await notifier.send({ channel, to, ...payload });
    if (result.success) return result;
  }

  throw new Error('All notification channels failed');
}
```

### Step 5: OTP Flow

```typescript
async function sendOTP(phone: string, purpose: string) {
  // 1. Rate limit
  const key = `otp:${phone}`;
  const attempts = await redis.incr(key);
  if (attempts === 1) await redis.expire(key, 300);  // 5 min window
  if (attempts > 3) throw new Error('Terlalu banyak permintaan OTP. Coba lagi nanti.');

  // 2. Generate OTP (crypto-secure!)
  const code = crypto.randomInt(100000, 999999).toString();

  // 3. Store with TTL
  await redis.set(`otp:code:${phone}`, await hash(code), 'EX', 300);

  // 4. Send via WhatsApp
  await notifier.send({
    channel: 'whatsapp',
    to: phone,
    template: 'otp',
    data: { code, minutes: '5' },
  });

  return { sent: true, ttl: 300 };
}
```

**See `references/otp-and-templates.md`** for full OTP verification & template management.

### Step 6: Configuration

```bash
# .env

# WhatsApp - Fonnte
WA_PROVIDER=fonnte
FONNTE_TOKEN=xxx

# WhatsApp - Wablas (alternative)
WABLAS_TOKEN=xxx

# WhatsApp - Meta Cloud API (official)
META_WA_TOKEN=xxx
META_WA_PHONE_ID=xxx

# Telegram
TELEGRAM_BOT_TOKEN=xxx

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notif@yourdomain.com
SMTP_PASS=app-password
```

## Anti-Patterns

### ❌ Hardcode Provider di Business Logic

```typescript
// Bad
await fonnte.sendWA(order.userPhone, 'Pesanan dikirim');

// Good
await notifier.send({ channel: 'whatsapp', to: order.userPhone, template: 'order_shipped', data: {...} });
```

### ❌ Kirim WA Marketing Tanpa Opt-in

```typescript
// Bad: Blast ke nomor yang tidak opt-in → ban + illegal
// Good: Cek consent dulu
if (user.whatsappOptIn) await notifier.send({ ... });
```

### ❌ OTP pakai Math.random()

```typescript
// Bad: Predictable
const code = Math.floor(Math.random() * 900000 + 100000);

// Good: Crypto-secure
const code = crypto.randomInt(100000, 999999).toString();
```

### ❌ Simpan OTP Plaintext

```typescript
// Bad: OTP plaintext di DB/Redis
await redis.set(`otp:${phone}`, code);

// Good: Hash
await redis.set(`otp:${phone}`, await bcrypt.hash(code, 10), 'EX', 300);
```

### ❌ Tidak ada Fallback

```typescript
// Bad: WA gagal → notif tidak terkirim
await whatsapp.send(...);

// Good: Fallback ke email
if (!result.success) await email.send(...);
```

### ❌ Log Nomor/Data Penuh

```typescript
// Bad
logger.info('OTP sent to +6281234567890 with code 123456');

// Good
logger.info('OTP sent', { phone: maskPhone(phone) });
```

## Verification

- [ ] Unified `NotificationProvider` interface
- [ ] Minimal 1 channel per jenis (WA, Telegram, Email)
- [ ] Provider dipilih via config (bukan hardcode)
- [ ] Template engine untuk pesan
- [ ] Rate limiting untuk OTP/notif sensitif
- [ ] OTP: crypto-secure + hashed + TTL
- [ ] Multi-channel fallback untuk notif kritikal
- [ ] Opt-in tracking untuk marketing
- [ ] Logging tanpa data sensitif
- [ ] Handle provider outage (retry + fallback)
- [ ] Biaya/quota monitoring (WA gateway)
- [ ] Kepatuhan: official API untuk volume tinggi

## References

- `references/whatsapp-gateway.md` - Fonnte, Wablas, Watzap, Meta Cloud API
- `references/telegram-bot.md` - Telegram Bot API setup & usage
- `references/email-notification.md` - SMTP/Gmail & transactional email
- `references/otp-and-templates.md` - OTP flow & message templates
- `references/provider-comparison.md` - Perbandingan & rekomendasi

## Related Skills

- `payment-gateway-indonesia` - Notifikasi status pembayaran
- `hosting-deployment-indonesia` - Alert server ke Telegram/WhatsApp
- `security-and-hardening` - Rate limiting, secret management
- `observability-and-instrumentation` - Logging & delivery monitoring
