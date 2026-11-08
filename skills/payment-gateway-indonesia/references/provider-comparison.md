# Provider Comparison: Midtrans vs Xendit vs Doku

Side-by-side comparison untuk ketiga payment gateway Indonesia.

---

## Overview Comparison

| Feature | Midtrans | Xendit | Doku |
|---------|----------|--------|------|
| **Market Position** | Market leader | Fast growing | Established |
| **API Quality** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Documentation** | Good | Excellent | Average |
| **Dashboard UX** | Good | Excellent | Average |
| **Pricing** | 2-2.9% | 2-3% | 2.5-3.5% |
| **Settlement Time** | T+1 to T+7 | T+1 to T+7 | T+1 to T+7 |

---

## Payment Methods Support

| Method | Midtrans | Xendit | Doku |
|--------|----------|--------|------|
| **QRIS** | ✅ | ✅ | ✅ |
| **VA BCA** | ✅ | ✅ | ✅ |
| **VA BNI** | ✅ | ✅ | ✅ |
| **VA Mandiri** | ✅ | ✅ | ✅ |
| **VA Permata** | ✅ | ✅ | ✅ |
| **VA Other Banks** | ✅ | ✅ | ✅ |
| **GoPay** | ✅ | ✅ | ✅ |
| **OVO** | ✅ | ✅ | ✅ |
| **DANA** | ✅ | ✅ | ✅ |
| **ShopeePay** | ✅ | ✅ | ✅ |
| **LinkAja** | ✅ | ❌ | ✅ |
| **Credit Card** | ✅ | ✅ | ✅ |
| **Installment** | ✅ | ✅ | ✅ |
| **Convenience Store** | ✅ | ✅ | ✅ |

---

## API Endpoints

### Midtrans

```
Base URL (Sandbox): https://api.sandbox.midtrans.com
Base URL (Production): https://api.midtrans.com

Core Endpoints:
- POST   /v2/charge               # Create payment
- GET    /v2/{id}/status          # Check status
- POST   /v2/{id}/cancel          # Cancel payment
- POST   /v2/{id}/refund          # Refund payment

Snap (Hosted Page):
- POST   /snap/v1/transactions    # Create snap token
```

### Xendit

```
Base URL: https://api.xendit.co

Core Endpoints:
- POST   /qr_codes                      # Create QRIS
- POST   /callback_virtual_accounts    # Create VA
- POST   /ewallets/charges              # Create e-wallet charge
- GET    /callback_virtual_accounts/{id}
- GET    /ewallets/charges/{charge_id}

Webhook callback: You provide the URL
```

### Doku

```
Base URL (Sandbox): https://api-sandbox.doku.com
Base URL (Production): https://api.doku.com

Core Endpoints:
- POST   /v1/payment-channels/{channel}/payment-codes  # Create payment
- GET    /v1/orders/{invoice}                          # Check status
- POST   /v1/orders/{invoice}/cancel                   # Cancel payment
```

---

## Authentication

### Midtrans

```typescript
// Basic Auth dengan Server Key
const auth = Buffer.from(serverKey + ':').toString('base64');
headers: {
  'Authorization': `Basic ${auth}`
}
```

### Xendit

```typescript
// Basic Auth dengan API Key
const auth = Buffer.from(apiKey + ':').toString('base64');
headers: {
  'Authorization': `Basic ${auth}`
}
```

### Doku

```typescript
// Custom header dengan Client ID dan Signature
headers: {
  'Client-Id': clientId,
  'Request-Id': uuid(),
  'Request-Timestamp': timestamp,
  'Signature': generateSignature(...)
}
```

---

## Webhook Headers

### Midtrans

```
Header: X-Signature (ada di beberapa payment method)
Alternative: Hitung SHA512 di server side
```

### Xendit

```
Header: X-Callback-Token
Method: HMAC SHA256
```

### Doku

```
Header: Signature
Method: SHA256
```

---

## Payment Creation: QRIS

### Midtrans

```typescript
POST /v2/charge
{
  "payment_type": "qris",
  "transaction_details": {
    "order_id": "ORDER-123",
    "gross_amount": 100000
  },
  "qris": {
    "acquirer": "gopay"
  }
}

// Response
{
  "status_code": "201",
  "transaction_id": "...",
  "actions": [
    {
      "name": "generate-qr-code",
      "method": "GET",
      "url": "https://..."  // QR code image URL
    }
  ]
}
```

