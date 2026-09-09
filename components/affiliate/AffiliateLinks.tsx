"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowTopRightOnSquareIcon, ClipboardDocumentIcon, ShareIcon } from "@heroicons/react/24/solid";

type AffiliateLink = { id: string; name: string; href: string; productHref: string; clicks: number; active: boolean };
const actionClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#e3e5df] bg-white px-3 py-2 text-sm font-semibold text-[#181917] transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600";

function LinkActions({ link }: { link: AffiliateLink }) {
  const [message, setMessage] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  function getUrl() { return new URL(link.href, window.location.origin).href; }
  async function copy() {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
      setManualUrl("");
      setMessage("Enlace copiado. Ya podés compartirlo.");
    } catch {
      setManualUrl(url);
      setMessage("Seleccioná y copiá el enlace de abajo.");
    }
  }
  async function share() {
    if (!navigator.share) { await copy(); return; }
    try {
      await navigator.share({ title: link.name, url: getUrl() });
      setMessage("Enlace compartido.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setManualUrl(getUrl());
      setMessage("Podés copiar el enlace y compartirlo manualmente.");
    }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={actionClass}><ClipboardDocumentIcon className="size-4 shrink-0" aria-hidden="true" />Copiar enlace</button>
        <button type="button" onClick={share} className={actionClass}><ShareIcon className="size-4 shrink-0" aria-hidden="true" />Compartir</button>
        <Link href={link.productHref} className={actionClass}>Ver producto<ArrowTopRightOnSquareIcon className="size-4 shrink-0" aria-hidden="true" /></Link>
      </div>
      <p role="status" className="mt-2 text-xs text-[#62645f]">{message}</p>
      {manualUrl && <input aria-label={`Enlace para compartir ${link.name}`} value={manualUrl} readOnly onFocus={event => event.currentTarget.select()} className="mt-2 w-full rounded-lg border border-orange-200 bg-white p-3 text-sm" />}
    </div>
  );
}

export default function AffiliateLinks({ links, periodLabel }: { links: AffiliateLink[]; periodLabel: string }) {
  const [visible, setVisible] = useState(6);
  if (!links.length) return (
    <div className="rounded-2xl border border-dashed border-orange-200 bg-[#fff8f1] p-6 sm:p-8">
      <h3 className="text-xl font-semibold">Tu primer enlace empieza acá</h3>
      <ol className="mt-4 grid gap-3 text-sm text-[#62645f] sm:grid-cols-3"><li>1. Elegí un producto que quieras recomendar.</li><li>2. Generá tu enlace desde el producto.</li><li>3. Compartilo con tu audiencia.</li></ol>
      <Link href="/products" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#f96f08] px-5 py-3 text-sm font-semibold text-[#181917]">Elegir mi primer producto</Link>
    </div>
  );
  return (
    <div>
      <div className="grid gap-4 xl:grid-cols-2">
        {links.slice(0, visible).map(link => <article key={link.id} className="min-w-0 rounded-2xl border border-[#e3e5df] bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-4"><div className="min-w-0"><h3 className="break-words font-semibold">{link.name}</h3><p className="mt-1 text-xs text-[#62645f]">{link.active ? "Listo para compartir" : "Producto no disponible"}</p></div><p className="shrink-0 text-right text-sm font-semibold">{link.clicks.toLocaleString("es-UY")} clics<span className="mt-1 block text-[11px] font-normal text-[#62645f]">{periodLabel}</span></p></div>
          <LinkActions link={link} />
        </article>)}
      </div>
      {visible < links.length && <button type="button" onClick={() => setVisible(count => count + 6)} className={`${actionClass} mt-4`}>Ver más enlaces ({links.length - visible})</button>}
    </div>
  );
}
