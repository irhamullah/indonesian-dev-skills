# OTP & Message Templates

Flow OTP yang aman dan manajemen template pesan.

---

## OTP Flow (Complete)

```
1. User minta OTP (input nomor/email)
2. Server rate limit check
3. Generate OTP (crypto-secure)
4. Hash & simpan dengan TTL
5. Kirim via channel (WA/SMS/Email)
6. User input OTP
7. Verify (compare hash, cek expiry, cek attempts)
8. Mark as used (single-use)
```

---

## Implementation

```typescript
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const OTP_TTL = 300;        // 5 menit
const MAX_ATTEMPTS = 3;
const RATE_WINDOW = 300;    // 5 menit
const MAX_REQUESTS = 3;     // max 3 permintaan per window

export class OTPService {
  constructor(
    private redis: Redis,
    private notifier: NotificationService
  ) {}

  async request(identifier: string, channel: 'whatsapp' | 'sms' | 'email'): Promise<void> {
    // 1. Rate limit permintaan
    const reqKey = `otp:req:${identifier}`;
    const reqCount = await this.redis.incr(reqKey);
    if (reqCount === 1) await this.redis.expire(reqKey, RATE_WINDOW);
    if (reqCount > MAX_REQUESTS) {
      throw new Error('Terlalu banyak permintaan OTP. Coba lagi dalam 5 menit.');
    }

    // 2. Generate OTP crypto-secure (6 digit)
    const code = crypto.randomInt(100000, 999999).toString();

    // 3. Hash & simpan
    const hash = await bcrypt.hash(code, 10);
    await this.redis.set(`otp:code:${identifier}`, hash, 'EX', OTP_TTL);
    await this.redis.set(`otp:attempts:${identifier}`, '0', 'EX', OTP_TTL);

    // 4. Kirim
    await this.notifier.send({
      channel,
      to: identifier,
      template: 'otp',
      data: { code, minutes: String(OTP_TTL / 60) },
    });

    // 5. Log (tanpa OTP)
    logger.info('otp.requested', { identifier: maskRecipient(identifier), channel });
  }

  async verify(identifier: string, code: string): Promise<boolean> {
    const hash = await this.redis.get(`otp:code:${identifier}`);
    if (!hash) return false;  // Expired atau tidak ada

    // Cek attempts
    const attempts = await this.redis.incr(`otp:attempts:${identifier}`);
    if (attempts > MAX_ATTEMPTS) {
      await this.redis.del(`otp:code:${identifier}`);
      throw new Error('Terlalu banyak percobaan. Minta OTP baru.');
    }

    // Compare (constant-time via bcrypt)
    const valid = await bcrypt.compare(code, hash);
    if (!valid) return false;

    // Single-use: hapus setelah berhasil
    await this.redis.del(`otp:code:${identifier}`);
    await this.redis.del(`otp:attempts:${identifier}`);
    return true;
  }
}
```

---

## Security Rules

| Rule | Why |
|------|-----|
| **crypto.randomInt()** | `Math.random()` predictable |
| **Hash OTP** (bcrypt) | Kalau Redis bocor, OTP tidak terbaca |
| **TTL 5 menit** | Batasi window serangan |
| **Max 3 attempts** | Cegah brute force (10^6 combos) |
| **Single-use** | Hapus setelah verify berhasil |
| **Rate limit request** | Cegah SMS/WA bombing |
| **Rate limit verify** | Cegah brute force |
| **Log tanpa OTP** | Jangan bocorkan ke log |

---

## Message Templates

### Template Definition

```typescript
// templates.ts

export interface Template {
  channel: ('whatsapp' | 'telegram' | 'email')[];
  body: string;
  subject?: string;  // Email only
}

export const TEMPLATES: Record<string, Template> = {
  otp: {
    channel: ['whatsapp', 'email'],
    body: 'Kode OTP kamu: {{code}}\nBerlaku {{minutes}} menit.\nJANGAN bagikan ke siapa pun.',
    subject: 'Kode OTP: {{code}}',
  },

  order_created: {
    channel: ['whatsapp', 'email'],
    body: 'Halo {{name}}! 🛒\nPesanan #{{orderId}} dibuat.\nTotal: Rp {{total}}\nBayar sebelum {{deadline}}.',
    subject: 'Pesanan #{{orderId}} dibuat',
  },

  order_shipped: {
    channel: ['whatsapp', 'email'],
    body: 'Halo {{name}}! 📦\nPesanan #{{orderId}} dikirim.\nKurir: {{courier}}\nResi: {{tracking}}',
    subject: 'Pesanan #{{orderId}} dikirim',
  },

  payment_success: {
    channel: ['whatsapp', 'email'],
    body: '✅ Pembayaran diterima!\nPesanan #{{orderId}} diproses.\nTerima kasih, {{name}}.',
    subject: 'Pembayaran diterima - #{{orderId}}',
  },

  reset_password: {
    channel: ['email'],
    body: 'Reset password: {{link}}\nBerlaku {{minutes}} menit.',
    subject: 'Reset Password',
  },
};
```

