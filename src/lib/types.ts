export type Holding = {
  id: string;
  name: string;
  sector: string;
  purchasePrice: number;
  quantity: number;
  exchange: "NSE" | "BSE";
  exchangeCode: string;
  yahooSymbol: string;
  googleSymbol: string;
  note?: string;
};

export type Quote = {
  price: number;
  asOf: string;
  fetchedAt: string;
  source: string;
  status: "current" | "cached" | "stale";
};

export type Fundamentals = {
  pe: number | null;
  eps: number | null;
  fetchedAt: string;
  source: string;
  status: "current" | "cached" | "stale";
};

export type Position = Holding & {
  investment: number;
  weight: number;
  quote: Quote | null;
  fundamentals: Fundamentals | null;
  presentValue: number | null;
  gain: number | null;
  gainPercent: number | null;
};

export type Summary = {
  investment: number;
  presentValue: number | null;
  gain: number | null;
  gainPercent: number | null;
  pricedCount: number;
  count: number;
  pricedInvestment: number;
};

export type Portfolio = {
  positions: Position[];
  summary: Summary;
  sectors: (Summary & { name: string; weight: number })[];
  checkedAt: string;
  issues: string[];
  googleConfigured: boolean;
};
