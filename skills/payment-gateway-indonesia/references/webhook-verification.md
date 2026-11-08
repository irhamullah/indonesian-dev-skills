# Webhook Signature Verification

Detail algoritma dan implementasi webhook signature verification untuk ketiga provider.

---

## Why Webhook Verification Matters

Webhook tanpa verification = **vulnerability besar**:

- ❌ Attacker bisa kirim fake webhook → mark payment as "paid" tanpa bayar
- ❌ Competitor bisa spam webhook endpoint → DOS attack
- ❌ Man-in-the-middle bisa modify payload

**ALWAYS verify webhook signature sebelum process payload.**

---

## Midtrans Signature Verification

### Algorithm

**SHA512** hash dari concatenated string:

```
SHA512(order_id + status_code + gross_amount + server_key)
```

### Implementation

```typescript
import crypto from 'crypto';

function verifyMidtransWebhook(
  payload: any,
  signature: string,
  serverKey: string
): boolean {
  const signatureString = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
  
  const hash = crypto
    .createHash('sha512')
    .update(signatureString)
    .digest('hex');
  
  return hash === signature;
}
```

### Express.js Integration

```typescript
import express from 'express';

app.post('/webhook/midtrans', 
  express.json(),
  (req, res) => {
    // Signature ada di body untuk beberapa payment method
    const signature = req.body.signature_key;
    
    // Atau hitung manual untuk yang tidak ada signature_key
    const isValid = verifyMidtransWebhook(
      req.body,
      signature,
      process.env.MIDTRANS_SERVER_KEY!
    );
    
    if (!isValid) {
      console.error('Invalid Midtrans webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process webhook
    await processPayment(req.body);
    res.status(200).send('OK');
  }
);
```

### Gotchas

⚠️ **Signature tidak selalu ada di `signature_key` field**

Beberapa payment methods (GoPay, ShopeePay) tidak include `signature_key` di webhook. Harus hitung manual.

⚠️ **`gross_amount` adalah string dengan 2 desimal**

```typescript
// Wrong
const amount = 100000;  // Integer

// Right
const amount = "100000.00";  // String dengan .00
```

⚠️ **Order matters**

String concatenation harus exact: `order_id + status_code + gross_amount + server_key`, tidak boleh spasi atau delimiter.

---

## Xendit Signature Verification

### Algorithm

**HMAC SHA256** dengan webhook verification token:

```
HMAC-SHA256(webhook_token, raw_request_body)
```

### Implementation

```typescript
import crypto from 'crypto';

function verifyXenditWebhook(
  rawBody: string,
  signature: string,
  webhookToken: string
): boolean {
  const hash = crypto
    .createHmac('sha256', webhookToken)
    .update(rawBody)
    .digest('hex');
  
  return hash === signature;
}
```

### Express.js Integration

```typescript
app.post('/webhook/xendit',
  express.raw({ type: 'application/json' }),  // Important: raw body!
  (req, res) => {
    const signature = req.headers['x-callback-token'] as string;
    
    if (!signature) {
      return res.status(401).json({ error: 'Missing signature header' });
    }
    
    const isValid = verifyXenditWebhook(
      req.body.toString(),
      signature,
      process.env.XENDIT_WEBHOOK_TOKEN!
    );
    
    if (!isValid) {
      console.error('Invalid Xendit webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Parse body after verification
    const payload = JSON.parse(req.body.toString());
    await processPayment(payload);
    res.status(200).send('OK');
  }
);
```

### Gotchas

⚠️ **MUST use raw body, not parsed JSON**

```typescript
// Wrong: body sudah di-parse jadi object
app.use(express.json());
app.post('/webhook/xendit', (req, res) => {
  verifyXenditWebhook(JSON.stringify(req.body), ...);  // WRONG!
});

// Right: raw body
app.post('/webhook/xendit',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    verifyXenditWebhook(req.body.toString(), ...);  // RIGHT!
  }
);
```

⚠️ **Webhook Token ≠ API Key**

Xendit punya 2 credentials:
- **API Key** → untuk create payment
- **Webhook Token** → untuk verify webhook

Jangan pakai API Key untuk verify webhook!

⚠️ **Header name: `x-callback-token`**

Bukan `x-signature` atau `authorization`.

---

## Doku Signature Verification

### Algorithm

**SHA256** hash dari concatenated string:

```
SHA256(amount + shared_key + invoice_number)
```

### Implementation

