# Status Code Mapping Table

Complete mapping dari status codes ketiga provider ke normalized status.

---

## Normalized Status Enum

```typescript
export enum PaymentStatus {
  PENDING = 'pending',      // Menunggu pembayaran
  PAID = 'paid',           // Sudah dibayar, settlement
  EXPIRED = 'expired',     // Kadaluarsa, tidak dibayar
  CANCELLED = 'cancelled', // Dibatalkan oleh user/system
  FAILED = 'failed',       // Gagal diproses
  REFUNDED = 'refunded',   // Di-refund (sebagian/penuh)
}
```

---

## Midtrans Status Codes

| Midtrans Status | Status Code | Normalized | Description |
|----------------|-------------|------------|-------------|
| `capture` | 200 | `paid` | Credit card captured (not 3DS) |
| `settlement` | 200 | `paid` | Transaksi berhasil, dana masuk |
| `pending` | 201 | `pending` | Menunggu pembayaran |
| `deny` | 200 | `failed` | Ditolak oleh bank/fraud detection |
| `cancel` | 200 | `cancelled` | Dibatalkan oleh merchant/user |
| `expire` | 202 | `expired` | Kadaluarsa, tidak dibayar |
| `refund` | 200 | `refunded` | Full refund |
| `partial_refund` | 200 | `refunded` | Partial refund |
| `authorize` | 200 | `pending` | Pre-authorization (credit card) |

### Implementation

```typescript
function normalizeMidtransStatus(status: string): PaymentStatus {
  const mapping: Record<string, PaymentStatus> = {
    'capture': PaymentStatus.PAID,
    'settlement': PaymentStatus.PAID,
    'pending': PaymentStatus.PENDING,
    'deny': PaymentStatus.FAILED,
    'cancel': PaymentStatus.CANCELLED,
    'expire': PaymentStatus.EXPIRED,
    'refund': PaymentStatus.REFUNDED,
    'partial_refund': PaymentStatus.REFUNDED,
    'authorize': PaymentStatus.PENDING,
  };
  
  return mapping[status] || PaymentStatus.PENDING;
}
```

### Notes

- **`capture` vs `settlement`**: Keduanya berarti "paid", tapi `capture` untuk credit card non-3DS, `settlement` untuk sisanya
- **`status_code` ≠ HTTP status**: Semua webhook response 200 OK, tapi ada field `status_code` internal
- **Fraud status**: Ada field terpisah `fraud_status` (accept/challenge/deny) yang perlu dicek untuk credit card

---

## Xendit Status Codes

### E-Wallet (GoPay, OVO, DANA, ShopeePay)

| Xendit Status | Normalized | Description |
|--------------|------------|-------------|
| `PENDING` | `pending` | Menunggu pembayaran |
| `SUCCEEDED` | `paid` | Berhasil dibayar |
| `FAILED` | `failed` | Gagal diproses |
| `VOIDED` | `cancelled` | Dibatalkan |
| `REFUNDED` | `refunded` | Di-refund |

### QRIS

| Xendit Status | Normalized | Description |
|--------------|------------|-------------|
| `ACTIVE` | `pending` | QR code aktif, menunggu scan |
| `COMPLETED` | `paid` | Berhasil dibayar |
| `INACTIVE` | `expired` | QR code expired/inactive |

### Virtual Account

Virtual Account tidak punya status field di response creation. Webhook fired ketika payment diterima = `paid`.

```typescript
// VA webhook payload
{
  "id": "...",
  "external_id": "ORDER-123",
  "account_number": "12345678901234",
  "bank_code": "BCA",
  "amount": 100000,
  "payment_id": "..."
}

// Presence of webhook = paid
status = PaymentStatus.PAID
```

### Implementation

```typescript
function normalizeXenditStatus(
  status: string,
  paymentMethod: 'ewallet' | 'qris' | 'va'
): PaymentStatus {
  if (paymentMethod === 'va') {
    // VA webhook only fired on successful payment
    return PaymentStatus.PAID;
  }
  
  const mapping: Record<string, PaymentStatus> = {
    // E-wallet
    'PENDING': PaymentStatus.PENDING,
    'SUCCEEDED': PaymentStatus.PAID,
    'FAILED': PaymentStatus.FAILED,
    'VOIDED': PaymentStatus.CANCELLED,
    'REFUNDED': PaymentStatus.REFUNDED,
    
    // QRIS
    'ACTIVE': PaymentStatus.PENDING,
    'COMPLETED': PaymentStatus.PAID,
    'INACTIVE': PaymentStatus.EXPIRED,
  };
  
  return mapping[status] || PaymentStatus.PENDING;
}
```

### Notes

- **Multiple webhook formats**: E-wallet punya structure berbeda dari VA/QRIS
- **No explicit "expired"**: E-wallet expired tidak trigger webhook, harus polling
- **Webhook event type**: E-wallet webhook ada field `event` (e.g., `ewallet.charge.completed`)

---

## Doku Status Codes

