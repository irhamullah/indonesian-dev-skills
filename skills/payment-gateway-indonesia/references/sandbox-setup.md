# Sandbox Setup Guide

Complete guide untuk setup sandbox testing environment untuk ketiga provider.

---

## Why Sandbox Testing?

- ✅ Test integration tanpa charge real money
- ✅ Simulate berbagai payment scenarios (success, failed, expired)
- ✅ Test webhook handling
- ✅ Debug signature verification
- ✅ Verify status mapping logic

**NEVER test dengan production credentials!**

---

## Midtrans Sandbox

### 1. Get Sandbox Credentials

1. Sign up di https://dashboard.sandbox.midtrans.com/
2. Login ke dashboard
3. Navigate to **Settings → Access Keys**
4. Copy:
   - **Server Key** (starts with `SB-Mid-server-`)
   - **Client Key** (starts with `SB-Mid-client-`)

### 2. Environment Variables

```bash
# .env
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
```

### 3. Sandbox Endpoints

```
API Base URL: https://api.sandbox.midtrans.com
Snap URL: https://app.sandbox.midtrans.com/snap/v1/transactions
```

### 4. Test Credentials

#### Virtual Account

Test VA numbers yang otomatis sukses:

```
BCA: Any VA number
BNI: Any VA number
Mandiri: Any VA number (use bill key + biller code)
```

Simulate payment di dashboard: **Transactions → Find transaction → Actions → "Pay"**

#### QRIS

Simulate payment di dashboard setelah create QR code.

#### GoPay / E-Wallet

Test phone numbers:

```
Success: +62812345678xx (xx = any 2 digits)
Failed: +628111111111
```

#### Credit Card

```
Success:
Card Number: 4811 1111 1111 1114
CVV: 123
Expiry: Any future date
OTP: 112233

Failed:
Card Number: 4911 1111 1111 1113
```

### 5. Testing Webhook

**Option A: Simulate dari Dashboard**

1. Go to **Transactions**
2. Find your transaction
3. Click **Actions → Set transaction status**
4. Select status (settlement, expire, etc.)
5. Webhook akan otomatis dikirim ke callback URL

**Option B: Local Testing dengan ngrok**

```bash
# Install ngrok
brew install ngrok  # Mac
# or download from https://ngrok.com

# Start your app
npm run dev  # Running on localhost:3000

# Expose with ngrok
ngrok http 3000

# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Set di Midtrans Dashboard:
# Settings → Configuration → Notification URL:
# https://abc123.ngrok.io/webhook/midtrans
```

### 6. Midtrans Sandbox Limitations

- ⚠️ Sandbox tidak support semua payment methods yang ada di production
- ⚠️ Settlement time instant (tidak realistic untuk testing settlement delay)
- ⚠️ Fraud detection disabled

---

## Xendit Sandbox

### 1. Get Sandbox Credentials

1. Sign up di https://dashboard.xendit.co/register
2. Login to dashboard
3. Toggle **"Test Mode"** (top right)
4. Navigate to **Settings → Developers → API Keys**
5. Copy **Secret API Key** (starts with `xnd_development_`)
6. Generate **Webhook Verification Token**:
   - Settings → Developers → Callbacks
   - Click "Generate verification token"

### 2. Environment Variables

```bash
# .env
XENDIT_API_KEY=xnd_development_xxxxxxxxxx
XENDIT_WEBHOOK_TOKEN=your_webhook_verification_token
XENDIT_IS_PRODUCTION=false
```

### 3. Sandbox Endpoints

```
API Base URL: https://api.xendit.co
(Same endpoint, authentication key determines sandbox/production)
```

### 4. Test Scenarios

#### QRIS

```typescript
// Create QRIS
POST /qr_codes
{
  "external_id": "test-order-123",
  "type": "DYNAMIC",
  "amount": 10000
}

// Simulate payment via dashboard:
// Test Mode → QR Codes → Find QR → Click "Simulate Payment"
```

#### Virtual Account

```typescript
// Create VA
POST /callback_virtual_accounts
{
  "external_id": "test-order-123",
  "bank_code": "BCA",
  "name": "Test User",
  "expected_amount": 10000
}

// Simulate payment via dashboard:
// Test Mode → Virtual Accounts → Find VA → Click "Simulate Payment"
```

#### E-Wallet (GoPay, OVO, DANA, ShopeePay)

