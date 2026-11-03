# Payment Gateway Indonesia - Complete Examples

Full implementation untuk ketiga provider: Midtrans, Xendit, dan Doku.

---

## Example 1: Midtrans Adapter (Complete)

```typescript
// adapters/midtrans.adapter.ts

import crypto from 'crypto';
import axios from 'axios';
import { 
  PaymentGateway, 
  PaymentRequest, 
  PaymentResponse, 
  WebhookPayload, 
  PaymentStatus,
  PaymentMethod 
} from '../types/payment';

export class MidtransAdapter implements PaymentGateway {
  private serverKey: string;
  private clientKey: string;
  private isProduction: boolean;
  
  constructor(config: { 
    serverKey: string; 
    clientKey: string; 
    isProduction?: boolean;
  }) {
    this.serverKey = config.serverKey;
    this.clientKey = config.clientKey;
    this.isProduction = config.isProduction || false;
  }
  
  private get baseUrl() {
    return this.isProduction 
      ? 'https://api.midtrans.com'
      : 'https://api.sandbox.midtrans.com';
  }
  
  private get snapUrl() {
    return this.isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
  }
  
  private getAuthHeader() {
    const auth = Buffer.from(this.serverKey + ':').toString('base64');
    return `Basic ${auth}`;
  }
  
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const payload = this.buildMidtransPayload(request);
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/charge`,
        payload,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': this.getAuthHeader(),
          },
        }
      );
      
      return this.mapToPaymentResponse(response.data, request);
    } catch (error: any) {
      throw new Error(
        `Midtrans payment creation failed: ${error.response?.data?.status_message || error.message}`
      );
    }
  }
  
  private buildMidtransPayload(request: PaymentRequest) {
    const basePayload = {
      transaction_details: {
        order_id: request.orderId,
        gross_amount: request.amount,
      },
      customer_details: {
        first_name: request.customerName,
        email: request.customerEmail,
        phone: request.customerPhone,
      },
    };
    
    // Payment method specific
    switch (request.method) {
      case 'qris':
        return {
          ...basePayload,
          payment_type: 'qris',
          qris: {
            acquirer: 'gopay', // or 'airpay'
          },
        };
      
      case 'va_bca':
      case 'va_bni':
      case 'va_mandiri':
        const bank = request.method.replace('va_', '');
        return {
          ...basePayload,
          payment_type: 'bank_transfer',
          bank_transfer: {
            bank: bank,
          },
        };
      
      case 'gopay':
        return {
          ...basePayload,
          payment_type: 'gopay',
          gopay: {
            enable_callback: true,
            callback_url: process.env.APP_URL + '/payment/callback',
          },
        };
      
      default:
        throw new Error(`Unsupported payment method: ${request.method}`);
    }
  }
  
  private mapToPaymentResponse(
    data: any, 
    request: PaymentRequest
  ): PaymentResponse {
    const response: PaymentResponse = {
      transactionId: data.transaction_id,
      orderId: data.order_id,
      status: this.normalizeStatus(data.transaction_status),
      method: request.method,
      amount: request.amount,
      expiresAt: new Date(data.expiry_time),
      createdAt: new Date(data.transaction_time),
    };
    
    // Method-specific fields
    if (request.method === 'qris') {
      response.qrCode = data.actions?.find((a: any) => a.name === 'generate-qr-code')?.url;
    } else if (request.method.startsWith('va_')) {
      response.vaNumber = data.va_numbers?.[0]?.va_number;
      response.bankCode = data.va_numbers?.[0]?.bank;
    } else if (request.method === 'gopay') {
      response.paymentUrl = data.actions?.find((a: any) => a.name === 'deeplink-redirect')?.url;
    }
    
    return response;
  }
  
  verifyWebhook(rawBody: string, signature: string): boolean {
    try {
      const body = JSON.parse(rawBody);
      const hash = crypto
        .createHash('sha512')
        .update(`${body.order_id}${body.status_code}${body.gross_amount}${this.serverKey}`)
        .digest('hex');
      
      return hash === signature;
    } catch (error) {
      return false;
    }
  }
  
  parseWebhook(body: unknown): WebhookPayload {
    const data = body as any;
    
    return {
      transactionId: data.transaction_id,
      orderId: data.order_id,
      status: this.normalizeStatus(data.transaction_status),
      amount: parseFloat(data.gross_amount),
      paidAt: data.settlement_time ? new Date(data.settlement_time) : undefined,
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
      'partial_refund': 'refunded',
    };
    
    return mapping[status] || 'pending';
  }
  
  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/${transactionId}/status`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
          },
        }
      );
      
      return {
        transactionId: response.data.transaction_id,
        orderId: response.data.order_id,
        status: this.normalizeStatus(response.data.transaction_status),
        method: 'qris', // You'd need to store this
        amount: parseFloat(response.data.gross_amount),
        expiresAt: new Date(response.data.expiry_time),
        createdAt: new Date(response.data.transaction_time),
      };
    } catch (error: any) {
      throw new Error(
        `Midtrans status check failed: ${error.response?.data?.status_message || error.message}`
      );
    }
  }
  
  async cancelPayment(transactionId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/v2/${transactionId}/cancel`,
        {},
        {
          headers: {
            'Authorization': this.getAuthHeader(),
          },
        }
      );
    } catch (error: any) {
      throw new Error(
        `Midtrans cancellation failed: ${error.response?.data?.status_message || error.message}`
      );
    }
  }
}
```

---

## Example 2: Xendit Adapter (Complete)

```typescript
// adapters/xendit.adapter.ts