| Doku Status | Normalized | Description |
|------------|------------|-------------|
| `SUCCESS` | `paid` | Berhasil dibayar |
| `PENDING` | `pending` | Menunggu pembayaran |
| `FAILED` | `failed` | Gagal diproses |
| `EXPIRED` | `expired` | Kadaluarsa |
| `CANCELLED` | `cancelled` | Dibatalkan |
| `REFUNDED` | `refunded` | Di-refund |

### Implementation

```typescript
function normalizeDokuStatus(status: string): PaymentStatus {
  const mapping: Record<string, PaymentStatus> = {
    'SUCCESS': PaymentStatus.PAID,
    'PENDING': PaymentStatus.PENDING,
    'FAILED': PaymentStatus.FAILED,
    'EXPIRED': PaymentStatus.EXPIRED,
    'CANCELLED': PaymentStatus.CANCELLED,
    'REFUNDED': PaymentStatus.REFUNDED,
  };
  
  return mapping[status] || PaymentStatus.PENDING;
}
```

### Notes

- **Straightforward mapping**: Doku paling simple, 1:1 mapping
- **Uppercase status**: Always uppercase, perlu normalize untuk consistency

---

## Complete Mapping Table

| Normalized | Midtrans | Xendit E-Wallet | Xendit QRIS | Xendit VA | Doku |
|------------|----------|-----------------|-------------|-----------|------|
| **pending** | `pending` | `PENDING` | `ACTIVE` | - | `PENDING` |
| **paid** | `capture`, `settlement` | `SUCCEEDED` | `COMPLETED` | (webhook fired) | `SUCCESS` |
| **failed** | `deny` | `FAILED` | - | - | `FAILED` |
| **expired** | `expire` | - | `INACTIVE` | - | `EXPIRED` |
| **cancelled** | `cancel` | `VOIDED` | - | - | `CANCELLED` |
| **refunded** | `refund`, `partial_refund` | `REFUNDED` | - | - | `REFUNDED` |

---

## Unified Status Mapper

```typescript
// utils/status-mapper.ts

import { PaymentStatus } from '../types/payment';

export class StatusMapper {
  static fromMidtrans(status: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      'capture': PaymentStatus.PAID,
      'settlement': PaymentStatus.PAID,
      'pending': PaymentStatus.PENDING,
      'deny': PaymentStatus.FAILED,
      'cancel': PaymentStatus.CANCELLED,
      'expire': PaymentStatus.EXPIRED,
      'refund': PaymentStatus.REFUNDED,
      'partial_refund': PaymentStatus.REFUNDED,
      'authorize': PaymentStatus.PENDING,
    };
    
    const normalized = mapping[status.toLowerCase()];
    
    if (!normalized) {
      console.warn(`Unknown Midtrans status: ${status}`);
      return PaymentStatus.PENDING;
    }
    
    return normalized;
  }
  
  static fromXendit(
    status: string,
    method: 'ewallet' | 'qris' | 'va'
  ): PaymentStatus {
    if (method === 'va') {
      return PaymentStatus.PAID;
    }
    
    const mapping: Record<string, PaymentStatus> = {
      'PENDING': PaymentStatus.PENDING,
      'SUCCEEDED': PaymentStatus.PAID,
      'COMPLETED': PaymentStatus.PAID,
      'FAILED': PaymentStatus.FAILED,
      'VOIDED': PaymentStatus.CANCELLED,
      'REFUNDED': PaymentStatus.REFUNDED,
      'ACTIVE': PaymentStatus.PENDING,
      'INACTIVE': PaymentStatus.EXPIRED,
    };
    
    const normalized = mapping[status.toUpperCase()];
    
    if (!normalized) {
      console.warn(`Unknown Xendit status: ${status}`);
      return PaymentStatus.PENDING;
    }
    
    return normalized;
  }
  
  static fromDoku(status: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      'SUCCESS': PaymentStatus.PAID,
      'PENDING': PaymentStatus.PENDING,
      'FAILED': PaymentStatus.FAILED,
      'EXPIRED': PaymentStatus.EXPIRED,
      'CANCELLED': PaymentStatus.CANCELLED,
      'REFUNDED': PaymentStatus.REFUNDED,
    };
    
    const normalized = mapping[status.toUpperCase()];
    
    if (!normalized) {
      console.warn(`Unknown Doku status: ${status}`);
      return PaymentStatus.PENDING;
    }
    
    return normalized;
  }
}
```

---

## Testing Status Mapping

