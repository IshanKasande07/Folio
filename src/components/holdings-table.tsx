"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowsDownUp } from "@phosphor-icons/react";
import type { Position } from "@/lib/types";
import { currency, percent, signedCurrency } from "@/lib/format";

function quoteTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HoldingsTable({
  rows,
  grouped,
}: {
  rows: Position[];
  grouped: boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = useMemo<ColumnDef<Position>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Company",
        cell: ({ row }) => (
          <div className="flex items-center gap-[11px]">
            <span
              className="hidden size-8 place-items-center rounded-[10px] bg-[#eef0e8] text-[10px] font-semibold tracking-[-0.5px] text-[#586148] min-[581px]:grid"
              aria-hidden="true"
            >
              {row.original.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span>
              <strong className="text-xs font-semibold text-[#30372a]">
                {row.original.name}
              </strong>
              <small className="mt-1 block text-xs text-[#5e6855]">
                {row.original.sector}
                {row.original.note && (
                  <span title={row.original.note}> · Mapping note</span>
                )}
              </small>
            </span>
          </div>
        ),
      },
      {
        accessorKey: "purchasePrice",
        header: "Buy price",
        cell: ({ getValue }) => currency(getValue<number>()),
      },
      { accessorKey: "quantity", header: "Qty" },
      {
        accessorKey: "investment",
        header: "Investment",
        cell: ({ getValue }) => currency(getValue<number>()),
      },
      {
        accessorKey: "weight",
        header: "Weight",
        cell: ({ getValue }) => (
          <span className="inline-flex flex-col items-end gap-[5px]">
            {getValue<number>().toFixed(2)}%
            <span className="h-[3px] w-[34px] overflow-hidden rounded-sm bg-[#edf0e5]">
              <i
                className="block h-full bg-[#b8c1a5]"
                style={{ width: `${Math.min(getValue<number>() * 10, 100)}%` }}
              />
            </span>
          </span>
        ),
      },
      {
        accessorKey: "exchangeCode",
        header: "NSE / BSE",
        cell: ({ row }) => (
          <span>
            {row.original.exchangeCode}
            <small className="mt-1 block text-xs text-[#5e6855]">
              {row.original.exchange}
            </small>
          </span>
        ),
      },
      {
        id: "cmp",
        accessorFn: (row) => row.quote?.price,
        header: "CMP",
        sortUndefined: "last",
        cell: ({ row }) => (
          <span
            title={
              row.original.quote
                ? `${row.original.quote.source} · Quote ${quoteTime(row.original.quote.asOf)} IST · Retrieved ${quoteTime(row.original.quote.fetchedAt)} IST`
                : "Yahoo Finance has not returned a usable INR quote."
            }
          >
            {currency(row.original.quote?.price ?? null)}
            <small
              className={
                row.original.quote?.status === "stale"
                  ? "mt-1 block text-xs text-[#936016]"
                  : "mt-1 block text-xs text-[#5e6855]"
              }
            >
              {row.original.quote
                ? `${row.original.quote.status === "stale" ? "Stale · " : ""}${quoteTime(row.original.quote.asOf)}`
                : "Unavailable"}
            </small>
          </span>
        ),
      },
      {
        accessorKey: "presentValue",
        header: "Present value",
        cell: ({ getValue }) => (
          <strong className="font-semibold">
            {currency(getValue<number | null>())}
          </strong>
        ),
      },
      {
        accessorKey: "gain",
        header: "Gain / loss",
        cell: ({ row }) => (
          <span
            className={
              row.original.gain === null
                ? ""
                : row.original.gain >= 0
                  ? "text-[#32734d]"
                  : "text-[#ad423d]"
            }
          >
            {signedCurrency(row.original.gain)}
            <small className="mt-1 block text-xs">
              {percent(row.original.gainPercent)}
            </small>
          </span>
        ),
      },
      {
        id: "pe",
        accessorFn: (row) => row.fundamentals?.pe ?? undefined,
        header: "P/E",
        sortUndefined: "last",
        cell: ({ row }) => (
          <span
            title={
              row.original.fundamentals
                ? `Google Sheets · Read ${quoteTime(row.original.fundamentals.fetchedAt)} IST`
                : "Google Finance data unavailable"
            }
          >
            {row.original.fundamentals?.pe?.toFixed(2) ?? "—"}
            {row.original.fundamentals?.status === "stale" && (
              <small className="mt-1 block text-xs text-[#936016]">Stale</small>
            )}
          </span>
        ),
      },
      {
        id: "eps",
        accessorFn: (row) => row.fundamentals?.eps ?? undefined,
        header: "Latest earnings¹",
        sortUndefined: "last",
        cell: ({ row }) => (
          <span>
            {currency(row.original.fundamentals?.eps ?? null)}
            <small className="mt-1 block text-xs text-[#5e6855]">EPS</small>
          </span>
        ),
      },
    ],
    [],
  );
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const sorted = table.getRowModel().rows;
  const groups = grouped
    ? [...new Set(sorted.map((row) => row.original.sector))].map((sector) => ({
        sector,
        rows: sorted.filter((row) => row.original.sector === sector),
      }))
    : [{ sector: "", rows: sorted }];

  return (
    <div
      className="max-h-[530px] w-full overflow-auto [scrollbar-color:#cbd2c2_transparent] [scrollbar-width:thin] min-[581px]:max-h-[630px]"
      tabIndex={0}
      role="region"
      aria-label="Holdings table; scroll horizontally to see all columns"
    >
      <table className="w-full border-separate border-spacing-0 text-xs whitespace-nowrap tabular-nums">
        <caption className="sr-only">
          Portfolio holdings. Amounts in Indian rupees. Weight is based on
          invested cost.
        </caption>
        <thead className="sticky top-0 z-[3]">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th
                  className="border-y border-[#edf0e7] bg-[#f6f7f3] text-right text-[10px] font-medium text-[#5e6855] first:sticky first:left-0 first:z-[4] first:text-left"
                  key={header.id}
                  scope="col"
                  aria-sort={
                    header.column.getIsSorted() === "asc"
                      ? "ascending"
                      : header.column.getIsSorted() === "desc"
                        ? "descending"
                        : "none"
                  }
                >
                  <button
                    className={`flex items-center gap-[5px] py-[15px] text-inherit [&_svg]:size-[10px] ${header.column.id === "name" ? "mr-auto pr-[13px] pl-[17px] min-[581px]:pl-[25px]" : "ml-auto px-[13px]"}`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getIsSorted() === "asc" ? (
                      <ArrowUp />
                    ) : header.column.getIsSorted() === "desc" ? (
                      <ArrowDown />
                    ) : (
                      <ArrowsDownUp />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        {groups.map((group) => (
          <tbody key={group.sector}>
            {group.sector && (
              <tr className="bg-[#f0f3e9] text-left text-[#4d5d3f]">
                <th
                  className="bg-[#f0f3e9] px-[25px] py-3 text-left text-xs font-semibold text-[#4d5d3f]"
                  colSpan={columns.length}
                  scope="rowgroup"
                >
                  {group.sector}{" "}
                  <span className="ml-2 text-[11px] font-normal">
                    {group.rows.length} holdings
                  </span>
                </th>
              </tr>
            )}
            {group.rows.map((row) => (
              <tr key={row.id} className="group">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border-b border-[#eff1eb] bg-white px-[13px] py-[15px] text-right group-hover:bg-[#fafbf7] first:sticky first:left-0 first:z-[2] first:min-w-[171px] first:border-r first:border-[#f1f3ed] first:pl-[17px] first:text-left last:pr-[25px] min-[581px]:first:min-w-[205px] min-[581px]:first:pl-[25px]"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
      {!rows.length && (
        <div className="px-5 py-[55px] text-center text-[#697064]">
          <strong className="text-[17px] text-[#252a23]">
            No holdings match.
          </strong>
          <p className="mt-[10px]">
            Try another company name or choose a different sector.
          </p>
        </div>
      )}
    </div>
  );
}
