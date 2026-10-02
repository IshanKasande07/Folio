import { z } from "zod";

export const holdingSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  sector: z.string().min(1).max(60),
  purchasePrice: z.number().finite().positive().max(10000000),
  quantity: z.number().int().positive().max(10000000),
  exchange: z.enum(["NSE", "BSE"]),
  exchangeCode: z.string().regex(/^[A-Z0-9&-]{1,30}$/),
  yahooSymbol: z.string().regex(/^[A-Z0-9&-]{1,30}\.(NS|BO)$/),
  googleSymbol: z.string().regex(/^(NSE|BOM):[A-Z0-9&-]{1,30}$/),
  note: z.string().max(300).optional(),
});
export const holdingsSchema = z
  .array(holdingSchema)
  .max(100)
  .refine(
    (rows) => new Set(rows.map((row) => row.id)).size === rows.length,
    "Holding IDs must be unique.",
  );
