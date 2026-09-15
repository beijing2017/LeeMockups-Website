import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { root, transact } from "./registry.mjs";

export async function uploadWebsiteAssets(sku) {
  const bucket = String(process.env.R2_BUCKET || "").trim();
  if (!bucket) throw new Error("Set R2_BUCKET before uploading.");
  const wrangler = process.env.WRANGLER_PATH || (process.platform === "win32" ? "npx.cmd" : "npx");
  const prefix = process.env.WRANGLER_PATH ? [] : ["wrangler"];
  const productDir = path.join(root, "publisher-output", sku);
  const manifestPath = path.join(productDir, "upload-manifest.json");
  if (!fs.statSync(manifestPath, { throwIfNoEntry: false })?.isFile()) throw new Error("Generate assets before uploading.");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const asset of manifest.webAssets) {
    const local = path.join(productDir, asset.local);
    const contentType = asset.r2Key.endsWith(".webm") ? "video/webm" : "image/webp";
    const result = spawnSync(wrangler, [...prefix, "r2", "object", "put", `${bucket}/${asset.r2Key}`, "--file", local, "--content-type", contentType, "--remote"], { encoding: "utf8", windowsHide: true });
    if (result.error) throw new Error(`Cannot start Wrangler: ${result.error.message}`);
    if (result.status !== 0) throw new Error((result.stderr || result.stdout).slice(-2000));
  }
  await transact((registry) => {
    const product = registry.products.find((item) => item.sku === sku);
    if (!product) throw new Error("Unknown SKU.");
    product.webAssetsUploaded = true;
  });
  return { sku, bucket, uploaded: manifest.webAssets.map((asset) => asset.r2Key) };
}
