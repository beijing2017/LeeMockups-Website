import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { OrderDownloadClient } from "./order-download-client";

export const metadata: Metadata = {
  title: "Purchase Access",
  robots: { index: false, follow: true },
};

export default function OrderDownloadPage() {
  return <OrderDownloadClient navigation={<SiteNav current="order-download" />} />;
}
