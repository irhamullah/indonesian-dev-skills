# Notifikasi Indonesia - Complete Examples

Implementasi lengkap semua adapter: WhatsApp (Fonnte, Wablas, Watzap, Meta Cloud API), Telegram, dan Email.

---

## Utility: Template Renderer

```typescript
// utils/template.ts

export function renderTemplate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`);
}

// Example
renderTemplate('Halo {{name}}, kode OTP kamu: {{code}}', { name: 'Budi', code: '123456' });
// "Halo Budi, kode OTP kamu: 123456"
```

```typescript
// utils/mask.ts

export function maskPhone(phone: string): string {
  if (phone.length < 6) return '***';
  return phone.slice(0, 4) + '****' + phone.slice(-3);
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  const shown = user.slice(0, 2);
  return `${shown}${'*'.repeat(Math.max(user.length - 2, 1))}@${domain}`;
}

export function maskRecipient(to: string): string {
  return to.includes('@') ? maskEmail(to) : maskPhone(to);
}
```

---

## Example 1: Fonnte WhatsApp Adapter

```typescript
// adapters/fonnte.adapter.ts

import axios from 'axios';
import { NotificationProvider, NotificationRequest, NotificationResult } from '../types/notification';
import { renderTemplate } from '../utils/template';
import { normalizePhone } from './helpers/phone';

export class FonnteWhatsAppProvider implements NotificationProvider {
  constructor(
    private token: string,
    private templates: Record<string, string>
  ) {}

  isConfigured(): boolean {
    return !!this.token;
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const message = request.message ?? renderTemplate(
      this.templates[request.template!] ?? '',
      request.data ?? {}
    );

    try {
      const response = await axios.post(
        'https://api.fonnte.com/send',
        new URLSearchParams({
          target: normalizePhone(request.to),   // +62812... → 62812...
          message,
          countryCode: '62',
        }),
        {
          headers: {
            Authorization: this.token,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 15000,
        }
      );

      const ok = response.data?.status === true;
      return {
        success: ok,
        messageId: response.data?.id?.[0]?.toString(),
        channel: 'whatsapp',
        error: ok ? undefined : response.data?.reason,
      };
    } catch (error: any) {
      return {
        success: false,
        channel: 'whatsapp',
        error: error.response?.data?.reason || error.message,
      };
    }
  }
}
```

---

## Example 2: Wablas WhatsApp Adapter

```typescript
// adapters/wablas.adapter.ts

export class WablasWhatsAppProvider implements NotificationProvider {
  constructor(
    private token: string,
    private templates: Record<string, string>,
    private domain = 'console.wablas.com'  // or your dedicated domain
  ) {}

  isConfigured(): boolean {
    return !!this.token;
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const message = request.message ?? renderTemplate(
      this.templates[request.template!] ?? '',
      request.data ?? {}
    );

    try {
      const response = await axios.post(
        `https://${this.domain}/api/send-message`,
        new URLSearchParams({
          phone: normalizePhone(request.to),
          message,
        }),
        {
          headers: {
            Authorization: this.token,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 15000,
        }
      );

      const ok = response.data?.status === true;
      return {
        success: ok,
        messageId: response.data?.messages?.[0]?.id,
        channel: 'whatsapp',
        error: ok ? undefined : response.data?.message,
      };
    } catch (error: any) {
      return {
        success: false,
        channel: 'whatsapp',
        error: error.response?.data?.message || error.message,
      };
    }
  }
}
```

---

## Example 3: Watzap WhatsApp Adapter

```typescript
// adapters/watzap.adapter.ts
// Watzap pakai JSON body (bukan form-urlencoded)

export class WatzapWhatsAppProvider implements NotificationProvider {
  constructor(
    private apiKey: string,
    private numberKey: string,
    private templates: Record<string, string>
  ) {}

