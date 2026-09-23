"use client";

import { useSearchParams } from "next/navigation";
import { MockupDetailClient } from "./mockup-detail-client";

export function MockupQueryClient() {
  const sku = useSearchParams().get("sku") || "";
  return <MockupDetailClient sku={sku} />;
}
