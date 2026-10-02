import type { Fundamentals, Holding, Quote } from "@/lib/types";

export interface QuoteProvider {
  name: string;
  fetchQuotes(holdings: Holding[]): Promise<Record<string, Quote>>;
}

export interface FundamentalsProvider {
  name: string;
  fetchFundamentals(): Promise<Record<string, Fundamentals>>;
}

// An Upstox adapter can implement QuoteProvider and translate instrument keys to
// the same Yahoo-symbol keys. The calculation layer never needs to know about it.
