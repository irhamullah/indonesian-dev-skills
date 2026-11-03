# Email Notification (SMTP/Gmail)

Kirim email transaksional dari aplikasi: OTP, invoice, reset password, notifikasi.

---

## Option Comparison

| Option | Biaya | Setup | Deliverability | Cocok untuk |
|--------|-------|-------|----------------|-------------|
| **Gmail SMTP** | Gratis (limit ~500/hari) | Mudah (App Password) | ⚠️ Terbatas | Dev, low volume |
| **Transactional (Resend, SendGrid, Mailgun)** | Free tier + paid | Sedang (domain verify) | ✅ Bagus | Produksi |
| **Amazon SES** | Sangat murah | Kompleks | ✅ Bagus | High volume |
| **VPS mail server** | Gratis (biaya VPS) | Kompleks | ❌ Sering masuk spam | Hindari |

**Recommendation:**
- Dev/testing → Gmail SMTP
- Produksi → Resend / SendGrid / Mailgun (domain verify + DKIM/SPF)
- High volume → Amazon SES

---

## Gmail SMTP Setup

```
1. Aktifkan 2-Factor Authentication di Google Account
2. Buka https://myaccount.google.com/apppasswords
3. Pilih "Mail" → Generate
4. Copy 16-char password: "xxxx xxxx xxxx xxxx"
   ⚠️ Ini BUKAN password Gmail utama!
```

```bash
# .env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM="MyApp <you@gmail.com>"
```

⚠️ **Gmail limit:** ~500 email/hari (free), 2000 (Workspace). Bukan untuk produksi volume tinggi.

---

## Nodemailer Implementation

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT!),
  secure: process.env.SMTP_PORT === '465',  // 465 = SSL, 587 = STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text ?? stripHtml(params.html),  // Fallback plaintext
  });

  return info.messageId;
}
```

---

## HTML Email Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: #2563eb; padding: 24px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 20px;">MyApp</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="color: #1f2937; margin: 0 0 16px;">Halo {{name}},</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Pesanan <strong>#{{orderId}}</strong> sudah dikirim.
              </p>
              <table style="width: 100%; margin: 24px 0; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Kurir</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">{{courier}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">No. Resi</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">{{tracking}}</td>
                </tr>
              </table>
              <a href="{{trackingUrl}}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
                Lacak Pesanan
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background: #f9fafb; text-align: center; color: #6b7280; font-size: 12px;">
              © 2026 MyApp. Semua hak dilindungi.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Tips:**
- Pakai **inline CSS** (banyak email client strip `<style>`)
- Pakai **table** untuk layout (Outlook tidak support flexbox)
- Selalu sediakan **plain text fallback**
- Test di Gmail, Outlook, mobile

---

## Transactional Service (Resend)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'MyApp <noreply@yourdomain.com>',  // Domain harus verified
  to: 'user@example.com',
  subject: 'Pesananmu dikirim',
  html: template,
});
```

```
Setup Resend:
1. Daftar https://resend.com
2. Tambah domain → verifikasi via DNS (SPF, DKIM, DMARC)
3. Generate API key
4. Kirim dari noreply@yourdomain.com (BUKAN gmail.com)
```

---

## Deliverability (Jangan Masuk Spam!)

### 1. SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com include:resend.com ~all
```

### 2. DKIM Record
```
Generate di provider, tambahkan TXT record yang mereka berikan
```

### 3. DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### 4. Best Practices
- ✅ Kirim dari domain sendiri (bukan gmail.com untuk produksi)
- ✅ Selalu sediakan unsubscribe link (untuk marketing)
- ✅ Jangan pakai kata spam ("GRATIS!!!", "KLIK SEKARANG")
- ✅ Jaga complaint rate < 0.1%
- ✅ Warm-up domain/IP (volume naik perlahan)
- ✅ Validasi email sebelum kirim (hindari bounce)

---

## OTP via Email

```typescript
async function sendOTPEmail(email: string, code: string) {
  await sendEmail({
    to: email,
    subject: `Kode OTP: ${code}`,
    html: `
      <div style="font-family: Arial; max-width: 480px; margin: auto; padding: 32px;">
        <h2>Verifikasi Akun</h2>
        <p>Kode OTP kamu:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; 
                    background: #f3f4f6; padding: 16px; text-align: center; 
                    border-radius: 8px; margin: 16px 0;">
          ${code}
        </div>
        <p style="color: #6b7280;">Berlaku 5 menit. Jangan bagikan ke siapa pun.</p>
      </div>
    `,
  });
}
```

---

## Email Validation

```typescript
export function isValidEmail(email: string): boolean {
  // Basic RFC-ish check
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return false;

  // Disposable email check (optional)
  const disposable = ['tempmail.com', 'guerrillamail.com', '10minutemail.com'];
  const domain = email.split('@')[1].toLowerCase();
  return !disposable.includes(domain);
}
```

---

## Common Mistakes

### ❌ Pakai Gmail SMTP untuk Produksi Volume Tinggi
Gmail limit 500/hari, sering dianggap "personal" → mudah spam.

### ❌ Tidak Set SPF/DKIM/DMARC
Email masuk spam folder.

### ❌ Layout Pakai Flexbox/Grid
Outlook tidak support. Pakai table.

### ❌ External CSS
Banyak client strip `<style>`. Pakai inline.

### ❌ Tidak Ada Plain Text Fallback
Beberapa client block HTML.

### ❌ Kirim dari gmail.com untuk Aplikasi
Reputasi domain sendiri lebih baik.

---

## Checklist

- [ ] Gmail App Password (dev) atau transactional service (produksi)
- [ ] SMTP credentials di env
- [ ] Inline CSS + table layout
- [ ] Plain text fallback
- [ ] SPF, DKIM, DMARC records (produksi)
- [ ] Kirim dari domain sendiri (produksi)
- [ ] Email validation sebelum kirim
- [ ] Unsubscribe link (marketing)
- [ ] Rate limit / quota monitoring
- [ ] Test di Gmail, Outlook, mobile