  isConfigured(): boolean {
    return !!this.apiKey && !!this.numberKey;
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const message = request.message ?? renderTemplate(
      this.templates[request.template!] ?? '',
      request.data ?? {}
    );

    try {
      const response = await axios.post(
        'https://api.watzap.id/v1/send_message',
        {
          api_key: this.apiKey,
          number_key: this.numberKey,
          phone_no: normalizePhone(request.to),
          message,
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      );

      const ok = response.data?.status === true;
      return {
        success: ok,
        messageId: response.data?.message_id,
        channel: 'whatsapp',
        error: ok ? undefined : response.data?.message,
      };
    } catch (error: any) {
      return {
        success: false,
        channel: 'whatsapp',
        error: error.response?.data?.message || error.message,
      };
    }
  }
}
```

---

## Example 4: Meta WhatsApp Cloud API (Official)

```typescript
// adapters/meta-whatsapp.adapter.ts

export class MetaWhatsAppProvider implements NotificationProvider {
  constructor(
    private accessToken: string,
    private phoneNumberId: string,
    private templates: Record<string, string>,
    private apiVersion = 'v26.0'   // cek versi terbaru di changelog Meta
  ) {}

  isConfigured(): boolean {
    return !!this.accessToken && !!this.phoneNumberId;
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const to = normalizePhone(request.to).replace('+', '');  // Meta wants no '+'

    try {
      // Note: 24-hour window rule. Di luar window, HARUS pakai approved template
      const body = request.template
        ? this.buildTemplatePayload(to, request.template, request.data ?? {})
        : {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: request.message },
          };

      const response = await axios.post(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        body,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id,
        channel: 'whatsapp',
      };
    } catch (error: any) {
      return {
        success: false,
        channel: 'whatsapp',
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  private buildTemplatePayload(to: string, template: string, data: Record<string, string>) {
    // Template harus pre-approved di Meta Business Manager
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template,
        language: { code: 'id' },
        components: [
          {
            type: 'body',
            parameters: Object.values(data).map(value => ({
              type: 'text',
              text: value,
            })),
          },
        ],
      },
    };
  }
}
```

⚠️ **Meta Cloud API rules:**
- Di luar 24 jam sejak pesan terakhir user → **wajib** pakai template yang di-approve Meta
- Template dalam Bahasa Indonesia (`language.code: 'id'`) harus disetujui dulu
- Ada biaya per-conversation (24 jam window)

---

## Example 5: Telegram Bot Adapter

```typescript
// adapters/telegram.adapter.ts

export class TelegramProvider implements NotificationProvider {
  constructor(private botToken: string) {}

  isConfigured(): boolean {
    return !!this.botToken;
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: request.to,              // user chat_id or @channelusername
          text: request.message,
          parse_mode: 'HTML',               // or 'MarkdownV2'
          disable_web_page_preview: true,
        },
        { timeout: 15000 }
      );

      return {
        success: response.data?.ok === true,
        messageId: response.data?.result?.message_id?.toString(),
        channel: 'telegram',
      };
    } catch (error: any) {
      return {
        success: false,
        channel: 'telegram',
        error: error.response?.data?.description || error.message,
      };
    }
  }
}
```

**Helper untuk alert server (lihat skill hosting):**

```bash
# Simple alert via Telegram (tanpa aplikasi)
send_telegram_alert() {
  local MESSAGE="$1"
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d chat_id="${TELEGRAM_CHAT_ID}" \
    -d parse_mode="HTML" \
    -d text="🚨 <b>Alert</b>%0A${MESSAGE}"
}

# Usage di script backup/monitoring
send_telegram_alert "Worker laravel-worker_00 DOWN di $(hostname)"
```

---

## Example 6: Email Adapter (SMTP / Nodemailer)

```typescript
// adapters/email.adapter.ts

import nodemailer, { Transporter } from 'nodemailer';

export class EmailProvider implements NotificationProvider {
  private transporter: Transporter;
  private templates: Record<string, string>;

