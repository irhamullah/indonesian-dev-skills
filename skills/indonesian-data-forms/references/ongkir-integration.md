# Ongkir Integration (RajaOngkir & Biteship)

**Pain Point:** Integrasi cek ongkir perlu switch provider, format response beda-beda.

Provider-agnostic ongkir integration dengan abstraction layer.

⚠️ **API provider sering berubah.** Selalu verify endpoint & format dengan docs terbaru sebelum production.

---

## Provider Comparison

| Feature | RajaOngkir | Biteship |
|---------|------------|----------|
| **Type** | Shipping cost aggregator | Full logistics API |
| **Couriers** | JNE, TIKI, POS, J&T, SiCepat, AnterAja, dll | JNE, TIKI, POS, SiCepat, AnterAja, Ninja, dll |
| **Pricing** | Tiered (Starter/Basic/Pro) | Free tier + paid |
| **Tracking** | Pro only | ✅ Available |
| **Create shipment** | ❌ No | ✅ Yes |
| **Rates** | Location-based | Location + postal code |
| **Docs quality** | ⭐⭐⭐ | ⭐⭐⭐⭐ |

**Recommendation:**
- Cuma butuh cek ongkir → RajaOngkir
- Butuh full logistics (create order, tracking) → Biteship

---

## Abstract Interface

```typescript
export interface Destination {
  id: string;
  label: string;       // "Bandung, Jawa Barat"
  province: string;
  city: string;
  district?: string;
  postalCode?: string;
}

export interface ShippingCost {
  courier: string;         // "jne", "jnt", "sicepat"
  service: string;         // "REG", "YES", "OKE"
  description: string;
  cost: number;            // In rupiah (integer)
  etd: string;             // Estimated delivery time
}

export interface ShippingProvider {
  searchDestination(query: string): Promise<Destination[]>;
  getDestinationById(id: string): Promise<Destination>;
  calculateCost(params: {
    originId: string;
    destinationId: string;
    weight: number;        // grams
    couriers?: string[];
  }): Promise<ShippingCost[]>;
}
```

---

## RajaOngkir Implementation

### Setup

```
Plans:
- Starter: Basic couriers, limited
- Basic: More couriers
- Pro: All features + tracking

API Key from: https://rajaongkir.com (dashboard)
```

⚠️ **Endpoint note:** RajaOngkir migrated to a new platform. Verify current base URL:
- Legacy: `https://api.rajaongkir.com/starter/...`
- New platform: check `https://rajaongkir.com` docs → often `https://rajaongkir.komerce.id/api/v1/...`

### Implementation

```typescript
export class RajaOngkirProvider implements ShippingProvider {
  constructor(
    private apiKey: string,
    private baseUrl: string,
    private tier: 'starter' | 'basic' | 'pro' = 'starter'
  ) {}

  async searchDestination(query: string): Promise<Destination[]> {
    // New API: /destination/domestic-destination?search=
    const url = new URL(`${this.baseUrl}/destination/domestic-destination`);
    url.searchParams.set('search', query);
    url.searchParams.set('limit', '10');

    const response = await fetch(url.toString(), {
      headers: { key: this.apiKey },
    });

    if (!response.ok) {
      throw new Error(`RajaOngkir error: ${response.status}`);
    }

    const data = await response.json();
    return this.normalizeDestinations(data);
  }

  async getDestinationById(id: string): Promise<Destination> {
    const results = await this.searchDestination(id);
    const found = results.find(d => d.id === id);
    if (!found) throw new Error('Destination not found');
    return found;
  }

  async calculateCost(params: {
    originId: string;
    destinationId: string;
    weight: number;
    couriers?: string[];
  }): Promise<ShippingCost[]> {
    const couriers = params.couriers || ['jne', 'jnt', 'sicepat', 'anteraja'];

    // New API: POST /calculate/domestic-cost
    const response = await fetch(`${this.baseUrl}/calculate/domestic-cost`, {
      method: 'POST',
      headers: {
        key: this.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        origin: params.originId,
        destination: params.destinationId,
        weight: params.weight.toString(),
        courier: couriers.join(':'),
      }),
    });

    const data = await response.json();
    return this.normalizeCosts(data);
  }

  private normalizeDestinations(data: any): Destination[] {
    const list = data.data || data.rajaongkir?.results || [];
    return list.map((d: any) => ({
      id: d.id || d.city_id,
      label: d.label || `${d.type} ${d.city_name}, ${d.province}`,
      province: d.province || d.province_name,
      city: d.city_name || d.city,
      postalCode: d.postal_code,
    }));
  }

  private normalizeCosts(data: any): ShippingCost[] {
    const results = data.data || data.rajaongkir?.results || [];
    const costs: ShippingCost[] = [];

    for (const courierResult of results) {
      const courier = courierResult.code || courierResult.name;
      const services = courierResult.costs || courierResult.cost || [];

      for (const service of services) {
        const costDetail = service.cost?.[0] || service;
        costs.push({
          courier: courier.toLowerCase(),
          service: service.service || service.code,
          description: service.description || service.service,
          cost: costDetail.value || costDetail.cost?.[0]?.value || 0,
          etd: (costDetail.etd || service.etd || '').toString(),
        });
      }
    }

    return costs.sort((a, b) => a.cost - b.cost);
  }
}
```

