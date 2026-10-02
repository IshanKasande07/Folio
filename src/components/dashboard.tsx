"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowClockwise,
  ArrowDownLeft,
  ArrowUpRight,
  CaretDown,
  ChartPieSlice,
  CircleNotch,
  Info,
  MagnifyingGlass,
  PlugsConnected,
  Stack,
  X,
} from "@phosphor-icons/react";
import { calculatePortfolio } from "@/lib/calculations";
import { currency, percent, signedCurrency } from "@/lib/format";
import type { Holding, Portfolio } from "@/lib/types";
import HoldingsTable from "./holdings-table";
import SectorOverview from "./sector-overview";

export default function Dashboard({
  initialHoldings,
}: {
  initialHoldings: Holding[];
}) {
  const holdings = initialHoldings;
  const [portfolio, setPortfolio] = useState<Portfolio>(() => ({
    ...calculatePortfolio(initialHoldings, {}, {}),
    checkedAt: "",
    issues: [],
    googleConfigured: false,
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All sectors");
  const [grouped, setGrouped] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const active = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    try {
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(holdings),
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error(
          "Your portfolio could not be refreshed. Try again in a moment.",
        );
      const data: Portfolio = await response.json();
      if (!controller.signal.aborted) {
        setPortfolio(data);
        setError("");
      }
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(
          failure instanceof Error
            ? failure.message
            : "Connection lost. Try refreshing.",
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setLoading(false);
      }
    }
  }, [holdings]);

  useEffect(() => {
    setPortfolio({
      ...calculatePortfolio(holdings, {}, {}),
      checkedAt: "",
      issues: [],
      googleConfigured: false,
    });
    void refresh();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      active.current?.abort();
      active.current = null;
    };
  }, [holdings, refresh]);

  const visibleRows = useMemo(
    () =>
      portfolio.positions.filter(
        (position) =>
          (sector === "All sectors" || position.sector === sector) &&
          `${position.name} ${position.exchangeCode} ${position.yahooSymbol}`
            .toLowerCase()
            .includes(search.toLowerCase().trim()),
      ),
    [portfolio.positions, search, sector],
  );
  const summary = portfolio.summary;
  const partial = summary.pricedCount !== summary.count;
  const stale = portfolio.positions.filter(
    (position) => position.quote?.status === "stale",
  ).length;
  const updated = portfolio.checkedAt
    ? new Date(portfolio.checkedAt).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <main className="mx-auto max-w-[1536px] px-[15px] min-[581px]:px-5 min-[801px]:px-7 min-[1151px]:px-11">
      <header className="flex h-[74px] items-center justify-between gap-3 border-b border-[#dfe3d9] min-[581px]:h-20 min-[801px]:h-[94px] min-[801px]:gap-6">
        <a
          href="#"
          className="inline-flex items-center text-[27px] font-semibold tracking-[-1.7px] min-[581px]:text-[30px]"
          aria-label="Folio home"
        >
          <span className="mr-1.5 grid size-[27px] place-items-center rounded-[10px] bg-[#252a23] text-[#eee583] [&_svg]:size-[21px] min-[581px]:mr-[9px] min-[581px]:size-8">
            <Stack weight="bold" />
          </span>
          folio<span className="text-[#76845c]">.</span>
        </a>
        <nav
          className="flex items-center gap-[3px] rounded-full bg-[#e9ece4] p-[3px] min-[581px]:p-[5px]"
          aria-label="Main navigation"
        >
          <a
            className="rounded-full bg-white px-[9px] py-2 text-[11px] text-[#252a23] shadow-[0_2px_5px_#303f2010] min-[581px]:px-[14px] min-[581px]:py-[9px] min-[581px]:text-xs min-[801px]:px-[22px] min-[801px]:py-[10px] min-[801px]:text-sm"
            href="#overview"
          >
            Overview
          </a>
          <a
            className="rounded-full px-[9px] py-2 text-[11px] text-[#535b4d] hover:bg-white/70 min-[581px]:px-[14px] min-[581px]:py-[9px] min-[581px]:text-xs min-[801px]:px-[22px] min-[801px]:py-[10px] min-[801px]:text-sm"
            href="#holdings"
          >
            Holdings
          </a>
          <button
            className="rounded-full px-[9px] py-2 text-[11px] text-[#535b4d] hover:bg-white/70 min-[581px]:px-[14px] min-[581px]:py-[9px] min-[581px]:text-xs min-[801px]:px-[22px] min-[801px]:py-[10px] min-[801px]:text-sm"
            onClick={() => dialog.current?.showModal()}
          >
            Data sources
          </button>
        </nav>
        <span className="hidden items-center gap-[9px] text-[13px] text-[#58604f] min-[801px]:flex">
          <span className="grid size-8 place-items-center rounded-full bg-[#e3e7da] text-[11px] font-semibold">
            IN
          </span>
          Indian equities
        </span>
      </header>

      <section
        id="overview"
        className="block pt-[30px] pb-5 min-[581px]:flex min-[581px]:items-start min-[581px]:justify-between min-[581px]:gap-6 min-[581px]:pb-7 min-[801px]:items-center min-[801px]:pt-[39px]"
      >
        <div>
          <p className="mb-[11px] text-[10px] font-semibold tracking-[1.6px] text-[#5e6855]">
            YOUR INVESTMENTS, IN VIEW
          </p>
          <h1 className="text-[33px] leading-[1.15] font-medium tracking-[-1.7px] min-[581px]:text-[clamp(29px,3vw,42px)]">
            Portfolio overview<span className="text-[#91a16e]">.</span>
          </h1>
          <p className="mt-[10px] text-xs text-[#697064] min-[801px]:text-sm">
            A little perspective on everything you hold.
          </p>
        </div>
        <div className="flex gap-[9px] pt-[21px] min-[581px]:pt-[25px] min-[801px]:pt-0">
          <button
            className="inline-flex min-h-[43px] items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent px-[17px] py-[10px] text-[13px] [&_svg]:size-[17px] border-[#d7ddce] bg-transparent hover:bg-white min-[581px]:max-[800px]:w-[42px] min-[581px]:max-[800px]:px-[10px] min-[581px]:max-[800px]:[&_span]:hidden"
            onClick={() => void refresh()}
            disabled={loading}
            aria-label="Refresh portfolio"
          >
            {loading ? (
              <CircleNotch className="animate-spin" />
            ) : (
              <ArrowClockwise />
            )}
            <span>Refresh</span>
          </button>
        </div>
      </section>

      <div className="mb-4 block text-[11px] leading-[1.9] text-[#697064] min-[581px]:flex min-[581px]:items-center min-[581px]:justify-between min-[581px]:gap-4 min-[581px]:text-xs min-[581px]:leading-normal">
        <span className="flex items-center gap-2">
          <i className="size-1.5 rounded-full bg-[#7e8b64]" />
          Assignment portfolio
          <span className="mx-[5px] text-[#b6bdad]">/</span>
          {holdings.length} holdings
          <span className="mx-[5px] text-[#b6bdad]">/</span>
          INR
        </span>
        <span className="mt-[5px] block min-[581px]:mt-0" aria-live="polite">
          {loading
            ? "Checking market data…"
            : updated
              ? `Checked ${updated} IST`
              : "Waiting for market data"}
          <span className="max-[800px]:hidden"> · Every 15s</span>
        </span>
      </div>

      {error && (
        <div
          className="mb-4 flex items-center gap-[10px] rounded-[10px] bg-[#f9eae5] px-4 py-[13px] text-[13px] text-[#934836] [&>svg]:text-lg [&>span]:flex-1 [&_button]:underline"
          role="alert"
        >
          <Info />
          <span>
            {error}{" "}
            {portfolio.checkedAt &&
              "Previously loaded values remain on screen and may be out of date."}
          </span>
          <button onClick={() => void refresh()} disabled={loading}>
            Retry
          </button>
        </div>
      )}
      <section
        className="grid grid-cols-2 gap-[10px] min-[581px]:gap-[15px] min-[801px]:grid-cols-[1.15fr_1fr_1fr]"
        aria-label="Portfolio summary"
        aria-busy={loading}
      >
        <article className="col-span-2 min-h-[170px] min-w-0 rounded-[15px] border border-[#e8de79] bg-[#eee583] px-[18px] py-5 min-[581px]:rounded-[20px] min-[581px]:px-[19px] min-[581px]:py-[22px] min-[801px]:col-span-1 min-[801px]:min-h-[197px] min-[1151px]:px-[25px] min-[1151px]:pt-6 min-[1151px]:pb-[21px]">
          <div className="flex items-center justify-between gap-2 text-xs [&>svg]:size-[19px] [&>svg]:opacity-80 min-[581px]:text-sm">
            <span>
              Present value{" "}
              {partial && summary.pricedCount > 0 && (
                <span className="inline-block rounded-[5px] border border-[#afa975] px-[5px] py-[2px] text-[10px] min-[581px]:ml-[5px]">
                  Partial
                </span>
              )}
            </span>
            <ArrowUpRight />
          </div>
          <div
            className={`mt-[25px] whitespace-nowrap text-[32px] leading-[1.2] font-normal tracking-[-1.2px] tabular-nums min-[801px]:text-[40px] min-[1151px]:text-[clamp(28px,2.8vw,43px)] ${loading && !updated ? "animate-pulse" : ""}`}
          >
            {currency(summary.presentValue)}
          </div>
          <div className="mt-[10px] flex items-center justify-between gap-3 min-[801px]:mt-[17px]">
            <span className="text-xs text-[#555a36]">
              {summary.pricedCount
                ? `${summary.pricedCount} of ${summary.count} holdings priced`
                : loading
                  ? "Fetching your latest quotes"
                  : "Waiting for available quotes"}
            </span>
            <span className="grid size-[30px] place-items-center rounded-full border border-[#9e984c60] [&_svg]:size-[19px]">
              <ChartPieSlice weight="light" />
            </span>
          </div>
        </article>
        <article className="min-h-[162px] min-w-0 rounded-[15px] px-[13px] py-[17px] min-[581px]:min-h-[178px] min-[581px]:rounded-[20px] min-[581px]:px-[19px] min-[581px]:py-[22px] min-[801px]:min-h-[197px] min-[1151px]:px-[25px] min-[1151px]:pt-6 min-[1151px]:pb-[21px] rounded-[15px] border border-[#e7eae2] bg-white min-[581px]:rounded-[20px]">
          <div className="flex items-center justify-between gap-2 text-xs [&>svg]:hidden min-[581px]:text-sm min-[581px]:[&>svg]:block min-[581px]:[&>svg]:size-[19px] min-[581px]:[&>svg]:opacity-80">
            <span>Total invested</span>
            <ArrowDownLeft />
          </div>
          <div className="mt-[22px] whitespace-nowrap text-[clamp(19px,5.6vw,28px)] leading-[1.2] font-normal tracking-[-0.7px] tabular-nums min-[581px]:mt-[25px] min-[581px]:text-[30px] min-[1151px]:text-[clamp(24px,2.4vw,37px)] min-[1151px]:tracking-[-1.2px]">
            {currency(summary.investment)}
          </div>
          <div className="mt-[18px] flex flex-wrap items-start gap-[5px] text-[10px] text-[#697064] min-[581px]:mt-[27px] min-[581px]:gap-[9px] min-[581px]:text-[11px] min-[1151px]:items-center min-[1151px]:text-xs">
            <span className="hidden size-[5px] rounded-full bg-[#aab398] min-[581px]:inline-block" />
            Across {summary.count} holdings in {portfolio.sectors.length}{" "}
            sectors
          </div>
        </article>
        <article className="min-h-[162px] min-w-0 rounded-[15px] px-[13px] py-[17px] min-[581px]:min-h-[178px] min-[581px]:rounded-[20px] min-[581px]:px-[19px] min-[581px]:py-[22px] min-[801px]:min-h-[197px] min-[1151px]:px-[25px] min-[1151px]:pt-6 min-[1151px]:pb-[21px] rounded-[15px] border border-[#e7eae2] bg-white min-[581px]:rounded-[20px]">
          <div className="flex items-center justify-between gap-2 text-xs [&>svg]:hidden min-[581px]:text-sm min-[581px]:[&>svg]:block min-[581px]:[&>svg]:size-[19px] min-[581px]:[&>svg]:opacity-80">
            <span>
              Unrealised return{" "}
              {partial && summary.pricedCount > 0 && (
                <span className="inline-block rounded-[5px] border border-[#afa975] px-[5px] py-[2px] text-[10px] min-[581px]:ml-[5px]">
                  Partial
                </span>
              )}
            </span>
            <ArrowUpRight />
          </div>
          <div
            className={`mt-[22px] whitespace-nowrap text-[clamp(19px,5.6vw,28px)] leading-[1.2] font-normal tracking-[-0.7px] tabular-nums min-[581px]:mt-[25px] min-[581px]:text-[30px] min-[1151px]:text-[clamp(24px,2.4vw,37px)] min-[1151px]:tracking-[-1.2px] ${summary.gain === null ? "" : summary.gain >= 0 ? "text-[#32734d]" : "text-[#ad423d]"}`}
          >
            {signedCurrency(summary.gain)}
          </div>
          <div className="mt-[18px] flex flex-wrap items-start gap-[5px] text-[10px] text-[#697064] min-[581px]:mt-[27px] min-[581px]:gap-[9px] min-[581px]:text-[11px] min-[1151px]:items-center min-[1151px]:text-xs">
            <span
              className={`rounded-[7px] bg-[#eff5ec] px-[7px] py-1 text-[10px] text-[#32734d] min-[581px]:text-xs ${summary.gain !== null && summary.gain < 0 ? "bg-[#faefec] text-[#ad423d]" : ""}`}
            >
              {percent(summary.gainPercent)}
            </span>
            <span>
              {partial ? "On priced holdings only" : "On invested capital"}
            </span>
          </div>
        </article>
      </section>

      <div className="block px-0 pt-[15px] pb-5 text-[11px] leading-[1.7] text-[#697260] min-[581px]:flex min-[581px]:items-center min-[581px]:justify-between min-[581px]:gap-4 min-[581px]:px-[2px] min-[581px]:text-xs min-[581px]:leading-normal">
        <span className="flex flex-wrap items-center gap-[5px]">
          <PlugsConnected className="mr-1 text-base" />
          <b className="font-semibold">
            {summary.pricedCount}/{summary.count}
          </b>{" "}
          quotes available{stale > 0 ? ` · ${stale} stale` : ""}
          <span className="mx-[2px] text-[#afb7a5] min-[581px]:mx-2">·</span>
          {portfolio.googleConfigured
            ? "Google Sheets configured"
            : "Fundamentals awaiting connection"}
        </span>
        <button
          className="mt-2 flex items-center gap-[7px] whitespace-nowrap text-[#404b35] hover:underline min-[581px]:mt-0"
          onClick={() => dialog.current?.showModal()}
        >
          Connection details <ArrowUpRight />
        </button>
      </div>

      <SectorOverview
        sectors={portfolio.sectors}
        selected={sector}
        onSelect={setSector}
      />

      <section
        id="holdings"
        className="mt-[18px] overflow-hidden min-[581px]:mt-6 rounded-[15px] border border-[#e7eae2] bg-white min-[581px]:rounded-[20px]"
      >
        <div className="flex flex-col items-start gap-4 px-[17px] pt-[22px] pb-[19px] min-[581px]:flex-row min-[581px]:items-center min-[581px]:justify-between min-[581px]:gap-[18px] min-[581px]:px-[25px] min-[581px]:pt-[27px] min-[581px]:pb-[23px]">
          <div>
            <p className="mb-[11px] text-[10px] font-semibold tracking-[1.6px] text-[#5e6855]">
              POSITION BY POSITION
            </p>
            <h2 className="text-[18px] leading-[1.2] font-medium tracking-[-0.45px] min-[581px]:text-xl">
              Your holdings{" "}
              <span className="ml-[7px] inline-flex h-[22px] min-w-[27px] items-center justify-center rounded-md bg-[#f1f3ed] px-[5px] align-middle text-[11px] text-[#6a745e]">
                {visibleRows.length}
              </span>
            </h2>
          </div>
          <div
            className="flex w-full gap-[2px] rounded-[9px] border border-[#e6e9df] p-[3px] min-[581px]:w-auto"
            aria-label="Table grouping"
          >
            <button
              className={`min-h-9 flex-1 rounded-md px-[13px] py-2 text-xs min-[581px]:flex-none ${!grouped ? "bg-[#252a23] text-white" : "text-[#697064]"}`}
              aria-pressed={!grouped}
              onClick={() => setGrouped(false)}
            >
              All holdings
            </button>
            <button
              className={`min-h-9 flex-1 rounded-md px-[13px] py-2 text-xs min-[581px]:flex-none ${grouped ? "bg-[#252a23] text-white" : "text-[#697064]"}`}
              aria-pressed={grouped}
              onClick={() => setGrouped(true)}
            >
              By sector
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-[10px] px-[17px] pb-[17px] min-[581px]:flex-nowrap min-[581px]:px-[25px] min-[581px]:pb-[22px]">
          <label className="flex min-h-[39px] w-full max-w-none items-center gap-[9px] rounded-[9px] border border-[#e1e6da] px-3 text-[#7e8873] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#839867] min-[581px]:max-w-[290px]">
            <MagnifyingGlass className="size-[17px]" />
            <input
              className="h-[39px] min-w-0 w-full border-0 bg-transparent text-xs text-[#252a23] outline-none placeholder:text-[#5e6855]"
              placeholder="Find a company or symbol"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search holdings"
            />
            {search && (
              <button
                className="p-[2px]"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <X />
              </button>
            )}
          </label>
          <label className="relative">
            <select
              className="h-10 max-w-[175px] min-w-[155px] appearance-none rounded-[9px] border border-[#e1e6da] bg-white pr-[33px] pl-3 text-xs text-[#5e6853]"
              aria-label="Filter by sector"
              value={sector}
              onChange={(event) => setSector(event.target.value)}
            >
              <option>All sectors</option>
              {portfolio.sectors.map((item) => (
                <option key={item.name}>{item.name}</option>
              ))}
            </select>
            <CaretDown className="pointer-events-none absolute top-[13px] right-[11px] text-xs text-[#6c775f]" />
          </label>
          {(sector !== "All sectors" || search) && (
            <button
              className="border-0 bg-transparent text-xs text-[#596d41] underline underline-offset-[3px]"
              onClick={() => {
                setSector("All sectors");
                setSearch("");
              }}
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-[#5e6855] max-[1150px]:hidden">
            Scroll to explore all columns →
          </span>
        </div>
        <HoldingsTable rows={visibleRows} grouped={grouped} />
        <div className="flex flex-col items-start justify-between gap-3 border-t border-[#e9ece4] px-[17px] py-[15px] text-[10px] leading-[1.7] text-[#5e6855] min-[581px]:flex-row min-[581px]:items-center min-[581px]:px-[25px] min-[581px]:py-[17px] min-[581px]:text-xs">
          <span>
            Weight is based on invested cost. ¹ Earnings shown as Google Finance
            EPS, not a quarterly result.
          </span>
        </div>
      </section>

      <footer className="flex min-h-[93px] flex-wrap items-center justify-between gap-[13px] px-[2px] py-[22px] min-[581px]:flex-nowrap min-[581px]:gap-[14px] min-[581px]:px-0 min-[581px]:py-[15px] min-[1151px]:gap-[25px]">
        <span className="inline-flex items-center text-[22px] font-semibold tracking-[-1.7px] text-[#606b55]">
          folio.
        </span>
        <p className="order-3 mr-auto w-full text-[10px] leading-[1.7] text-[#5e6855] min-[581px]:order-none min-[581px]:max-w-[370px] min-[581px]:text-[11px] min-[1151px]:max-w-[650px]">
          Yahoo Finance prices may be delayed. Holdings are used as supplied;
          corporate actions are not adjusted.
        </p>
        <button
          className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-[#647354] min-[581px]:ml-0"
          onClick={() => dialog.current?.showModal()}
        >
          <Info /> About this data
        </button>
      </footer>

      <dialog
        ref={dialog}
        className="m-auto max-h-[85dvh] w-[min(640px,calc(100%-32px))] rounded-[20px] border border-[#dbe2d0] bg-white p-0 text-[#252a23] shadow-[0_24px_100px_#28312130] backdrop:bg-[#28312155] backdrop:backdrop-blur-[4px]"
        aria-labelledby="sources-title"
      >
        <div className="flex items-center justify-between border-b border-[#e9ece4] px-5 py-[23px] min-[581px]:px-[26px]">
          <h2
            id="sources-title"
            className="text-xl leading-[1.2] font-medium tracking-[-0.45px]"
          >
            Behind the numbers
          </h2>
          <button
            className="grid size-[34px] place-items-center rounded-full border border-[#e6ebdf] bg-white"
            aria-label="Close data sources"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
        </div>
        <div className="px-5 pt-[2px] pb-5 [&_h3]:mt-[23px] [&_h3]:mb-2 [&_h3]:text-[15px] [&_h3]:font-semibold [&_p]:text-[13px] [&_p]:leading-[1.8] [&_p]:text-[#65715c] [&_li]:text-[13px] [&_li]:leading-[1.8] [&_li]:text-[#65715c] [&_ul]:list-disc [&_ul]:pl-[18px] min-[581px]:px-[26px]">
          <h3>Prices · Yahoo Finance</h3>
          <p>
            Quotes are requested every 15 seconds through yahoo-finance2. Each
            quote carries its market timestamp; a fresh request does not
            guarantee a fresh exchange price. Failed refreshes keep the last
            retrieved quote for up to 24 hours, marked stale.
          </p>
          <h3>Fundamentals · Google Finance</h3>
          <p>
            {portfolio.googleConfigured
              ? "The private Google Sheet is configured."
              : "Connect a private Google Sheet using the setup instructions in README.md."}{" "}
            The backend reads P/E and EPS and caches them for 30 minutes.
            Missing values remain blank.
          </p>
          {portfolio.issues.length > 0 && (
            <div className="border-l-[3px] border-[#d4c965] pl-4">
              <h3>Connection status</h3>
              <ul>
                {portfolio.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          <h3>How totals work</h3>
          <p>
            Investment = buy price × quantity. Present value = CMP × quantity.
            Gain/loss = present value − cost of the priced holdings. Portfolio
            weight uses total invested cost. Partial totals exclude holdings
            without quotes from both value and return calculations.
          </p>
          <h3>Workbook notes</h3>
          <p>
            The supplied file has 26 active holdings with ₹15,43,060 invested.
            Three rows under “Sold Price” are excluded. Original sector
            classifications are preserved. The workbook is historical: splits,
            bonuses and other corporate actions are not applied, so returns need
            reconciliation before real-world use.
          </p>
          {holdings
            .filter((holding) => holding.note)
            .map((holding) => (
              <p className="rounded-lg bg-[#f7f5e7] p-3" key={holding.id}>
                <strong>{holding.name}:</strong> {holding.note}
              </p>
            ))}
        </div>
        <div className="flex justify-end bg-[#f7f9f3] px-5 py-4 min-[581px]:px-[26px]">
          <button
            className="inline-flex min-h-[43px] items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent px-[17px] py-[10px] text-[13px] [&_svg]:size-[17px] bg-[#252a23] text-white hover:bg-[#46543a]"
            onClick={() => dialog.current?.close()}
          >
            Got it
          </button>
        </div>
      </dialog>
    </main>
  );
}
