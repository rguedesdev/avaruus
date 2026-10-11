import type { Metadata } from "next";
import { Suspense } from "react";

import { SellerCenter } from "@/features/seller";

export const metadata: Metadata = { title: "Central do vendedor | Avaruus" };

export default function SellerPage() {
  return (
    <Suspense>
      <SellerCenter />
    </Suspense>
  );
}