```typescript
// tests/status-mapper.test.ts

import { StatusMapper } from '../utils/status-mapper';
import { PaymentStatus } from '../types/payment';

describe('StatusMapper', () => {
  describe('Midtrans', () => {
    it('maps settlement to paid', () => {
      expect(StatusMapper.fromMidtrans('settlement'))
        .toBe(PaymentStatus.PAID);
    });
    
    it('maps capture to paid', () => {
      expect(StatusMapper.fromMidtrans('capture'))
        .toBe(PaymentStatus.PAID);
    });
    
    it('maps expire to expired', () => {
      expect(StatusMapper.fromMidtrans('expire'))
        .toBe(PaymentStatus.EXPIRED);
    });
    
    it('handles unknown status', () => {
      expect(StatusMapper.fromMidtrans('unknown'))
        .toBe(PaymentStatus.PENDING);
    });
  });
  
  describe('Xendit', () => {
    it('maps SUCCEEDED to paid for e-wallet', () => {
      expect(StatusMapper.fromXendit('SUCCEEDED', 'ewallet'))
        .toBe(PaymentStatus.PAID);
    });
    
    it('maps COMPLETED to paid for QRIS', () => {
      expect(StatusMapper.fromXendit('COMPLETED', 'qris'))
        .toBe(PaymentStatus.PAID);
    });
    
    it('always returns paid for VA', () => {
      expect(StatusMapper.fromXendit('anything', 'va'))
        .toBe(PaymentStatus.PAID);
    });
  });
  
  describe('Doku', () => {
    it('maps SUCCESS to paid', () => {
      expect(StatusMapper.fromDoku('SUCCESS'))
        .toBe(PaymentStatus.PAID);
    });
    
    it('handles lowercase input', () => {
      expect(StatusMapper.fromDoku('success'))
        .toBe(PaymentStatus.PAID);
    });
  });
});
```

---

## Business Logic Guidelines

### 1. Only `paid` Status Triggers Fulfillment

```typescript
async function handleWebhook(payload: WebhookPayload) {
  await updatePaymentStatus(payload.orderId, payload.status);
  
  if (payload.status === PaymentStatus.PAID) {
    await fulfillOrder(payload.orderId);
    await sendConfirmationEmail(payload.orderId);
  }
}
```

### 2. Handle Expired Gracefully

```typescript
if (payload.status === PaymentStatus.EXPIRED) {
  await notifyCustomer(payload.orderId, 'expired');
  await releaseStockReservation(payload.orderId);
}
```

### 3. Refund Handling

```typescript
if (payload.status === PaymentStatus.REFUNDED) {
  await reverseOrderFulfillment(payload.orderId);
  await restoreStock(payload.orderId);
  await notifyCustomer(payload.orderId, 'refunded');
}
```

### 4. Status Transition Validation

```typescript
const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [
    PaymentStatus.PAID,
    PaymentStatus.EXPIRED,
    PaymentStatus.CANCELLED,
    PaymentStatus.FAILED,
  ],
  [PaymentStatus.PAID]: [
    PaymentStatus.REFUNDED,
  ],
  [PaymentStatus.EXPIRED]: [],  // Terminal state
  [PaymentStatus.CANCELLED]: [],  // Terminal state
  [PaymentStatus.FAILED]: [],  // Terminal state
  [PaymentStatus.REFUNDED]: [],  // Terminal state
};

function isValidTransition(
  currentStatus: PaymentStatus,
  newStatus: PaymentStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}

// Usage in webhook handler
if (!isValidTransition(payment.status, newStatus)) {
  console.warn(
    `Invalid status transition: ${payment.status} -> ${newStatus} for order ${orderId}`
  );
  return;
}
```

---

## Monitoring & Alerts

```typescript
// Track status distribution
metrics.increment('payment.status', {
  provider: 'midtrans',
  status: normalizedStatus,
  method: 'qris',
});

// Alert on high failure rate
const failureRate = await getFailureRate('last_1h');
if (failureRate > 0.05) {  // > 5%
  await sendAlert('High payment failure rate', { rate: failureRate });
}

// Alert on status mapping failures
if (!normalized) {
  await sendAlert('Unknown payment status', {
    provider: 'midtrans',
    status: rawStatus,
    orderId: payload.orderId,
  });
}
```

---

## Common Pitfalls

### ❌ String Comparison Case Sensitivity

```typescript
// Wrong
if (status === 'PAID') { ... }  // Won't match PaymentStatus.PAID = 'paid'

// Right
if (status === PaymentStatus.PAID) { ... }
// Or
if (status.toLowerCase() === 'paid') { ... }
```

### ❌ Assuming Linear Status Flow

```typescript
// Wrong assumption
// pending -> paid -> refunded (linear)

// Reality
// pending -> expired (no payment)
// pending -> cancelled (user cancel)
// pending -> failed (processing error)
// paid -> refunded (customer request)
```

### ❌ Not Handling Unknown Statuses

```typescript
// Wrong
const mapping = { 'settlement': 'paid' };
return mapping[status];  // undefined for unknown status!

// Right
return mapping[status] || PaymentStatus.PENDING;  // Default fallback
```

---

## Quick Reference Cheat Sheet

```
PAID STATUSES:
Midtrans: settlement, capture
Xendit: SUCCEEDED, COMPLETED
Doku: SUCCESS

PENDING STATUSES:
Midtrans: pending
Xendit: PENDING, ACTIVE
Doku: PENDING

FAILED STATUSES:
Midtrans: deny
Xendit: FAILED
Doku: FAILED

EXPIRED STATUSES:
Midtrans: expire
Xendit: INACTIVE
Doku: EXPIRED

CANCELLED STATUSES:
Midtrans: cancel
Xendit: VOIDED
Doku: CANCELLED

REFUNDED STATUSES:
Midtrans: refund, partial_refund
Xendit: REFUNDED
Doku: REFUNDED
```