```typescript
// Create e-wallet charge
POST /ewallets/charges
{
  "reference_id": "test-order-123",
  "currency": "IDR",
  "amount": 10000,
  "checkout_method": "ONE_TIME_PAYMENT",
  "channel_code": "ID_GOPAY",
  "channel_properties": {
    "success_redirect_url": "https://example.com/success"
  }
}

// Simulate payment via dashboard:
// Test Mode → E-Wallet Charges → Find charge → Click "Simulate Success/Failed"
```

### 5. Testing Webhook

**Set Webhook URL:**

1. Dashboard → Settings → Developers → Callbacks
2. Add webhook URL: `https://your-domain.com/webhook/xendit`
3. Select events to listen:
   - ✅ Virtual Account Paid
   - ✅ E-Wallet Charge Status
   - ✅ QR Code Paid

**Test with ngrok:**

```bash
ngrok http 3000
# Set webhook URL: https://abc123.ngrok.io/webhook/xendit
```

**Manual Webhook Testing:**

Xendit provides webhook simulator di dashboard. You can send test webhooks manually.

### 6. Xendit Test Data

```
Test phone numbers (e-wallet):
+628123456789xx (any xx)

Test amounts:
10000 - 10000000 (IDR)

Expiry time:
Default 24 hours for VA/QRIS
Default 1 hour for e-wallet
```

### 7. Xendit Sandbox Limitations

- ⚠️ No actual money movement
- ⚠️ Some banks might have limited simulation features
- ⚠️ Real-time callbacks might be delayed (use manual simulation)

---

## Doku Sandbox

### 1. Get Sandbox Credentials

1. Contact Doku sales/support untuk sandbox access
2. Request:
   - **Client ID**
   - **Shared Key**
   - **Sandbox API documentation**

⚠️ Doku sandbox access biasanya memerlukan approval (tidak instant signup seperti Midtrans/Xendit)

### 2. Environment Variables

```bash
# .env
DOKU_CLIENT_ID=your_client_id
DOKU_SHARED_KEY=your_shared_key
DOKU_IS_PRODUCTION=false
```

### 3. Sandbox Endpoints

```
API Base URL: https://api-sandbox.doku.com
```

### 4. Test Scenarios

(Dokumentasi Doku kurang comprehensive dibanding Midtrans/Xendit. Refer ke official documentation yang diberikan saat signup.)

### 5. Doku Sandbox Limitations

- ⚠️ Requires manual approval untuk sandbox access
- ⚠️ Documentation quality varies
- ⚠️ Limited self-service testing tools

---

## Local Development Setup

### Full Stack Example

```bash
# 1. Install dependencies
npm install express axios dotenv

# 2. Setup .env
cat > .env << EOF
# App
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Midtrans
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx

# Xendit
XENDIT_API_KEY=xnd_development_xxx
XENDIT_WEBHOOK_TOKEN=xxx

# Doku
DOKU_CLIENT_ID=xxx
DOKU_SHARED_KEY=xxx

# Payment Provider (midtrans | xendit | doku)
PAYMENT_PROVIDER=midtrans
EOF

# 3. Start app
npm run dev

# 4. Expose with ngrok (separate terminal)
ngrok http 3000

# 5. Set webhook URL di provider dashboard
# Midtrans: https://xxx.ngrok.io/webhook/midtrans
# Xendit: https://xxx.ngrok.io/webhook/xendit
# Doku: https://xxx.ngrok.io/webhook/doku
```

---

## Testing Checklist

### Payment Creation

- [ ] QRIS creation successful
- [ ] VA creation successful (BCA, BNI, Mandiri)
- [ ] E-wallet charge creation successful (GoPay, OVO, DANA)
- [ ] Response contains required fields (transactionId, paymentUrl/qrCode/vaNumber)
- [ ] Error handling untuk invalid input
- [ ] Expiry time set correctly

### Webhook Handling

- [ ] Webhook signature verification passes
- [ ] Invalid signature rejected (401)
- [ ] Status parsed correctly
- [ ] Status normalized correctly
- [ ] Idempotency check works (duplicate webhook handled)
- [ ] Payment status updated in database
- [ ] Post-payment actions triggered (order fulfillment, email)

### Status Scenarios

Test semua status transitions:

- [ ] pending → paid
- [ ] pending → expired
- [ ] pending → cancelled
- [ ] pending → failed
- [ ] paid → refunded

### Edge Cases

- [ ] Webhook received before payment record created (race condition)
- [ ] Webhook received multiple times (idempotency)
- [ ] Invalid/unknown status codes handled
- [ ] Network failures during payment creation
- [ ] Timeout during API calls

---

## Testing Tools

### Postman Collection