### Renderer

```typescript
export function renderTemplate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in data)) {
      logger.warn('template.missing_var', { key });
      return `{{${key}}}`;
    }
    return data[key];
  });
}
```

---

## WhatsApp Template Guidelines (Anti-Ban)

### ✅ Good

```
Halo Budi! Pesanan #1234 sudah kami kirim dengan JNE.
Nomor resi: JNE123456. Lacak di: {{link}}
```

### ❌ Bad (spammy, ban risk)

```
PROMO!!! DISKON 90% HARI INI SAJA!!! KLIK http://bit.ly/xxx
GRATIS!!! JANGAN LEWATKAN!!!
```

**Tips:**
- Personalisasi (pakai nama)
- Sertakan konteks (order ID, konteks transaksi)
- Hindari ALL CAPS & excessive emoji
- Hindari link pendek mencurigakan
- Hormati opt-out

---

## Meta Cloud API Templates

Untuk official API, template harus di-approve Meta:

```
Category: AUTHENTICATION / UTILITY / MARKETING
Language: id (Indonesia)
Body: "Kode OTP kamu adalah {{1}}. Berlaku {{2}} menit."
```

**Approval tips:**
- AUTHENTICATION untuk OTP (lebih mudah approve)
- Jangan pakai promotional language di UTILITY
- Sertakan contoh variable
- Approval bisa 1-24 jam

---

## Email Templates (HTML)

Lihat `email-notification.md` untuk contoh HTML lengkap. Tips:
- Inline CSS
- Table layout
- Sediakan plain text fallback
- Responsive (mobile)

---

## Multi-Channel Template Resolution

```typescript
async function sendTemplated(params: {
  userId: string;
  templateName: string;
  data: Record<string, string>;
  preferredChannel: NotificationChannel;
}) {
  const template = TEMPLATES[params.templateName];
  if (!template) throw new Error(`Unknown template: ${params.templateName}`);

  const user = await getUser(params.userId);

  // Coba preferred channel dulu, fallback ke yang lain
  const channels = [params.preferredChannel, ...template.channel]
    .filter((c, i, arr) => arr.indexOf(c) === i)  // dedupe
    .filter(c => template.channel.includes(c));

  for (const channel of channels) {
    const to = channel === 'email' ? user.email
             : channel === 'telegram' ? user.telegramChatId
             : user.phone;
    if (!to) continue;

    const result = await notifier.send({
      channel,
      to,
      message: channel === 'email'
        ? renderTemplate(template.subject + '\n' + template.body, params.data)
        : renderTemplate(template.body, params.data),
    });

    if (result.success) return result;
  }

  throw new Error('All channels failed');
}
```

---

## Opt-in / Consent Tracking

```typescript
// Marketing WAWAJIB opt-in
interface Consent {
  userId: string;
  channel: 'whatsapp' | 'email';
  optedIn: boolean;
  optedInAt?: Date;
  optedOutAt?: Date;
  source: string;  // 'checkout', 'signup', 'manual'
}

async function canSendMarketing(userId: string, channel: string): Promise<boolean> {
  const consent = await db.consent.findOne({ userId, channel });
  return consent?.optedIn === true;
}

// Transaksional tidak butuh opt-in (terkait transaksi user)
// Marketing (promo, newsletter) WAJIB opt-in
```

---

## Checklist

- [ ] OTP: `crypto.randomInt()` (bukan Math.random)
- [ ] OTP: hash sebelum simpan
- [ ] OTP: TTL 5 menit
- [ ] OTP: max 3 attempts, single-use
- [ ] OTP: rate limit request (anti-bombing)
- [ ] Templates terpusat & versioned
- [ ] WhatsApp: personalisasi, hindari spam words
- [ ] Email: subject + body + plaintext
- [ ] Multi-channel fallback
- [ ] Opt-in tracking untuk marketing
- [ ] Log tanpa OTP/data sensitif
