"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto my-[20vh] max-w-[700px] p-[30px]">
      <h1 className="text-[clamp(29px,3vw,42px)] leading-[1.15] font-medium tracking-[-1.7px]">
        Something interrupted your portfolio.
      </h1>
      <p className="py-5">
        Your original workbook is safe. Try loading the dashboard again.
      </p>
      <button
        className="rounded-[20px] bg-[#252a23] px-5 py-3 text-white"
        onClick={reset}
      >
        Try again
      </button>
    </main>
  );
}
