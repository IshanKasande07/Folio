import { NextResponse } from "next/server";
import defaults from "../../../../data/holdings.json";
import { holdingsSchema } from "@/lib/validation";
import { getPortfolio } from "@/server/market-service";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

export async function GET() {
  return NextResponse.json(await getPortfolio(holdingsSchema.parse(defaults)), {
    headers,
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > 100000)
    return NextResponse.json(
      { error: "Portfolio is too large." },
      { status: 413 },
    );
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = holdingsSchema.safeParse(value);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid holdings. Check symbols, prices and quantities." },
      { status: 400 },
    );
  return NextResponse.json(await getPortfolio(parsed.data), { headers });
}
