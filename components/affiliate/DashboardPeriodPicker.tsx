"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { dashboardPeriods } from "@/lib/affiliate-dashboard";

export default function DashboardPeriodPicker({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="dashboard-period" className="text-sm font-medium text-[#62645f]">Ver actividad de</label>
      <select id="dashboard-period" value={value} disabled={pending} aria-describedby="period-scope" onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        next.set("period", event.target.value);
        startTransition(() => router.push(`${pathname}?${next.toString()}${window.location.hash}`, { scroll: false }));
      }} className="min-h-11 rounded-xl border border-[#e3e5df] bg-white px-4 py-2 text-sm font-semibold text-[#181917] focus:outline-2 focus:outline-orange-600 disabled:opacity-60">
        {dashboardPeriods.map(period => <option key={period.value} value={period.value}>{period.label}</option>)}
      </select>
      <span role="status" className="text-xs text-[#62645f]">{pending ? "Actualizando actividad…" : ""}</span>
    </div>
  );
}
