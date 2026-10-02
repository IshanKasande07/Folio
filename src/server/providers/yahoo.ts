import YahooFinance from "yahoo-finance2";
import type { Holding, Quote } from "@/lib/types";
import type { QuoteProvider } from "./contracts";

const yahoo = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export class YahooQuoteProvider implements QuoteProvider {
  name = "Yahoo Finance";

  async fetchQuotes(holdings: Holding[]): Promise<Record<string, Quote>> {
    const symbols = [...new Set(holdings.map((h) => h.yahooSymbol))];
    if (!symbols.length) return {};
    const rows = await yahoo.quote(
      symbols,
      {},
      {
        fetchOptions: { signal: AbortSignal.timeout(12000) },
        validateResult: false,
      },
    );
    const quotes: Record<string, Quote> = {};
    const fetchedAt = new Date().toISOString();
    for (const row of rows) {
      if (
        row.currency !== "INR" ||
        typeof row.regularMarketPrice !== "number" ||
        !Number.isFinite(row.regularMarketPrice) ||
        row.regularMarketPrice <= 0 ||
        !row.regularMarketTime
      )
        continue;
      const date = new Date(row.regularMarketTime);
      if (!Number.isFinite(date.getTime())) continue;
      quotes[row.symbol] = {
        price: row.regularMarketPrice,
        asOf: date.toISOString(),
        fetchedAt,
        source: this.name,
        status: "current",
      };
    }
    return quotes;
  }
}