import crypto from 'crypto';
import axios from 'axios';
import { 
  PaymentGateway, 
  PaymentRequest, 
  PaymentResponse, 
  WebhookPayload, 
  PaymentStatus 
} from '../types/payment';

export class XenditAdapter implements PaymentGateway {
  private apiKey: string;
  private webhookToken: string;
  private isProduction: boolean;
  
  constructor(config: { 
    apiKey: string; 
    webhookToken: string;
    isProduction?: boolean;
  }) {
    this.apiKey = config.apiKey;
    this.webhookToken = config.webhookToken;
    this.isProduction = config.isProduction || false;
  }
  
  private get baseUrl() {
    return 'https://api.xendit.co';
  }
  
  private getAuthHeader() {
    return `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`;
  }
  
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      switch (request.method) {
        case 'qris':
          return await this.createQRIS(request);
        case 'va_bca':
        case 'va_bni':
        case 'va_mandiri':
          return await this.createVirtualAccount(request);
        case 'gopay':
        case 'ovo':
        case 'dana':
        case 'shopeepay':
          return await this.createEWallet(request);
        default:
          throw new Error(`Unsupported payment method: ${request.method}`);
      }
    } catch (error: any) {
      throw new Error(
        `Xendit payment creation failed: ${error.response?.data?.message || error.message}`
      );
    }
  }
  
  private async createQRIS(request: PaymentRequest): Promise<PaymentResponse> {
    const response = await axios.post(
      `${this.baseUrl}/qr_codes`,
      {
        external_id: request.orderId,
        type: 'DYNAMIC',
        callback_url: process.env.APP_URL + '/webhook/xendit',
        amount: request.amount,
      },
      {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );
    
    return {
      transactionId: response.data.id,
      orderId: request.orderId,
      status: 'pending',
      method: 'qris',
      amount: request.amount,
      qrCode: response.data.qr_string,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date(),
    };
  }
  
  private async createVirtualAccount(request: PaymentRequest): Promise<PaymentResponse> {
    const bankCodeMap = {
      'va_bca': 'BCA',
      'va_bni': 'BNI',
      'va_mandiri': 'MANDIRI',
    };
    
    const response = await axios.post(
      `${this.baseUrl}/callback_virtual_accounts`,
      {
        external_id: request.orderId,
        bank_code: bankCodeMap[request.method as keyof typeof bankCodeMap],
        name: request.customerName,
        expected_amount: request.amount,
        is_closed: true,
        expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );
    
    return {
      transactionId: response.data.id,
      orderId: request.orderId,
      status: 'pending',
      method: request.method,
      amount: request.amount,
      vaNumber: response.data.account_number,
      bankCode: response.data.bank_code,
      expiresAt: new Date(response.data.expiration_date),
      createdAt: new Date(),
    };
  }
  
  private async createEWallet(request: PaymentRequest): Promise<PaymentResponse> {
    const channelCodeMap = {
      'gopay': 'ID_GOPAY',
      'ovo': 'ID_OVO',
      'dana': 'ID_DANA',
      'shopeepay': 'ID_SHOPEEPAY',
    };
    
    const response = await axios.post(
      `${this.baseUrl}/ewallets/charges`,
      {
        reference_id: request.orderId,
        currency: 'IDR',
        amount: request.amount,
        checkout_method: 'ONE_TIME_PAYMENT',
        channel_code: channelCodeMap[request.method as keyof typeof channelCodeMap],
        channel_properties: {
          success_redirect_url: process.env.APP_URL + '/payment/success',
          failure_redirect_url: process.env.APP_URL + '/payment/failed',
          mobile_number: request.customerPhone,
        },
      },
      {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );
    
    return {
      transactionId: response.data.id,
      orderId: request.orderId,
      status: 'pending',
      method: request.method,
      amount: request.amount,
      paymentUrl: response.data.actions?.desktop_web_checkout_url || response.data.actions?.mobile_web_checkout_url,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      createdAt: new Date(),
    };
  }
  
  verifyWebhook(rawBody: string, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha256', this.webhookToken)
        .update(rawBody)
        .digest('hex');
      
      return hash === signature;
    } catch (error) {
      return false;
    }
  }
  
  parseWebhook(body: unknown): WebhookPayload {
    const data = body as any;
    
    // Xendit has different webhook formats per payment method
    if (data.event) {
      // E-wallet webhook
      return {
        transactionId: data.data.id,
        orderId: data.data.reference_id,
        status: this.normalizeStatus(data.data.status),
        amount: data.data.charge_amount,
        paidAt: data.data.status === 'SUCCEEDED' ? new Date() : undefined,
        raw: data,
      };
    } else if (data.callback_virtual_account_id) {
      // VA webhook
      return {
        transactionId: data.callback_virtual_account_id,
        orderId: data.external_id,
        status: 'paid',
        amount: data.amount,
        paidAt: new Date(data.payment_date),
        raw: data,
      };
    } else if (data.id && data.qr_string) {
      // QR Code webhook
      return {
        transactionId: data.id,
        orderId: data.external_id,
        status: this.normalizeStatus(data.status),
        amount: data.amount,
        paidAt: data.status === 'COMPLETED' ? new Date() : undefined,
        raw: data,
      };
    }
    
    throw new Error('Unknown Xendit webhook format');
  }
  
  private normalizeStatus(status: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      'SUCCEEDED': 'paid',
      'COMPLETED': 'paid',
      'PENDING': 'pending',
      'FAILED': 'failed',
      'EXPIRED': 'expired',
      'VOIDED': 'cancelled',
      'REFUNDED': 'refunded',
    };
    
    return mapping[status] || 'pending';
  }
  
  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    // Implementation depends on payment method
    // You'd need to store the payment method type
    throw new Error('Not implemented - Xendit requires payment method context');
  }
}
```

---

## Example 3: Doku Adapter (Skeleton)

```typescript
// adapters/doku.adapter.ts