  constructor(config: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  }, templates: Record<string, string>) {
    this.templates = templates;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,     // true untuk 465, false untuk 587
      auth: { user: config.user, pass: config.pass },
    });
  }

  isConfigured(): boolean {
    return !!this.transporter;
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const html = renderTemplate(
      this.templates[request.template!] ?? request.message ?? '',
      request.data ?? {}
    );

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: request.to,
        subject: request.data?.subject ?? 'Notifikasi',
        html,
      });

      return {
        success: true,
        messageId: info.messageId,
        channel: 'email',
      };
    } catch (error: any) {
      return { success: false, channel: 'email', error: error.message };
    }
  }
}
```

**Gmail SMTP setup (App Password):**
```
1. Aktifkan 2-Factor Authentication di Google Account
2. Buka https://myaccount.google.com/apppasswords
3. Generate App Password untuk "Mail"
4. Pakai 16-char password itu sebagai SMTP_PASS (BUKAN password Gmail utama)

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

---

## Example 7: Wiring Semuanya (Factory)

```typescript
// notification.factory.ts

import { NotificationService } from './notification.service';
import { FonnteWhatsAppProvider } from './adapters/fonnte.adapter';
import { TelegramProvider } from './adapters/telegram.adapter';
import { EmailProvider } from './adapters/email.adapter';
import { TEMPLATES } from './templates';

export function createNotificationService(): NotificationService {
  const service = new NotificationService();

  // WhatsApp (pilih provider via env)
  const waProvider = process.env.WA_PROVIDER ?? 'fonnte';
  if (waProvider === 'fonnte') {
    service.registerProvider('whatsapp', new FonnteWhatsAppProvider(
      process.env.FONNTE_TOKEN!,
      TEMPLATES
    ));
  } else if (waProvider === 'wablas') {
    service.registerProvider('whatsapp', new WablasWhatsAppProvider(
      process.env.WABLAS_TOKEN!,
      TEMPLATES
    ));
  }

  // Telegram
  service.registerProvider('telegram', new TelegramProvider(
    process.env.TELEGRAM_BOT_TOKEN!
  ));

  // Email
  service.registerProvider('email', new EmailProvider({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT!),
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
    from: process.env.SMTP_FROM!,
  }, TEMPLATES));

  return service;
}
```

---

## Example 8: Templates Definition

```typescript
// templates.ts

export const TEMPLATES: Record<string, string> = {
  otp: 'Kode OTP kamu: *{{code}}*.\nBerlaku {{minutes}} menit.\nJANGAN bagikan kode ini ke siapa pun.',

  order_created:
    'Halo {{name}}! 🛒\nPesanan #{{orderId}} berhasil dibuat.\nTotal: Rp {{total}}\nSelesaikan pembayaran sebelum {{deadline}}.',

  order_shipped:
    'Halo {{name}}! 📦\nPesanan #{{orderId}} sedang dikirim.\nKurir: {{courier}}\nResi: {{tracking}}',

  payment_success:
    '✅ Pembayaran diterima!\nPesanan #{{orderId}} sedang diproses.\nTerima kasih, {{name}}.',

  reset_password:
    'Reset password kamu: {{link}}\nLink berlaku {{minutes}} menit.',
};
```

---

## Example 9: Usage di Aplikasi

```typescript
// services/order.service.ts

export class OrderService {
  constructor(private notifier: NotificationService) {}

  async createOrder(data: CreateOrderInput) {
    const order = await this.saveOrder(data);

    // Notif ke customer via WhatsApp
    await this.notifier.send({
      channel: 'whatsapp',
      to: order.customerPhone,
      template: 'order_created',
      data: {
        name: order.customerName,
        orderId: order.id,
        total: formatRupiah(order.total),
        deadline: '60 menit',
      },
    });

    // Alert ke tim internal via Telegram
    await this.notifier.send({
      channel: 'telegram',
      to: process.env.TELEGRAM_ADMIN_CHAT_ID,
      message: `🛒 <b>Order baru</b> #${order.id}\nTotal: Rp ${formatRupiah(order.total)}`,
    });

    return order;
  }
}
```

---

## Key Takeaways

1. **Unified interface** → bisa switch WA gateway tanpa ubah business logic
2. **Telegram untuk internal** → gratis, cepat, kaya fitur (HTML, buttons)
3. **WhatsApp untuk customer** → delivery rate tertinggi di Indonesia
4. **Email untuk formal** → invoice, dokumen, arsip
5. **Fallback wajib** untuk notif kritikal
6. **Official WhatsApp API** untuk volume tinggi (hindari ban)
