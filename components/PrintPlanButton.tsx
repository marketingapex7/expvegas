"use client";

import { Printer } from "lucide-react";

export function PrintPlanButton({ theme = "light" }: { theme?: "light" | "dark" }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-black transition ${
        theme === "dark"
          ? "border-white/15 text-white hover:bg-white/10"
          : "border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-100"
      }`}
    >
      <Printer className="h-4 w-4" /> Save as PDF
    </button>
  );
}
