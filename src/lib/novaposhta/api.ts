const NP_BASE = `${process.env.EXPO_PUBLIC_API_URL || ''}/api/nova-poshta`;

export interface NPCity {
  ref: string;
  deliveryCityRef?: string;
  name: string;
  area: string;
  region: string;
  type: string;
}

export interface NPWarehouse {
  id: string;
  name: string;
  shortName: string;
  number: number;
  address: string;
  category: 'branch' | 'postomat' | 'cargo';
  schedule: Record<string, string> | null;
}

export interface NPStreet {
  ref: string;
  name: string;
  type: string;
}

export interface NPDeliveryCost {
  cost: number;
  estimatedDays: string;
  redelivery?: number;
}

export async function searchCities(query: string): Promise<NPCity[]> {
  if (query.length < 1) return [];
  const res = await fetch(`${NP_BASE}/cities?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.cities ?? [];
}

export async function getPopularCities(): Promise<NPCity[]> {
  const res = await fetch(`${NP_BASE}/cities?popular=1`);
  const data = await res.json();
  return data.cities ?? [];
}

export async function searchWarehouses(
  city: string,
  query?: string,
  type?: string
): Promise<NPWarehouse[]> {
  let url = `${NP_BASE}/warehouses?city=${encodeURIComponent(city)}`;
  if (query) url += `&q=${encodeURIComponent(query)}`;
  if (type) url += `&type=${type}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.warehouses ?? [];
}

export async function searchStreets(cityRef: string, query: string): Promise<NPStreet[]> {
  if (query.length < 2) return [];
  const res = await fetch(`${NP_BASE}/streets?cityRef=${cityRef}&q=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.streets ?? [];
}

export async function calculateDelivery(params: {
  cityRef: string;
  weight: number;
  cost: number;
  serviceType?: string;
}): Promise<NPDeliveryCost | null> {
  try {
    const res = await fetch(`${NP_BASE}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}
