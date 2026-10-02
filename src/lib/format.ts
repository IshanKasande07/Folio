const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
export const currency = (value: number | null) =>
  value === null ? "—" : rupees.format(value);
export const percent = (value: number | null) =>
  value === null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
export const signedCurrency = (value: number | null) =>
  value === null ? "—" : `${value > 0 ? "+" : ""}${currency(value)}`;
export const shortCurrency = (value: number) =>
  value >= 100000 ? `₹${(value / 100000).toFixed(2)}L` : currency(value);
