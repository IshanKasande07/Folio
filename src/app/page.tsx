import Dashboard from "@/components/dashboard";
import holdings from "../../data/holdings.json";
import { holdingsSchema } from "@/lib/validation";

export default function Home() {
  return <Dashboard initialHoldings={holdingsSchema.parse(holdings)} />;
}
