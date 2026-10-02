import "server-only";
import type { Fundamentals, Holding, Quote } from "@/lib/types";
import { calculatePortfolio } from "@/lib/calculations";
import { YahooQuoteProvider } from "./providers/yahoo";
import {
  GoogleSheetsProvider,
  isGoogleConfigured,
} from "./providers/google-sheets";

const yahoo = new YahooQuoteProvider();
const google = new GoogleSheetsProvider();
const quotes = new Map<string, Quote>();
let fundamentals: Record<string, Fundamentals> = {};
let quoteAttempt = 0;
let fundamentalsAttempt = 0;
let quoteError = false;
let fundamentalsError = false;
let pendingQuotes: Promise<void> | undefined;
let pendingFundamentals: Promise<void> | undefined;
const QUOTE_TTL = 15000;
const FUNDAMENTALS_TTL = 30 * 60 * 1000;
const MAX_QUOTE_AGE = 24 * 60 * 60 * 1000;

async function refreshQuotes(holdings: Holding[]) {
  if (pendingQuotes) await pendingQuotes;
  if (Date.now() - quoteAttempt < QUOTE_TTL) return;
  quoteAttempt = Date.now();
  pendingQuotes = (async () => {
    try {
      const result = await yahoo.fetchQuotes(holdings);
      quoteError = false;
      for (const [key, quote] of Object.entries(result)) quotes.set(key, quote);
      while (quotes.size > 500) quotes.delete(quotes.keys().next().value!);
    } catch {
      quoteError = true;
    }
  })();
  try {
    await pendingQuotes;
  } finally {
    pendingQuotes = undefined;
  }
}

async function refreshFundamentals() {
  if (!isGoogleConfigured()) return;
  if (pendingFundamentals) return pendingFundamentals;
  const ttl = fundamentalsError ? 60000 : FUNDAMENTALS_TTL;
  if (Date.now() - fundamentalsAttempt < ttl) return;
  fundamentalsAttempt = Date.now();
  pendingFundamentals = (async () => {
    try {
      fundamentals = await google.fetchFundamentals();
      fundamentalsError = false;
    } catch {
      fundamentalsError = true;
    }
  })();
  try {
    await pendingFundamentals;
  } finally {
    pendingFundamentals = undefined;
  }
}

export async function getPortfolio(holdings: Holding[]) {
  await Promise.all([refreshQuotes(holdings), refreshFundamentals()]);
  const selected: Record<string, Quote> = {};
  for (const holding of holdings) {
    const quote = quotes.get(holding.yahooSymbol);
    if (!quote || Date.now() - Date.parse(quote.fetchedAt) > MAX_QUOTE_AGE)
      continue;
    selected[holding.yahooSymbol] = {
      ...quote,
      status:
        quoteError || Date.parse(quote.fetchedAt) < quoteAttempt ? "stale" : "cached",
    };
  }
  const selectedFundamentals = Object.fromEntries(
    Object.entries(fundamentals)
      .filter(
        ([, value]) =>
          Date.now() - Date.parse(value.fetchedAt) <= MAX_QUOTE_AGE,
      )
      .map(([key, value]) => [
        key,
        {
          ...value,
          status: fundamentalsError ? ("stale" as const) : ("cached" as const),
        },
      ]),
  );
  const result = calculatePortfolio(holdings, selected, selectedFundamentals);
  const missing = result.summary.count - result.summary.pricedCount;
  const issues: string[] = [];
  if (quoteError)
    issues.push(
      "Yahoo Finance could not be reached. Any saved quotes are marked stale.",
    );
  if (missing)
    issues.push(
      `${missing} holding${missing === 1 ? " has" : "s have"} no price. Valuation and return figures cover priced holdings only.`,
    );
  if (!isGoogleConfigured())
    issues.push(
      "Google Sheets is not connected. P/E and earnings will appear after setup.",
    );
  else if (fundamentalsError)
    issues.push(
      "Google Sheets could not be read. Any saved fundamentals are marked stale.",
    );
  return {
    ...result,
    checkedAt: new Date().toISOString(),
    issues,
    googleConfigured: isGoogleConfigured(),
  };
}