### Xendit

```typescript
POST /qr_codes
{
  "external_id": "ORDER-123",
  "type": "DYNAMIC",
  "amount": 100000,
  "callback_url": "https://..."
}

// Response
{
  "id": "qr_...",
  "external_id": "ORDER-123",
  "qr_string": "00020101...",  // QR string untuk generate image
  "callback_url": "https://...",
  "status": "ACTIVE"
}
```

### Doku

```typescript
POST /v1/payment-channels/qris/payment-codes
{
  "order": {
    "invoice_number": "ORDER-123",
    "amount": 100000
  }
}

// Response
{
  "response": {
    "qr_string": "00020101...",
    "expired_date": "2024-01-01T10:00:00Z"
  }
}
```

---

## Payment Creation: Virtual Account

### Midtrans (BCA)

```typescript
POST /v2/charge
{
  "payment_type": "bank_transfer",
  "transaction_details": {
    "order_id": "ORDER-123",
    "gross_amount": 100000
  },
  "bank_transfer": {
    "bank": "bca"
  }
}

// Response
{
  "va_numbers": [
    {
      "bank": "bca",
      "va_number": "12345678901234"
    }
  ],
  "transaction_time": "2024-01-01 10:00:00",
  "expiry_time": "2024-01-02 10:00:00"
}
```

### Xendit (BCA)

```typescript
POST /callback_virtual_accounts
{
  "external_id": "ORDER-123",
  "bank_code": "BCA",
  "name": "John Doe",
  "expected_amount": 100000,
  "is_closed": true,
  "expiration_date": "2024-01-02T10:00:00.000Z"
}

// Response
{
  "id": "...",
  "external_id": "ORDER-123",
  "bank_code": "BCA",
  "account_number": "12345678901234",
  "name": "John Doe",
  "expiration_date": "2024-01-02T10:00:00.000Z"
}
```

### Doku (BCA)

```typescript
POST /v1/payment-channels/virtual-account-bank/payment-codes
{
  "order": {
    "invoice_number": "ORDER-123",
    "amount": 100000
  },
  "virtual_account_info": {
    "bank_code": "008",  // BCA code
    "expired_date": "2024-01-02T10:00:00Z"
  }
}

// Response
{
  "virtual_account_info": {
    "bank_code": "008",
    "virtual_account_number": "12345678901234",
    "expired_date": "2024-01-02T10:00:00Z"
  }
}
```

---

## Payment Creation: E-Wallet (GoPay)

### Midtrans

```typescript
POST /v2/charge
{
  "payment_type": "gopay",
  "transaction_details": {
    "order_id": "ORDER-123",
    "gross_amount": 100000
  },
  "gopay": {
    "enable_callback": true,
    "callback_url": "https://..."
  }
}

// Response
{
  "actions": [
    {
      "name": "deeplink-redirect",
      "method": "GET",
      "url": "gojek://gopay/..."  // Deeplink for GoPay app
    }
  ]
}
```

### Xendit

```typescript
POST /ewallets/charges
{
  "reference_id": "ORDER-123",
  "currency": "IDR",
  "amount": 100000,
  "checkout_method": "ONE_TIME_PAYMENT",
  "channel_code": "ID_GOPAY",
  "channel_properties": {
    "success_redirect_url": "https://.../success",
    "failure_redirect_url": "https://.../failed"
  }
}

// Response
{
  "id": "ewc_...",
  "reference_id": "ORDER-123",
  "status": "PENDING",
  "actions": {
    "desktop_web_checkout_url": "https://...",
    "mobile_web_checkout_url": "https://...",
    "mobile_deeplink_checkout_url": "gojek://..."
  }
}
```

### Doku

```typescript
POST /v1/payment-channels/gopay/payment-codes
{
  "order": {
    "invoice_number": "ORDER-123",
    "amount": 100000
  },
  "payment": {
    "payment_due_date": 60
  }
}

// Response
{
  "response": {
    "url": "gojek://..."  // Deeplink
  }
}
```

---

## Webhook Payload Format

### Midtrans

```json
{
  "transaction_time": "2024-01-01 10:00:00",
  "transaction_status": "settlement",
  "transaction_id": "...",
  "status_message": "midtrans payment notification",
  "status_code": "200",
  "signature_key": "...",
  "settlement_time": "2024-01-01 10:05:00",
  "payment_type": "qris",
  "order_id": "ORDER-123",
  "merchant_id": "...",
  "gross_amount": "100000.00",
  "fraud_status": "accept",
  "currency": "IDR"
}
```

