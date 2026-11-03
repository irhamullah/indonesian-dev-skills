---
name: payment-gateway-indonesia
description: Use when integrating Indonesian payment gateways (Midtrans, Xendit, Doku) with QRIS, Virtual Account, or e-wallets (GoPay, OVO, DANA, ShopeePay). Triggers on "payment gateway", "Midtrans", "Xendit", "Doku", "QRIS", "virtual account", "e-wallet", "GoPay", "webhook verification", "payment integration Indonesia"
---

# Payment Gateway Indonesia Integration

## Overview

Integrasi payment gateway lokal Indonesia (Midtrans, Xendit, Doku) dengan pattern yang konsisten dan maintainable. Skill ini mengatasi pain points utama: webhook signature verification yang berbeda-beda, status mapping yang tidak konsisten, dan sandbox testing yang merepotkan.

Approach: **Unified normalization layer** untuk production code + **side-by-side reference patterns** untuk quick reference.

## When to Use

- Ketika setup payment gateway Indonesia (Midtrans, Xendit, atau Doku)
- Ketika implement payment methods: QRIS, Virtual Account, e-wallet (GoPay, OVO, DANA, ShopeePay)
- Ketika handle webhook dari payment provider
- Ketika mapping status transaksi yang berbeda-beda
- Ketika setup sandbox testing environment
- Ketika switch atau add payment provider baru

**Jangan pakai kalau:**
- International payment gateway only (Stripe, PayPal) - use `api-and-interface-design` instead
- Payment logic sudah ada dan stable (cuma bug fixing kecil)

## Core Principles

### Prinsip 1: Normalize at the Boundary

Semua provider punya format berbeda. Normalize sekali di adapter layer, sisa aplikasi pakai interface yang sama.

```typescript
// Bad: Business logic tahu detail provider
if (provider === 'midtrans') {
  if (status === 'settlement') return 'paid';
} else if (provider === 'xendit') {
  if (status === 'SUCCEEDED') return 'paid';
}

// Good: Normalize di adapter
interface PaymentGateway {
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyWebhook(rawBody: string, signature: string): WebhookPayload;
  normalizeStatus(providerStatus: string): PaymentStatus;
}

class MidtransAdapter implements PaymentGateway {
  normalizeStatus(status: string): PaymentStatus {
    const mapping = {
      'settlement': 'paid',
      'pending': 'pending',
      'expire': 'expired',
      'cancel': 'cancelled',
    };
    return mapping[status] || 'unknown';
  }
}
```

### Prinsip 2: Webhook Security First

Webhook signature verification wajib, algoritma berbeda per provider. Verify sebelum process payload.

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

### Prinsip 3: Idempotent Webhook Handling

Webhook bisa datang multiple times untuk transaksi yang sama. Handle idempotently.

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

## Workflow

### Step 1: Define Normalized Interface

Buat interface yang provider-agnostic. Ini contract untuk semua adapters.

```typescript
// types/payment.ts

export type PaymentMethod = 'qris' | 'va_bca' | 'va_bni' | 'va_mandiri' | 'gopay' | 'ovo' | 'dana' | 'shopeepay';

export type PaymentStatus = 
  | 'pending'      // Menunggu pembayaran
  | 'paid'         // Sudah dibayar
  | 'expired'      // Kadaluarsa
  | 'cancelled'    // Dibatalkan
  | 'failed'       // Gagal
  | 'refunded';    // Di-refund

export interface PaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description?: string;
  expiryMinutes?: number;
}

export interface PaymentResponse {
  transactionId: string;
  orderId: string;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  paymentUrl?: string;      // For e-wallet redirect
  qrCode?: string;          // For QRIS
  vaNumber?: string;        // For Virtual Account
  bankCode?: string;        // For Virtual Account
  expiresAt: Date;
  createdAt: Date;
}

export interface WebhookPayload {
  transactionId: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  paidAt?: Date;
  raw: unknown;  // Original payload dari provider
}

export interface PaymentGateway {
  // Create payment
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  
  // Verify webhook signature
  verifyWebhook(rawBody: string, signature: string): boolean;
  
  // Parse webhook payload
  parseWebhook(body: unknown): WebhookPayload;
  
  // Get payment status
  getPaymentStatus(transactionId: string): Promise<PaymentResponse>;
  
  // Cancel payment (optional)
  cancelPayment?(transactionId: string): Promise<void>;
}
```