---

## Biteship Implementation

### Setup

```
API Key from: https://biteship.com dashboard
Base URL: https://api.biteship.com/v1
Docs: https://biteship.com/id/docs/api
```

### Implementation

```typescript
export class BiteshipProvider implements ShippingProvider {
  private baseUrl = 'https://api.biteship.com/v1';

  constructor(private apiKey: string) {}

  private headers() {
    return {
      Authorization: this.apiKey,  // Biteship uses raw key, not "Bearer"
      'Content-Type': 'application/json',
    };
  }

  async searchDestination(query: string): Promise<Destination[]> {
    const url = new URL(`${this.baseUrl}/maps/areas`);
    url.searchParams.set('input', query);

    const response = await fetch(url.toString(), {
      headers: this.headers(),
    });

    const data = await response.json();
    return (data.areas || []).map((area: any) => ({
      id: area.id,
      label: area.name,
      province: area.administrative_division_level_1_name,
      city: area.administrative_division_level_2_name,
      district: area.administrative_division_level_3_name,
      postalCode: area.postal_code,
    }));
  }

  async getDestinationById(id: string): Promise<Destination> {
    const response = await fetch(`${this.baseUrl}/maps/areas/${id}`, {
      headers: this.headers(),
    });
    const data = await response.json();
    const area = data.area;

    return {
      id: area.id,
      label: area.name,
      province: area.administrative_division_level_1_name,
      city: area.administrative_division_level_2_name,
      district: area.administrative_division_level_3_name,
      postalCode: area.postal_code,
    };
  }

  async calculateCost(params: {
    originId: string;
    destinationId: string;
    weight: number;
    couriers?: string[];
  }): Promise<ShippingCost[]> {
    const response = await fetch(`${this.baseUrl}/rates/calculate`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        origin_area_id: params.originId,
        destination_area_id: params.destinationId,
        couriers: (params.couriers || ['jne', 'jnt', 'sicepat']).join(','),
        items: [{
          name: 'Package',
          weight: params.weight,
          quantity: 1,
        }],
      }),
    });

    const data = await response.json();
    return (data.pricing || []).map((p: any) => ({
      courier: p.courier_code,
      service: p.courier_service_code,
      description: p.courier_service_name,
      cost: p.price,
      etd: p.duration || '',
    }));
  }

  // Biteship-only: create actual shipment
  async createOrder(params: {
    shipperContactName: string;
    shipperContactPhone: string;
    shipperAddress: string;
    shipperAreaId: string;
    originAreaId: string;
    destinationContactName: string;
    destinationContactPhone: string;
    destinationAddress: string;
    destinationAreaId: string;
    courierCompany: string;
    courierType: string;
    items: Array<{ name: string; value: number; quantity: number; weight: number }>;
  }) {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        shipper_contact_name: params.shipperContactName,
        shipper_contact_phone: params.shipperContactPhone,
        shipper_contact_email: 'shipper@example.com',
        shipper_organization: 'My Store',
        origin_contact_name: params.shipperContactName,
        origin_contact_phone: params.shipperContactPhone,
        origin_address: params.shipperAddress,
        origin_area_id: params.originAreaId,
        destination_contact_name: params.destinationContactName,
        destination_contact_phone: params.destinationContactPhone,
        destination_contact_email: 'customer@example.com',
        destination_address: params.destinationAddress,
        destination_area_id: params.destinationAreaId,
        courier_company: params.courierCompany,
        courier_type: params.courierType,
        courier_insurance: 0,
        delivery_type: 'now',
        items: params.items.map(i => ({
          name: i.name,
          value: i.value,
          quantity: i.quantity,
          weight: i.weight,
        })),
      }),
    });

    return response.json();
  }
}
```

---

## Factory + Caching

```typescript
export class ShippingService {
  private provider: ShippingProvider;
  private cache: Map<string, { data: ShippingCost[]; expiry: number }> = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(config: {
    provider: 'rajaongkir' | 'biteship';
    apiKey: string;
    baseUrl?: string;
    tier?: 'starter' | 'basic' | 'pro';
  }) {
    this.provider = config.provider === 'biteship'
      ? new BiteshipProvider(config.apiKey)
      : new RajaOngkirProvider(config.apiKey, config.baseUrl!, config.tier);
  }

  async calculateCost(params: {
    originId: string;
    destinationId: string;
    weight: number;
    couriers?: string[];
  }): Promise<ShippingCost[]> {
    const cacheKey = `${params.originId}:${params.destinationId}:${params.weight}:${params.couriers?.join(',')}`;

    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    const costs = await this.provider.calculateCost(params);

    this.cache.set(cacheKey, {
      data: costs,
      expiry: Date.now() + this.CACHE_TTL,
    });

    return costs;
  }

  searchDestination(query: string) {
    return this.provider.searchDestination(query);
  }
}
```