```json
{
  "info": {
    "name": "Payment Gateway Indonesia Tests"
  },
  "item": [
    {
      "name": "Create QRIS Payment",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/payments",
        "body": {
          "orderId": "TEST-{{$randomInt}}",
          "amount": 10000,
          "method": "qris",
          "customerName": "Test User",
          "customerEmail": "test@example.com",
          "customerPhone": "+628123456789"
        }
      }
    },
    {
      "name": "Simulate Midtrans Webhook",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/webhook/midtrans",
        "body": {
          "order_id": "TEST-123",
          "transaction_id": "TXN-123",
          "status_code": "200",
          "gross_amount": "10000.00",
          "transaction_status": "settlement"
        }
      }
    }
  ]
}
```

### cURL Commands

```bash
# Test payment creation
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-123",
    "amount": 10000,
    "method": "qris",
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "customerPhone": "+628123456789"
  }'

# Test webhook (Midtrans)
curl -X POST http://localhost:3000/webhook/midtrans \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TEST-123",
    "transaction_id": "TXN-123",
    "status_code": "200",
    "gross_amount": "10000.00",
    "transaction_status": "settlement",
    "signature_key": "calculated_signature_here"
  }'
```

### Automated Test Script

```typescript
// tests/e2e/payment-flow.test.ts

describe('Payment Flow E2E', () => {
  it('complete QRIS payment flow', async () => {
    // 1. Create payment
    const payment = await createPayment({
      orderId: 'TEST-E2E-123',
      amount: 10000,
      method: 'qris',
    });
    
    expect(payment.status).toBe('pending');
    expect(payment.qrCode).toBeDefined();
    
    // 2. Simulate webhook
    const webhook = simulateWebhook({
      orderId: payment.orderId,
      status: 'settlement',
    });
    
    await sendWebhook(webhook);
    
    // 3. Verify payment updated
    const updated = await getPayment(payment.orderId);
    expect(updated.status).toBe('paid');
    
    // 4. Verify order fulfilled
    const order = await getOrder(payment.orderId);
    expect(order.status).toBe('processing');
  });
});
```

---

## Debugging Tips

### Enable Debug Logging

```typescript
// Add to your adapter
private log(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${this.constructor.name}] ${message}`, data);
  }
}

// Usage
this.log('Creating payment', request);
this.log('Payment response', response.data);
this.log('Webhook received', payload);
```

### Webhook Inspection Tool

```typescript
// middleware/webhook-inspector.ts
export function inspectWebhook(req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    console.log('=== Webhook Received ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Raw Body:', req.rawBody?.toString());
    console.log('========================');
  }
  next();
}

// Use it
app.post('/webhook/:provider', inspectWebhook, webhookHandler);
```

### Check Provider Status Pages

Kalau ada masalah di sandbox:

- Midtrans: https://status.midtrans.com/
- Xendit: https://status.xendit.co/
- Doku: Check with support

---

## Common Sandbox Issues

### Issue 1: Webhook Not Received

**Checklist:**
- [ ] Webhook URL set correctly di dashboard
- [ ] URL accessible dari internet (use ngrok for local)
- [ ] Endpoint returns 200 OK
- [ ] No firewall blocking incoming requests

### Issue 2: Signature Verification Failed

**Checklist:**
- [ ] Using correct key (sandbox key, not production)
- [ ] Correct signature algorithm
- [ ] Raw body used for HMAC (Xendit)
- [ ] No whitespace issues in signature string

### Issue 3: Payment Not Simulating

**Checklist:**
- [ ] Correct test credentials used
- [ ] Transaction exists in dashboard
- [ ] Using dashboard simulation tool correctly
- [ ] Checking correct environment (test mode toggle)

---

## Production Readiness Checklist

Before switching to production:

- [ ] Replace sandbox credentials with production credentials
- [ ] Update `IS_PRODUCTION` flag to `true`
- [ ] Update webhook URLs to production domain
- [ ] Test with small real transaction first
- [ ] Enable monitoring & alerts
- [ ] Document rollback procedure
- [ ] Train support team on handling payment issues

---

## Quick Reference

| Provider | Signup | Dashboard | Test Mode Toggle | Webhook Simulator |
|----------|--------|-----------|------------------|-------------------|
| **Midtrans** | [Instant](https://dashboard.sandbox.midtrans.com/) | dashboard.sandbox.midtrans.com | Separate sandbox URL | ✅ Via dashboard |
| **Xendit** | [Instant](https://dashboard.xendit.co/register) | dashboard.xendit.co | Toggle in dashboard | ✅ Via dashboard |
| **Doku** | Manual approval | merchant.doku.com | Separate sandbox URL | ❌ Manual |
