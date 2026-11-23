"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/marketing-attribution";

export function MarketingAttributionTracker() {
  useEffect(() => { const capture=()=>{captureAttribution();}; capture(); window.addEventListener("leemockups-consent",capture); return ()=>window.removeEventListener("leemockups-consent",capture); }, []);
  return null;
}
