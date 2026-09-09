"use client";

import { usePathname } from "next/navigation";
import { isMetaPixelExcludedPath, META_PIXEL_ID } from "@/lib/meta-pixel";

// usePathname also resolves during server rendering. Keep this outside the
// searchParams Suspense boundary so static HTML includes the noscript beacon.
export default function MetaPixelNoscript() {
  const pathname = usePathname();
  if (isMetaPixelExcludedPath(pathname)) return null;

  return (
    <noscript>
      {/* A tracking beacon must bypass next/image optimization. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        alt=""
        referrerPolicy="no-referrer"
        src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
      />
    </noscript>
  );
}