⚠️ **Cache penting:** RajaOngkir menghitung quota per request. Cache hasil dengan TTL untuk hemat quota.

---

## Weight Calculation (Important!)

Ongkir dihitung dari **berat** atau **volumetric weight** (mana yang lebih besar).

```typescript
export function calculateChargeableWeight(dimensions: {
  weight: number;       // grams
  length?: number;      // cm
  width?: number;       // cm
  height?: number;      // cm
}): number {
  // Volumetric weight (standard formula)
  // VW (kg) = (L × W × H) / 6000
  if (dimensions.length && dimensions.width && dimensions.height) {
    const volumetricGrams = (dimensions.length * dimensions.width * dimensions.height) / 6;
    return Math.max(dimensions.weight, Math.ceil(volumetricGrams));
  }

  return dimensions.weight;
}

// For orders with multiple items
export function calculateTotalWeight(items: Array<{
  weight: number;
  quantity: number;
  length?: number;
  width?: number;
  height?: number;
}>): number {
  return items.reduce((total, item) => {
    const itemWeight = calculateChargeableWeight({
      weight: item.weight,
      length: item.length,
      width: item.width,
      height: item.height,
    });
    return total + (itemWeight * item.quantity);
  }, 0);
}
```

**Minimum weight:** Many couriers charge minimum 1000g (1kg). Handle rounding:

```typescript
export function roundUpToKg(grams: number): number {
  // 1300g → 2000g (next kg)
  return Math.ceil(grams / 1000) * 1000;
}
```

---

## API Route Example

```typescript
// POST /api/shipping/cost
app.post('/api/shipping/cost', async (req, res) => {
  const { originId, destinationId, items, couriers } = req.body;

  try {
    const weight = calculateTotalWeight(items);

    const costs = await shippingService.calculateCost({
      originId,
      destinationId,
      weight,
      couriers,
    });

    res.json({ weight, costs });
  } catch (error) {
    console.error('Shipping cost error:', error);
    res.status(500).json({ error: 'Gagal menghitung ongkir' });
  }
});

// GET /api/shipping/destinations?q=bandung
app.get('/api/shipping/destinations', async (req, res) => {
  const query = req.query.q as string;
  const destinations = await shippingService.searchDestination(query);
  res.json(destinations);
});
```

---

## Common Mistakes

### ❌ Not Caching Cost Results

```typescript
// Bad: Every page load = API call = quota burn
const costs = await rajaongkir.calculateCost(...);

// Good: Cache with TTL
const costs = await shippingService.calculateCost(...);  // Cached
```

### ❌ Hardcoding Destination IDs

```typescript
// Bad: City IDs change with provider
const JAKARTA_ID = '152';

// Good: Search dynamically, store user's saved location
const dest = await shippingService.searchDestination('Jakarta');
```

### ❌ Forgetting Volumetric Weight

```typescript
// Bad: Only use actual weight → wrong cost for bulky items
weight = item.weight * quantity;

// Good: Use chargeable weight
weight = calculateTotalWeight(items);
```

### ❌ Ignoring Provider Quota

```typescript
// Bad: Unlimited calls
for (const item of cart) {
  await calculateCost(...);  // N calls!
}

// Good: Calculate once for whole cart
await calculateCost({ items: cart });
```

### ❌ No Error Handling

```typescript
// Bad: Provider down = app crashes
const costs = await provider.calculateCost(...);

// Good: Graceful fallback
try {
  const costs = await provider.calculateCost(...);
  return costs;
} catch (error) {
  logger.error('Ongkir failed', error);
  return { error: 'Layanan ongkir sedang gangguan, coba lagi' };
}
```

---

## Testing

```typescript
describe('ShippingService', () => {
  it('calculates volumetric weight correctly', () => {
    // 30×20×10 = 6000cm³ → 1kg volumetric
    const weight = calculateChargeableWeight({
      weight: 500,       // 500g actual
      length: 30, width: 20, height: 10,
    });
    expect(weight).toBe(1000);  // Use volumetric (larger)
  });

  it('uses actual weight when larger', () => {
    const weight = calculateChargeableWeight({
      weight: 3000,      // 3kg actual
      length: 20, width: 10, height: 10,  // 333g volumetric
    });
    expect(weight).toBe(3000);
  });

  it('ranks costs from cheapest', async () => {
    const costs = await service.calculateCost({ ... });
    for (let i = 1; i < costs.length; i++) {
      expect(costs[i].cost).toBeGreaterThanOrEqual(costs[i - 1].cost);
    }
  });
});
```

---

## Checklist

- [ ] Provider abstraction (bisa switch RajaOngkir ↔ Biteship)
- [ ] Destination search dengan autocomplete
- [ ] Cost calculation dengan caching (TTL 5-10 min)
- [ ] Volumetric weight calculation
- [ ] Minimum weight rounding (1kg)
- [ ] Error handling dengan graceful fallback
- [ ] API key di environment variable
- [ ] Quota monitoring (RajaOngkir)
- [ ] Kunjungi docs provider untuk endpoint terbaru