### Xendit (E-Wallet)

```json
{
  "event": "ewallet.charge.completed",
  "business_id": "...",
  "created": "2024-01-01T10:00:00.000Z",
  "data": {
    "id": "ewc_...",
    "reference_id": "ORDER-123",
    "business_id": "...",
    "customer_id": null,
    "status": "SUCCEEDED",
    "currency": "IDR",
    "charge_amount": 100000,
    "capture_amount": 100000,
    "channel_code": "ID_GOPAY",
    "created": "2024-01-01T10:00:00.000Z",
    "updated": "2024-01-01T10:05:00.000Z"
  }
}
```

### Xendit (Virtual Account)

```json
{
  "id": "...",
  "external_id": "ORDER-123",
  "account_number": "12345678901234",
  "bank_code": "BCA",
  "amount": 100000,
  "transaction_timestamp": "2024-01-01T10:05:00.000Z",
  "payment_id": "...",
  "callback_virtual_account_id": "..."
}
```

### Doku

```json
{
  "client": {
    "id": "..."
  },
  "order": {
    "invoice_number": "ORDER-123",
    "amount": 100000
  },
  "transaction": {
    "status": "SUCCESS",
    "date": "2024-01-01T10:05:00Z"
  },
  "virtual_account_info": {
    "virtual_account_number": "12345678901234",
    "bank_code": "008"
  }
}
```

---

## Status Code Mapping

| Your Status | Midtrans | Xendit (E-Wallet) | Xendit (VA) | Doku |
|-------------|----------|-------------------|-------------|------|
| **pending** | `pending` | `PENDING` | - | `PENDING` |
| **paid** | `capture`, `settlement` | `SUCCEEDED` | callback webhook fired | `SUCCESS` |
| **failed** | `deny` | `FAILED` | - | `FAILED` |
| **expired** | `expire` | `EXPIRED` | - | `EXPIRED` |
| **cancelled** | `cancel` | `VOIDED` | - | `CANCELLED` |
| **refunded** | `refund`, `partial_refund` | `REFUNDED` | - | `REFUNDED` |

---

## Pros & Cons

### Midtrans

**Pros:**
- ✅ Market leader, trusted by big companies
- ✅ Good documentation (Bahasa + English)
- ✅ Snap hosted page (no need build checkout UI)
- ✅ 3D Secure for credit cards

**Cons:**
- ❌ Webhook signature kadang inconsistent per payment method
- ❌ API response format tidak uniform
- ❌ Dashboard performance kadang lambat

---

### Xendit

**Pros:**
- ✅ Excellent API design (RESTful, consistent)
- ✅ Best-in-class documentation
- ✅ Modern dashboard
- ✅ Webhook verification straightforward (HMAC)
- ✅ Great developer experience

**Cons:**
- ❌ Pricing sedikit lebih mahal untuk volume rendah
- ❌ Belum se-established Midtrans

---

### Doku

**Pros:**
- ✅ Long-established player
- ✅ Support banyak payment methods
- ✅ Good for enterprise clients

**Cons:**
- ❌ API documentation kurang comprehensive
- ❌ Signature generation lebih complex
- ❌ Dashboard UX outdated
- ❌ Developer experience kurang smooth

---

## Recommendation

| Use Case | Recommended Provider |
|----------|---------------------|
| **E-commerce baru** | Xendit (best DX) atau Midtrans (market trust) |
| **Startup/SaaS** | Xendit |
| **Enterprise/Corporate** | Midtrans atau Doku |
| **Multiple providers** | Build abstraction layer (this skill!) |
| **Quick MVP** | Midtrans Snap (hosted page) |
| **Custom checkout flow** | Xendit |

---

## Migration Checklist

Jika mau migrate provider:

- [ ] Implement adapter baru dengan `PaymentGateway` interface
- [ ] Setup webhook endpoint baru (`/webhook/{provider}`)
- [ ] Test webhook signature verification
- [ ] Test semua payment methods di sandbox
- [ ] Update environment variables
- [ ] Deploy dengan feature flag
- [ ] Monitor error rates
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Keep old provider active selama transisi

---

## Factory Pattern untuk Provider Selection

Factory membuat switch provider mudah dan business layer tetap provider-agnostic.

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

---

## Anti-Pattern: Provider Logic Leaking to Business Layer

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
