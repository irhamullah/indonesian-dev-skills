# Anti-Patterns Notifikasi

Kesalahan umum saat mengirim notifikasi via WhatsApp/Telegram/Email, dan bentuk
perbaikannya. Semua contoh di bawah adalah kode yang **jangan** dipakai apa
adanya di produksi.

---

## ❌ Hardcode Provider di Business Logic

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

```typescript
// Bad
await fonnte.sendWA(order.userPhone, 'Pesanan dikirim');

// Good
await notifier.send({ channel: 'whatsapp', to: order.userPhone, template: 'order_shipped', data: {...} });
```

---

## ❌ Kirim WA Marketing Tanpa Opt-in

```typescript
// Bad: Blast ke nomor yang tidak opt-in → ban + illegal
// Good: Cek consent dulu
if (user.whatsappOptIn) await notifier.send({ ... });
```

Opt-in/consent tracking: lihat `otp-and-templates.md`.

---

## ❌ OTP pakai Math.random()

```typescript
// Bad: Predictable
const code = Math.floor(Math.random() * 900000 + 100000);

// Good: Crypto-secure
const code = crypto.randomInt(100000, 999999).toString();
```

---

## ❌ Simpan OTP Plaintext

```typescript
// Bad: OTP plaintext di DB/Redis
await redis.set(`otp:${phone}`, code);

// Good: Hash
await redis.set(`otp:${phone}`, await bcrypt.hash(code, 10), 'EX', 300);
```

---

## ❌ Tidak ada Fallback

```typescript
// Bad: WA gagal → notif tidak terkirim
await whatsapp.send(...);

// Good: Fallback ke email
if (!result.success) await email.send(...);
```

Implementasi lengkap: `../examples.md` bagian "Core: Multi-Channel Fallback".

---

## ❌ Log Nomor/Data Penuh

```typescript
// Bad
logger.info('OTP sent to +6281234567890 with code 123456');

// Good
logger.info('OTP sent', { phone: maskPhone(phone) });
```

Helper masking: `../examples.md` bagian "Utility: Template Renderer".

---

## ❌ Email Produksi Tanpa Deliverability

Detail lengkap di `email-notification.md`. Ringkasnya:

- Gmail SMTP untuk produksi volume tinggi (limit ~500/hari, mudah dianggap spam).
- Tidak set SPF/DKIM/DMARC → masuk spam folder.
- Layout pakai flexbox/grid → Outlook tidak support; pakai table.
- External CSS → banyak client strip `<style>`; pakai inline CSS.
- Tidak ada plain-text fallback.
- Kirim dari `gmail.com` untuk aplikasi; pakai domain sendiri.
