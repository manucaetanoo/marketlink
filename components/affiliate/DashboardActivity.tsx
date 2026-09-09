"use client";

import { useState } from "react";

type Activity = { id: string; title: string; detail: string; amount: string; status: string; label: string };
export default function DashboardActivity({ items, empty }: { items: Activity[]; empty: string }) {
  const [visible, setVisible] = useState(8);
  if (!items.length) return <p className="py-6 text-sm leading-6 text-[#62645f]">{empty}</p>;
  return <div>
    <ul className="divide-y divide-[#e3e5df]">{items.slice(0, visible).map(item => <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
      <div className="min-w-0 flex-1 basis-40"><p className="break-words text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-[#62645f]">{item.detail}</p></div>
      <div className="text-right"><p className="text-sm font-semibold">{item.amount}</p><span className={`mt-1 inline-block text-xs ${item.status === "CANCELED" || item.status === "REJECTED" ? "text-red-700" : item.status === "PAID" || item.status === "APPROVED" ? "text-emerald-700" : "text-amber-800"}`}>{item.label}</span></div>
    </li>)}</ul>
    {visible < items.length && <button type="button" onClick={() => setVisible(count => count + 8)} className="mt-4 min-h-11 rounded-lg border border-[#e3e5df] px-4 py-2 text-sm font-semibold hover:bg-orange-50">Ver más ({items.length - visible})</button>}
  </div>;
}