### Step 2: Implement Adapter Per Provider

Implement interface untuk setiap provider. Start dengan satu (biasanya Midtrans atau Xendit).

```typescript
// adapters/midtrans.adapter.ts

import crypto from 'crypto';
import { PaymentGateway, PaymentRequest, PaymentResponse, WebhookPayload, PaymentStatus } from '../types/payment';

export class MidtransAdapter implements PaymentGateway {
  private serverKey: string;
  private clientKey: string;
  private isProduction: boolean;
  
  constructor(config: { serverKey: string; clientKey: string; isProduction?: boolean }) {
    this.serverKey = config.serverKey;
    this.clientKey = config.clientKey;
    this.isProduction = config.isProduction || false;
  }
  
  private get baseUrl() {
    return this.isProduction 
      ? 'https://api.midtrans.com'
      : 'https://api.sandbox.midtrans.com';
  }
  
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Implementation untuk Midtrans
    // See examples.md untuk full implementation
  }
  
  verifyWebhook(rawBody: string, signature: string): boolean {
    // Midtrans: SHA512(order_id + status_code + gross_amount + server_key)
    const body = JSON.parse(rawBody);
    const hash = crypto
      .createHash('sha512')
      .update(`${body.order_id}${body.status_code}${body.gross_amount}${this.serverKey}`)
      .digest('hex');
    
    return hash === signature;
  }
  
  parseWebhook(body: unknown): WebhookPayload {
    const data = body as any;
    
    return {
      transactionId: data.transaction_id,
      orderId: data.order_id,
      status: this.normalizeStatus(data.transaction_status),
      amount: parseFloat(data.gross_amount),
      paidAt: data.transaction_time ? new Date(data.transaction_time) : undefined,
      raw: data,
    };
  }
  
  private normalizeStatus(status: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      'capture': 'paid',
      'settlement': 'paid',
      'pending': 'pending',
      'deny': 'failed',
      'expire': 'expired',
      'cancel': 'cancelled',
      'refund': 'refunded',
    };
    
    return mapping[status] || 'pending';
  }
  
  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    // Implementation
  }
}
```

**Repeat untuk Xendit dan Doku adapters** - lihat `examples.md` untuk full implementation.

### Step 3: Factory Pattern untuk Provider Selection

Buat factory untuk switch provider dengan mudah.

```typescript
// payment-gateway.factory.ts

import { PaymentGateway } from './types/payment';
import { MidtransAdapter } from './adapters/midtrans.adapter';
import { XenditAdapter } from './adapters/xendit.adapter';
import { DokuAdapter } from './adapters/doku.adapter';

export type PaymentProvider = 'midtrans' | 'xendit' | 'doku';

export class PaymentGatewayFactory {
  static create(provider: PaymentProvider): PaymentGateway {
    switch (provider) {
      case 'midtrans':
        return new MidtransAdapter({
          serverKey: process.env.MIDTRANS_SERVER_KEY!,
          clientKey: process.env.MIDTRANS_CLIENT_KEY!,
          isProduction: process.env.NODE_ENV === 'production',
        });
      
      case 'xendit':
        return new XenditAdapter({
          apiKey: process.env.XENDIT_API_KEY!,
          webhookToken: process.env.XENDIT_WEBHOOK_TOKEN!,
          isProduction: process.env.NODE_ENV === 'production',
        });
      
      case 'doku':
        return new DokuAdapter({
          clientId: process.env.DOKU_CLIENT_ID!,
          sharedKey: process.env.DOKU_SHARED_KEY!,
          isProduction: process.env.NODE_ENV === 'production',
        });
      
      default:
        throw new Error(`Unknown payment provider: ${provider}`);
    }
  }
}
```

### Step 4: Implement Webhook Handler

Webhook handler yang provider-agnostic dengan signature verification.

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

### Step 5: Setup Sandbox Testing

Testing strategy untuk verify integration tanpa hit production.

**Checklist:**
- [ ] Setup sandbox credentials per provider (see `references/sandbox-setup.md`)
- [ ] Create test helper untuk simulate webhook
- [ ] Test signature verification dengan payload sandbox
- [ ] Test status mapping untuk semua status codes
- [ ] Test idempotency (kirim webhook multiple times)