import crypto from 'crypto';
import axios from 'axios';
import { 
  PaymentGateway, 
  PaymentRequest, 
  PaymentResponse, 
  WebhookPayload, 
  PaymentStatus 
} from '../types/payment';

export class DokuAdapter implements PaymentGateway {
  private clientId: string;
  private sharedKey: string;
  private isProduction: boolean;
  
  constructor(config: { 
    clientId: string; 
    sharedKey: string;
    isProduction?: boolean;
  }) {
    this.clientId = config.clientId;
    this.sharedKey = config.sharedKey;
    this.isProduction = config.isProduction || false;
  }
  
  private get baseUrl() {
    return this.isProduction
      ? 'https://api.doku.com'
      : 'https://api-sandbox.doku.com';
  }
  
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Doku implementation
    // See Doku documentation for V2 API
    throw new Error('Doku adapter not fully implemented');
  }
  
  verifyWebhook(rawBody: string, signature: string): boolean {
    try {
      // Doku: SHA256(amount + sharedKey + invoice)
      const body = JSON.parse(rawBody);
      const hash = crypto
        .createHash('sha256')
        .update(`${body.amount}${this.sharedKey}${body.invoice}`)
        .digest('hex');
      
      return hash === signature;
    } catch (error) {
      return false;
    }
  }
  
  parseWebhook(body: unknown): WebhookPayload {
    const data = body as any;
    
    return {
      transactionId: data.transactionId,
      orderId: data.invoice,
      status: this.normalizeStatus(data.status),
      amount: parseFloat(data.amount),
      paidAt: data.paymentTime ? new Date(data.paymentTime) : undefined,
      raw: data,
    };
  }
  
  private normalizeStatus(status: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      'SUCCESS': 'paid',
      'PENDING': 'pending',
      'FAILED': 'failed',
      'EXPIRED': 'expired',
      'CANCELLED': 'cancelled',
    };
    
    return mapping[status] || 'pending';
  }
  
  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    throw new Error('Not implemented');
  }
}
```

---

## Example 4: Usage in Application

```typescript
// services/payment.service.ts

