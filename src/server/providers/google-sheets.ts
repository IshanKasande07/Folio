import { GoogleAuth } from "google-auth-library";
import type { Fundamentals } from "@/lib/types";
import type { FundamentalsProvider } from "./contracts";

export function isGoogleConfigured() {
  return Boolean(
    process.env.GOOGLE_SHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY,
  );
}

export function sheetNumber(value: unknown): number | null {
  // Sheets errors and empty cells are not zero. Negative EPS is valid.
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

export class GoogleSheetsProvider implements FundamentalsProvider {
  name = "Google Finance via Sheets";

  async fetchFundamentals(): Promise<Record<string, Fundamentals>> {
    if (!isGoogleConfigured()) return {};
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const client = await auth.getClient();
    const sheet = encodeURIComponent(process.env.GOOGLE_SHEET_ID!);
    const range = encodeURIComponent(
      process.env.GOOGLE_SHEET_RANGE || "Fundamentals!A2:C200",
    );
    const response = await client.request<{ values?: unknown[][] }>({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`,
      timeout: 10000,
    });
    const data: Record<string, Fundamentals> = {};
    for (const row of response.data.values ?? []) {
      const symbol = String(row[0] ?? "")
        .trim()
        .toUpperCase();
      if (!/^(NSE|BOM):[A-Z0-9&-]+$/.test(symbol)) continue;
      data[symbol] = {
        pe: sheetNumber(row[1]),
        eps: sheetNumber(row[2]),
        fetchedAt: new Date().toISOString(),
        source: this.name,
        status: "current",
      };
    }
    return data;
  }
}