```typescript
import crypto from 'crypto';

function verifyDokuWebhook(
  payload: any,
  signature: string,
  sharedKey: string
): boolean {
  const signatureString = `${payload.order.amount}${sharedKey}${payload.order.invoice_number}`;
  
  const hash = crypto
    .createHash('sha256')
    .update(signatureString)
    .digest('hex');
  
  return hash === signature;
}
```

### Express.js Integration

```typescript
app.post('/webhook/doku',
  express.json(),
  (req, res) => {
    const signature = req.headers['signature'] as string;
    
    if (!signature) {
      return res.status(401).json({ error: 'Missing signature header' });
    }
    
    const isValid = verifyDokuWebhook(
      req.body,
      signature,
      process.env.DOKU_SHARED_KEY!
    );
    
    if (!isValid) {
      console.error('Invalid Doku webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    await processPayment(req.body);
    res.status(200).send('OK');
  }
);
```

### Gotchas

⚠️ **Amount format**

Doku webhook amount adalah integer tanpa desimal:
```typescript
const amount = 100000;  // Integer
```

⚠️ **Nested payload structure**

Doku webhook payload nested:
```json
{
  "order": {
    "amount": 100000,
    "invoice_number": "ORDER-123"
  }
}
```

Access dengan `payload.order.amount`, bukan `payload.amount`.

---

## Unified Verification in Adapter

```typescript
// adapters/base.adapter.ts

export abstract class BasePaymentAdapter implements PaymentGateway {
  abstract verifyWebhook(rawBody: string, signature: string): boolean;
  
  protected verifyWebhookSafe(
    rawBody: string,
    signature: string | undefined
  ): boolean {
    if (!signature) {
      console.error('Webhook signature missing');
      return false;
    }
    
    try {
      return this.verifyWebhook(rawBody, signature);
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }
}

// adapters/midtrans.adapter.ts
export class MidtransAdapter extends BasePaymentAdapter {
  verifyWebhook(rawBody: string, signature: string): boolean {
    const body = JSON.parse(rawBody);
    const hash = crypto
      .createHash('sha512')
      .update(`${body.order_id}${body.status_code}${body.gross_amount}${this.serverKey}`)
      .digest('hex');
    
    return hash === signature;
  }
}

// adapters/xendit.adapter.ts
export class XenditAdapter extends BasePaymentAdapter {
  verifyWebhook(rawBody: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha256', this.webhookToken)
      .update(rawBody)
      .digest('hex');
    
    return hash === signature;
  }
}
```

---

## Testing Webhook Verification

### Unit Tests

```typescript
import { MidtransAdapter } from '../adapters/midtrans.adapter';
import { XenditAdapter } from '../adapters/xendit.adapter';
import crypto from 'crypto';

describe('Webhook Verification', () => {
  describe('Midtrans', () => {
    const adapter = new MidtransAdapter({
      serverKey: 'test-server-key',
      clientKey: 'test-client-key',
    });
    
    it('should verify valid signature', () => {
      const payload = {
        order_id: 'ORDER-123',
        status_code: '200',
        gross_amount: '100000.00',
      };
      
      const signature = crypto
        .createHash('sha512')
        .update('ORDER-123200100000.00test-server-key')
        .digest('hex');
      
      const isValid = adapter.verifyWebhook(
        JSON.stringify(payload),
        signature
      );
      
      expect(isValid).toBe(true);
    });
    
    it('should reject invalid signature', () => {
      const payload = { order_id: 'ORDER-123' };
      const isValid = adapter.verifyWebhook(
        JSON.stringify(payload),
        'invalid-signature'
      );
      
      expect(isValid).toBe(false);
    });
    
    it('should reject tampered payload', () => {
      const originalPayload = {
        order_id: 'ORDER-123',
        status_code: '200',
        gross_amount: '100000.00',
      };
      
      const signature = crypto
        .createHash('sha512')
        .update('ORDER-123200100000.00test-server-key')
        .digest('hex');
      
      // Attacker tampers with amount
      const tamperedPayload = {
        ...originalPayload,
        gross_amount: '1.00',  // Changed!
      };
      
      const isValid = adapter.verifyWebhook(
        JSON.stringify(tamperedPayload),
        signature
      );
      
      expect(isValid).toBe(false);
    });
  });
  
  describe('Xendit', () => {
    const adapter = new XenditAdapter({
      apiKey: 'test-api-key',
      webhookToken: 'test-webhook-token',
    });
    
    it('should verify valid signature', () => {
      const payload = {
        event: 'ewallet.charge.completed',
        data: { id: 'ewc_123' },
      };
      const body = JSON.stringify(payload);
      
      const signature = crypto
        .createHmac('sha256', 'test-webhook-token')
        .update(body)
        .digest('hex');
      
      const isValid = adapter.verifyWebhook(body, signature);
      expect(isValid).toBe(true);
    });
    
    it('should reject if body modified', () => {
      const originalBody = JSON.stringify({ event: 'test' });
      
      const signature = crypto
        .createHmac('sha256', 'test-webhook-token')
        .update(originalBody)
        .digest('hex');
      
      const tamperedBody = JSON.stringify({ event: 'tampered' });
      
      const isValid = adapter.verifyWebhook(tamperedBody, signature);
      expect(isValid).toBe(false);
    });
  });
});
```

