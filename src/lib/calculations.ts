import type {
  Fundamentals,
  Holding,
  Portfolio,
  Position,
  Quote,
  Summary,
} from "./types";

export const money = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

function summarize(rows: Position[]): Summary {
  const priced = rows.filter((row) => row.presentValue !== null);
  const investment = money(rows.reduce((sum, row) => sum + row.investment, 0));
  const pricedInvestment = money(
    priced.reduce((sum, row) => sum + row.investment, 0),
  );
  const presentValue = priced.length
    ? money(priced.reduce((sum, row) => sum + row.presentValue!, 0))
    : null;
  const gain =
    presentValue === null ? null : money(presentValue - pricedInvestment);
  return {
    investment,
    presentValue,
    gain,
    gainPercent:
      gain === null || !pricedInvestment
        ? null
        : (gain / pricedInvestment) * 100,
    pricedCount: priced.length,
    count: rows.length,
    pricedInvestment,
  };
}

export function calculatePortfolio(
  holdings: Holding[],
  quotes: Record<string, Quote>,
  fundamentals: Record<string, Fundamentals>,
): Pick<Portfolio, "positions" | "summary" | "sectors"> {
  const total = money(
    holdings.reduce((sum, h) => sum + money(h.purchasePrice * h.quantity), 0),
  );
  const positions: Position[] = holdings.map((holding) => {
    const investment = money(holding.purchasePrice * holding.quantity);
    const quote = quotes[holding.yahooSymbol] ?? null;
    const presentValue = quote ? money(quote.price * holding.quantity) : null;
    const gain =
      presentValue === null ? null : money(presentValue - investment);
    return {
      ...holding,
      investment,
      weight: total ? (investment / total) * 100 : 0,
      quote,
      fundamentals: fundamentals[holding.googleSymbol] ?? null,
      presentValue,
      gain,
      gainPercent:
        gain === null || !investment ? null : (gain / investment) * 100,
    };
  });
  const sectors = [...new Set(positions.map((p) => p.sector))].map((name) => {
    const summary = summarize(positions.filter((p) => p.sector === name));
    return {
      name,
      ...summary,
      weight: total ? (summary.investment / total) * 100 : 0,
    };
  });
  return { positions, summary: summarize(positions), sectors };
}
