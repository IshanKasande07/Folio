import type { Portfolio } from "@/lib/types";
import { currency, percent, shortCurrency } from "@/lib/format";

const colors = [
  "#daca52",
  "#9cac8b",
  "#92adbe",
  "#c4ad98",
  "#ada4bc",
  "#d2d6c9",
];

export default function SectorOverview({
  sectors,
  selected,
  onSelect,
}: {
  sectors: Portfolio["sectors"];
  selected: string;
  onSelect: (sector: string) => void;
}) {
  return (
    <section
      className="rounded-[15px] px-[17px] py-[21px] min-[581px]:rounded-[20px] min-[581px]:px-[25px] min-[581px]:pt-[25px] min-[581px]:pb-[22px] rounded-[15px] border border-[#e7eae2] bg-white min-[581px]:rounded-[20px]"
      aria-labelledby="sectors-heading"
    >
      <div className="flex items-start justify-between gap-[10px] min-[581px]:items-center min-[581px]:gap-5">
        <div>
          <p className="mb-[11px] text-[10px] font-semibold tracking-[1.6px] text-[#5e6855]">
            THE BIG PICTURE
          </p>
          <h2
            id="sectors-heading"
            className="text-[18px] leading-[1.2] font-medium tracking-[-0.45px] min-[581px]:text-xl"
          >
            Across your sectors
          </h2>
        </div>
        <span className="text-xs text-[#697064]">By invested cost</span>
      </div>
      <div
        className="mt-[25px] mb-5 flex h-2 gap-1 overflow-hidden rounded-[10px] [&_span]:min-w-0"
        role="img"
        aria-label={sectors
          .map(
            (sector) => `${sector.name}: ${sector.weight.toFixed(1)} percent`,
          )
          .join(", ")}
      >
        {sectors.map((sector, index) => (
          <span
            key={sector.name}
            style={{
              width: `${sector.weight}%`,
              background: colors[index % colors.length],
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 min-[581px]:grid-cols-3 min-[581px]:gap-y-4 min-[1151px]:grid-cols-6 min-[1151px]:gap-y-0">
        {sectors.map((sector, index) => (
          <button
            key={sector.name}
            className={`min-w-0 border-0 border-r border-[#e9ece4] bg-white px-3 py-[5px] text-left hover:bg-[#f7f8f2] first:pl-0 last:border-r-0 last:pr-0 even:border-r-0 odd:pl-0 min-[581px]:px-[17px] min-[581px]:odd:pl-[17px] min-[581px]:[&:nth-child(3n)]:border-r-0 min-[581px]:[&:nth-child(4)]:pl-0 min-[1151px]:py-[7px] min-[1151px]:first:pl-0 min-[1151px]:even:border-r min-[1151px]:last:border-r-0 min-[1151px]:[&:nth-child(3n)]:border-r ${selected === sector.name ? "bg-[#f7f8f2]" : ""}`}
            aria-pressed={selected === sector.name}
            onClick={() =>
              onSelect(selected === sector.name ? "All sectors" : sector.name)
            }
          >
            <span className="flex items-center gap-[5px] text-[11px] min-[581px]:gap-1.5 min-[581px]:text-xs min-[1450px]:text-[13px]">
              <i
                className="size-1.5 shrink-0 rounded-full"
                style={{ background: colors[index % colors.length] }}
              />
              {sector.name}
              <b className="ml-auto text-[10px] font-normal text-[#697064] min-[581px]:text-[11px]">
                {sector.weight.toFixed(1)}%
              </b>
            </span>
            <span className="my-3.5 flex items-center justify-between gap-2 max-[580px]:gap-[3px]">
              <strong className="text-[18px] font-medium tracking-[-0.5px] min-[581px]:text-[19px]">
                {shortCurrency(sector.investment)}
              </strong>
              <span
                className={
                  sector.gain === null
                    ? "text-xs text-[#697064]"
                    : sector.gain >= 0
                      ? "text-[#32734d]"
                      : "text-[#ad423d]"
                }
              >
                {percent(sector.gainPercent)}
              </span>
            </span>
            <span className="flex justify-between gap-[5px] text-xs leading-[1.9] text-[#5e6855] min-[581px]:max-[1150px]:text-[11px] min-[1450px]:text-[11px]">
              Value{" "}
              <b className="font-normal text-[#50594a]">
                {currency(sector.presentValue)}
              </b>
            </span>
            <span className="flex justify-between gap-[5px] text-xs leading-[1.9] text-[#5e6855] min-[581px]:max-[1150px]:text-[11px] min-[1450px]:text-[11px]">
              Gain / loss{" "}
              <b className="font-normal text-[#50594a]">
                {currency(sector.gain)}
              </b>
            </span>
            <small className="mt-[5px] block text-xs text-[#5e6855] min-[581px]:max-[1150px]:text-[11px]">
              {sector.pricedCount}/{sector.count} priced
              {sector.pricedCount < sector.count ? " · Partial" : ""}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}
