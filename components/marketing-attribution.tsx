"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/marketing-attribution";

export function MarketingAttributionTracker() {
  useEffect(() => { captureAttribution(); }, []);
  return null;
}
