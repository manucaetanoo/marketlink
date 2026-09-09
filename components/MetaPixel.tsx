"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { isMetaPixelExcludedPath, trackMetaPageView } from "@/lib/meta-pixel";

export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const route = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    trackMetaPageView(route);
  }, [route]);

  if (isMetaPixelExcludedPath(pathname)) return null;

  return (
    <Script
      id="meta-pixel"
      src="https://connect.facebook.net/en_US/fbevents.js"
      strategy="afterInteractive"
    />
  );
}