```typescript
// tests/webhook.test.ts

import { MidtransAdapter } from '../adapters/midtrans.adapter';

describe('Midtrans Webhook', () => {
  const adapter = new MidtransAdapter({
    serverKey: 'SB-Mid-server-test',
    clientKey: 'SB-Mid-client-test',
    isProduction: false,
  });
  
  it('should verify valid webhook signature', () => {
    const payload = {
      order_id: 'ORDER-123',
      status_code: '200',
      gross_amount: '100000',
      transaction_status: 'settlement',
    };
    
    // Generate valid signature
    const signature = crypto
      .createHash('sha512')
      .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}SB-Mid-server-test`)
      .digest('hex');
    
    const isValid = adapter.verifyWebhook(JSON.stringify(payload), signature);
    expect(isValid).toBe(true);
  });
  
  it('should reject invalid signature', () => {
    const payload = { order_id: 'ORDER-123' };
    const isValid = adapter.verifyWebhook(JSON.stringify(payload), 'invalid-signature');
    expect(isValid).toBe(false);
  });
  
  it('should normalize status correctly', () => {
    const payload = adapter.parseWebhook({
      transaction_status: 'settlement',
      order_id: 'ORDER-123',
      transaction_id: 'TXN-123',
      gross_amount: '100000',
    });
    
    expect(payload.status).toBe('paid');
  });
});
```

### Step 6: Environment Variables Setup

```bash
# .env.example

# Midtrans
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx

# Xendit
XENDIT_API_KEY=xnd_development_xxx
XENDIT_WEBHOOK_TOKEN=xxx

# Doku
DOKU_CLIENT_ID=xxx
DOKU_SHARED_KEY=xxx

# App
NODE_ENV=development
PAYMENT_PROVIDER=midtrans  # or xendit, doku
```

## Anti-Patterns

### ❌ **No Signature Verification**

```typescript
// Bad: Trust webhook tanpa verify
app.post('/webhook', async (req, res) => {
  await updatePayment(req.body); // Vulnerable to fake webhooks!
});
```

### ❌ **Status String Hardcoded**

```typescript
// Bad: Magic strings scattered everywhere
if (payment.status === 'settlement') { ... }
if (payment.status === 'SUCCEEDED') { ... }
if (payment.status === 'SUCCESS') { ... }

// Good: Normalized enum
enum PaymentStatus { PAID = 'paid', PENDING = 'pending', ... }
if (payment.status === PaymentStatus.PAID) { ... }
```

### ❌ **No Idempotency Check**

```typescript
// Bad: Process every webhook
app.post('/webhook', async (req, res) => {
  await chargeCustomer(orderId); // Bisa charge multiple times!
});

// Good: Check first
if (payment.status === 'paid') return;
await chargeCustomer(orderId);
```

### ❌ **Provider Logic Leaking to Business Layer**

```typescript
// Bad: Business logic tahu detail provider
async function processOrder(orderId: string) {
  if (config.provider === 'midtrans') {
    // Midtrans-specific logic
  } else if (config.provider === 'xendit') {
    // Xendit-specific logic
  }
}

// Good: Business logic provider-agnostic
async function processOrder(orderId: string) {
  const gateway = PaymentGatewayFactory.create(config.provider);
  await gateway.createPayment(request);
}
```

## Verification

Sebelum consider integration complete:

- [ ] Interface `PaymentGateway` terdefinisi dan documented
- [ ] Minimal 1 adapter implemented (Midtrans or Xendit)
- [ ] Webhook signature verification working
- [ ] Status normalization table complete
- [ ] Sandbox testing berhasil (webhook simulation)
- [ ] Idempotency check implemented
- [ ] Environment variables documented
- [ ] Error handling untuk network failures
- [ ] Logging untuk debugging (without sensitive data)
- [ ] Unit tests untuk signature verification dan status mapping

## References

Skill-specific references:

- `references/provider-comparison.md` - Side-by-side comparison ketiga provider
- `references/webhook-verification.md` - Detail algoritma webhook signature per provider
- `references/status-mapping.md` - Complete status code mapping table
- `references/sandbox-setup.md` - Sandbox credentials dan endpoints

Shared checklists:

- `../../references/security-checklist.md` - Untuk webhook security
- `../../references/testing-patterns.md` - Untuk testing strategy

## Related Skills

- `api-and-interface-design` - Untuk design interface layer yang robust
- `security-and-hardening` - Untuk webhook security dan credential management
- `test-driven-development` - Untuk testing adapter implementations
- `observability-and-instrumentation` - Untuk monitoring payment transactions