### Integration Test with Webhook Simulator

```typescript
// tests/webhook.integration.test.ts

import request from 'supertest';
import app from '../app';
import { WebhookSimulator } from './helpers/webhook-simulator';

describe('Webhook Integration', () => {
  it('should accept valid Midtrans webhook', async () => {
    const { body, signature } = WebhookSimulator.midtrans(
      {
        orderId: 'ORDER-123',
        transactionId: 'TXN-123',
        amount: 100000,
        status: 'settlement',
      },
      process.env.MIDTRANS_SERVER_KEY!
    );
    
    const response = await request(app)
      .post('/webhook/midtrans')
      .send(body);
    
    expect(response.status).toBe(200);
  });
  
  it('should reject invalid signature', async () => {
    const response = await request(app)
      .post('/webhook/midtrans')
      .send({ order_id: 'ORDER-123' })
      .set('x-signature', 'invalid');
    
    expect(response.status).toBe(401);
  });
});
```

---

## Common Mistakes

### ❌ Mistake 1: Using parsed body for HMAC

```typescript
// Wrong
app.use(express.json());
app.post('/webhook/xendit', (req, res) => {
  const body = JSON.stringify(req.body);  // Re-stringified, whitespace different!
  verify(body, signature);  // Will fail
});

// Right
app.post('/webhook/xendit',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const body = req.body.toString();  // Original raw body
    verify(body, signature);  // Works
  }
);
```

### ❌ Mistake 2: Case-sensitive comparison

```typescript
// Wrong
return hash.toLowerCase() === signature;  // Signature might be uppercase

// Right
return hash === signature;  // Keep original case
// Or normalize both
return hash.toLowerCase() === signature.toLowerCase();
```

### ❌ Mistake 3: Not handling missing signature

```typescript
// Wrong
const isValid = verifyWebhook(body, req.headers['x-signature']);
// TypeError if header missing

// Right
const signature = req.headers['x-signature'];
if (!signature) {
  return res.status(401).json({ error: 'Missing signature' });
}
const isValid = verifyWebhook(body, signature);
```

### ❌ Mistake 4: Logging sensitive data

```typescript
// Wrong
console.log('Webhook received:', req.body, 'signature:', signature);
// Leaks server key in logs if someone can see them

// Right
console.log('Webhook received for order:', req.body.order_id);
// Log only non-sensitive identifiers
```

---

## Security Best Practices

1. **Always verify before processing**
   ```typescript
   // Verify first
   if (!isValid) return res.status(401).send();
   
   // Then process
   await processPayment(payload);
   ```

2. **Use constant-time comparison** (prevent timing attacks)
   ```typescript
   import crypto from 'crypto';
   
   function safeCompare(a: string, b: string): boolean {
     return crypto.timingSafeEqual(
       Buffer.from(a),
       Buffer.from(b)
     );
   }
   ```

3. **Rate limit webhook endpoint**
   ```typescript
   import rateLimit from 'express-rate-limit';
   
   const webhookLimiter = rateLimit({
     windowMs: 60 * 1000,  // 1 minute
     max: 100,  // Max 100 requests per minute
   });
   
   app.post('/webhook/*', webhookLimiter, ...);
   ```

4. **Log verification failures**
   ```typescript
   if (!isValid) {
     console.error('Webhook verification failed', {
       provider: 'midtrans',
       orderId: body.order_id,
       ip: req.ip,
       timestamp: new Date().toISOString(),
     });
     return res.status(401).send();
   }
   ```

5. **Keep credentials in environment variables**
   ```typescript
   // Never hardcode
   const serverKey = process.env.MIDTRANS_SERVER_KEY;
   
   // Fail fast if missing
   if (!serverKey) {
     throw new Error('MIDTRANS_SERVER_KEY not configured');
   }
   ```