import { PaymentGatewayFactory } from '../payment-gateway.factory';
import { PaymentRequest } from '../types/payment';

export class PaymentService {
  static async createPayment(request: PaymentRequest) {
    // Get provider from config or database
    const provider = process.env.PAYMENT_PROVIDER as 'midtrans' | 'xendit' | 'doku';
    const gateway = PaymentGatewayFactory.create(provider);
    
    // Create payment
    const payment = await gateway.createPayment(request);
    
    // Store in database
    await db.payment.create({
      data: {
        orderId: payment.orderId,
        transactionId: payment.transactionId,
        provider: provider,
        method: payment.method,
        amount: payment.amount,
        status: payment.status,
        paymentUrl: payment.paymentUrl,
        qrCode: payment.qrCode,
        vaNumber: payment.vaNumber,
        bankCode: payment.bankCode,
        expiresAt: payment.expiresAt,
      },
    });
    
    return payment;
  }
  
  static async getByOrderId(orderId: string) {
    return db.payment.findUnique({ where: { orderId } });
  }
  
  static async updateStatus(data: {
    orderId: string;
    status: string;
    transactionId: string;
    paidAt?: Date;
  }) {
    return db.payment.update({
      where: { orderId: data.orderId },
      data: {
        status: data.status,
        transactionId: data.transactionId,
        paidAt: data.paidAt,
        updatedAt: new Date(),
      },
    });
  }
}
```

---

## Example 5: E-commerce Checkout Flow

```typescript
// routes/checkout.ts

import express from 'express';
import { PaymentService } from '../services/payment.service';
import { OrderService } from '../services/order.service';

const router = express.Router();

router.post('/checkout', async (req, res) => {
  try {
    // 1. Create order
    const order = await OrderService.create({
      customerId: req.user.id,
      items: req.body.items,
      shippingAddress: req.body.shippingAddress,
    });
    
    // 2. Create payment
    const payment = await PaymentService.createPayment({
      orderId: order.id,
      amount: order.total,
      method: req.body.paymentMethod, // 'qris', 'va_bca', 'gopay', etc
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
      description: `Order #${order.id}`,
      expiryMinutes: 60,
    });
    
    // 3. Return payment details
    res.json({
      orderId: order.id,
      payment: {
        transactionId: payment.transactionId,
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
        
        // Method-specific fields
        ...(payment.paymentUrl && { paymentUrl: payment.paymentUrl }),
        ...(payment.qrCode && { qrCode: payment.qrCode }),
        ...(payment.vaNumber && { 
          vaNumber: payment.vaNumber,
          bankCode: payment.bankCode,
        }),
        
        expiresAt: payment.expiresAt,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

export default router;
```

---

## Example 6: Testing Helper

```typescript
// tests/helpers/webhook-simulator.ts

import crypto from 'crypto';

export class WebhookSimulator {
  static midtrans(payload: {
    orderId: string;
    transactionId: string;
    amount: number;
    status: string;
  }, serverKey: string) {
    const signature = crypto
      .createHash('sha512')
      .update(`${payload.orderId}200${payload.amount}${serverKey}`)
      .digest('hex');
    
    return {
      body: {
        transaction_id: payload.transactionId,
        order_id: payload.orderId,
        gross_amount: payload.amount.toString(),
        transaction_status: payload.status,
        status_code: '200',
        transaction_time: new Date().toISOString(),
      },
      signature,
    };
  }
  
  static xendit(payload: {
    orderId: string;
    transactionId: string;
    amount: number;
    status: string;
  }, webhookToken: string) {
    const body = {
      event: 'ewallet.charge.completed',
      data: {
        id: payload.transactionId,
        reference_id: payload.orderId,
        charge_amount: payload.amount,
        status: payload.status,
      },
    };
    
    const signature = crypto
      .createHmac('sha256', webhookToken)
      .update(JSON.stringify(body))
      .digest('hex');
    
    return { body, signature };
  }
}
```

---

## Key Takeaways

1. **Unified interface** membuat switching provider mudah
2. **Signature verification** adalah security layer pertama
3. **Status normalization** simplify business logic
4. **Idempotency** prevent duplicate processing
5. **Testing helpers** accelerate development
