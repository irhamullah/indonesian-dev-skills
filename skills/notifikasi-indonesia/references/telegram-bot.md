# Telegram Bot

Setup dan penggunaan Telegram Bot untuk notifikasi (internal alert, admin, customer support).

**Kelebihan Telegram untuk Indonesia:**
- ✅ **Gratis** (tidak ada biaya per-pesan)
- ✅ API sederhana & stabil
- ✅ Kaya fitur: HTML/Markdown, inline buttons, file, foto
- ✅ Cocok untuk alert internal & tim
- ✅ Dua arah (bisa terima perintah via webhook)

---

## Setup Bot (5 menit)

```
1. Buka Telegram, cari @BotFather
2. Kirim /newbot
3. Isi nama bot (misal: "MyApp Notifier")
4. Isi username bot (harus ending "bot", misal: "myapp_notif_bot")
5. BotFather kirim TOKEN: 123456:ABC-DEF...
6. Simpan token di .env: TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
```

---

## Dapatkan chat_id

Untuk kirim ke **user/channel**, butuh `chat_id`:

### User chat_id
```
1. User harus start chat dengan bot kamu dulu (kirim /start)
2. Akses: https://api.telegram.org/bot<TOKEN>/getUpdates
3. Cari "chat":{"id": 123456789, ...}
4. chat_id user = 123456789
```

### Group chat_id
```
1. Tambah bot ke grup
2. Kirim pesan apa saja di grup
3. Cek getUpdates → chat.id (biasanya negatif, misal -1001234567890)
```

### Channel
```
1. Tambah bot sebagai admin channel
2. Pakai @channelusername sebagai chat_id (misal @mychannel)
```

⚠️ **Untuk grup dengan privacy mode**, bot hanya lihat pesan yang mention bot. Untuk baca semua, disable privacy via @BotFather → /setprivacy.

---

## Kirim Pesan

```
POST https://api.telegram.org/bot<TOKEN>/sendMessage
Content-Type: application/json

{
  "chat_id": "123456789",
  "text": "<b>Alert</b>\nWorker down!",
  "parse_mode": "HTML",
  "disable_web_page_preview": true
}
```

**Response:**
```json
{
  "ok": true,
  "result": {
    "message_id": 123,
    "chat": { "id": 123456789 },
    "date": 1730616536
  }
}
```

---

## HTML vs Markdown

### HTML (Recommended)

```html
<b>bold</b>
<i>italic</i>
<u>underline</u>
<s>strikethrough</s>
<code>inline code</code>
<pre>code block</pre>
<a href="https://example.com">link</a>
```

⚠️ Escape: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`

### MarkdownV2 (rumit, banyak karakter perlu escape)

```markdown
*bold* _italic_ __underline__ ~strikethrough~
`inline code` ```pre```
[link](https://example.com)
```

**Recommendation:** Pakai **HTML** — lebih simpel, tidak perlu escape banyak karakter.

---

## Inline Buttons (Interaktif)

```
POST https://api.telegram.org/bot<TOKEN>/sendMessage

{
  "chat_id": "123456789",
  "text": "Approve order #123?",
  "reply_markup": {
    "inline_keyboard": [[
      { "text": "✅ Approve", "callback_data": "approve_123" },
      { "text": "❌ Reject", "callback_data": "reject_123" }
    ]]
  }
}
```

Butuh webhook handler untuk terima `callback_query`.

---

## Kirim ke Channel untuk Alert

```typescript
export class TelegramAlerter {
  constructor(
    private botToken: string,
    private chatId: string
  ) {}

  async alert(level: 'info' | 'warning' | 'critical', title: string, details?: string) {
    const emoji = { info: 'ℹ️', warning: '⚠️', critical: '🚨' }[level];
    const text = [
      `${emoji} <b>${escapeHtml(title)}</b>`,
      details ? `<code>${escapeHtml(details)}</code>` : '',
      `<i>${new Date().toISOString()}</i>`,
    ].filter(Boolean).join('\n');

    await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      chat_id: this.chatId,
      text,
      parse_mode: 'HTML',
      disable_notification: level === 'info',
    });
  }
}
```

**Usage di monitoring script:**

```bash
#!/bin/bash
# /usr/local/bin/server-alert.sh
BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
CHAT_ID="${TELEGRAM_CHAT_ID}"
MESSAGE="$1"

curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d chat_id="${CHAT_ID}" \
  -d parse_mode="HTML" \
  -d text="🚨 <b>$(hostname)</b>%0A${MESSAGE}" \
  > /dev/null
```

```bash
# Pakai di supervisor monitoring
if workers_down > 0; then
  /usr/local/bin/server-alert.sh "Laravel workers DOWN ($workers_down)"
fi
```

---

## Webhook (Receive Messages)

Untuk terima pesan/perintah:

```typescript
// routes/telegram-webhook.ts
app.post('/webhook/telegram', async (req, res) => {
  const { message, callback_query } = req.body;

  if (message?.text) {
    const chatId = message.chat.id;
    const text = message.text;

    // Handle command
    if (text === '/status') {
      const status = await getSystemStatus();
      await telegram.send(chatId, `Status: ${status}`);
    }
  }

  if (callback_query) {
    // Handle button click
    await handleCallback(callback_query);
  }

  res.sendStatus(200);
});

// Register webhook (sekali saja)
await axios.post(
  `https://api.telegram.org/bot${TOKEN}/setWebhook`,
  { url: 'https://yourdomain.com/webhook/telegram' }
);
```

---

## Rate Limits

Telegram limits (per bot):
- **30 pesan/detik** ke user berbeda
- **20 pesan/menit** ke grup/channel yang sama
- **1 pesan/detik** per chat untuk burst

Handle 429:

```typescript
if (error.response?.status === 429) {
  const retryAfter = error.response.data.parameters?.retry_after ?? 5;
  await delay(retryAfter * 1000);
  return this.send(...);  // Retry
}
```

---

## Common Use Cases

| Use Case | Channel | Catatan |
|----------|---------|---------|
| Server alert (worker down, disk full) | Private channel | Emoji + code block |
| Order baru ke admin | Group | Inline buttons untuk action |
| Error spike alert | Private channel | Rate limit alert (jangan spam) |
| Customer support | Private chat user | Dua arah + webhook |
| Deploy notification | Channel | Status: started → success/failed |

---

## Checklist

- [ ] Bot dibuat via @BotFather
- [ ] Token di environment variable
- [ ] chat_id didapat (user/group/channel)
- [ ] Pakai HTML parse mode (lebih simpel)
- [ ] Escape HTML special chars
- [ ] Rate limit handling (429 retry)
- [ ] Webhook untuk dua arah (jika butuh)
- [ ] Alert leveling (info/warning/critical)
- [ ] Jangan spam (rate limit alert sendiri)