---

## Quick Reference

| Provider | Algorithm | Header/Field | Input | Key |
|----------|-----------|--------------|-------|-----|
| **Midtrans** | SHA512 | `signature_key` (body) | `order_id + status_code + gross_amount + server_key` | Server Key |
| **Xendit** | HMAC-SHA256 | `x-callback-token` (header) | Raw request body | Webhook Token |
| **Doku** | SHA256 | `signature` (header) | `amount + shared_key + invoice` | Shared Key |

---

## Debugging Checklist

Webhook verification failed? Check:

- [ ] Using correct key (server key / webhook token / shared key)
- [ ] Correct field order in signature string
- [ ] Correct amount format (string vs integer, with/without decimals)
- [ ] Using raw body for HMAC (not re-stringified JSON)
- [ ] Signature extracted from correct location (header vs body)
- [ ] No extra whitespace or newlines in signature string
- [ ] Keys not expired or rotated
- [ ] Using sandbox keys in development, production keys in production

---

## Webhook Security First

Signature verification wajib dan algoritmanya berbeda per provider. Verify sebelum
process payload.

```typescript
// Bad: Process dulu, verify belakangan (atau tidak sama sekali)
app.post('/webhook/midtrans', (req, res) => {
  const payment = await processPayment(req.body);
  // No signature verification!
});

// Good: Verify first, process after
app.post('/webhook/midtrans', (req, res) => {
  const isValid = midtransAdapter.verifyWebhook(
    req.rawBody,
    req.headers['x-signature']
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  await processPayment(req.body);
  res.status(200).send('OK');
});
```

### Anti-Pattern: No Signature Verification

```typescript
// Bad: Trust webhook tanpa verify
app.post('/webhook', async (req, res) => {
  await updatePayment(req.body); // Vulnerable to fake webhooks!
});
```

---

## Idempotent Webhook Handling

Webhook bisa datang multiple times untuk transaksi yang sama. Proses sekali saja.

```typescript
// Bad: Process setiap webhook datang
app.post('/webhook', async (req, res) => {
  await updatePaymentStatus(req.body.order_id, 'paid');
  await sendEmailReceipt(req.body.order_id); // Bisa kirim email multiple times!
});

// Good: Check first, process once
app.post('/webhook', async (req, res) => {
  const payment = await getPayment(req.body.order_id);
  
  if (payment.status === 'paid') {
    return res.status(200).send('Already processed');
  }
  
  await updatePaymentStatus(req.body.order_id, 'paid');
  await sendEmailReceipt(req.body.order_id);
  res.status(200).send('OK');
});
```

### Anti-Pattern: No Idempotency Check

```typescript
// Bad: Process every webhook
app.post('/webhook', async (req, res) => {
  await chargeCustomer(orderId); // Bisa charge multiple times!
});

// Good: Check first
if (payment.status === 'paid') return;
await chargeCustomer(orderId);
```

---

## Provider-Agnostic Webhook Handler

Handler tunggal untuk semua provider: verify → parse → idempotency → update status →
post-payment actions.

```typescript
// routes/webhook.ts

import express from 'express';
import { PaymentGatewayFactory } from '../payment-gateway.factory';

const router = express.Router();

router.post('/webhook/:provider', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const provider = req.params.provider as 'midtrans' | 'xendit' | 'doku';
    const gateway = PaymentGatewayFactory.create(provider);
    
    // 1. Verify signature
    const signature = req.headers['x-signature'] || req.headers['x-callback-token'] as string;
    const isValid = gateway.verifyWebhook(req.body.toString(), signature);
    
    if (!isValid) {
      console.error(`Invalid webhook signature from ${provider}`);
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // 2. Parse payload
    const payload = gateway.parseWebhook(JSON.parse(req.body.toString()));
    
    // 3. Check idempotency
    const payment = await PaymentService.getByOrderId(payload.orderId);
    
    if (payment.status === 'paid') {
      console.log(`Payment ${payload.orderId} already processed`);
      return res.status(200).send('OK');
    }
    
    // 4. Update payment status
    await PaymentService.updateStatus({
      orderId: payload.orderId,
      status: payload.status,
      transactionId: payload.transactionId,
      paidAt: payload.paidAt,
    });
    
    // 5. Trigger post-payment actions
    if (payload.status === 'paid') {
      await OrderService.fulfillOrder(payload.orderId);
      await NotificationService.sendPaymentSuccess(payload.orderId);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
```
