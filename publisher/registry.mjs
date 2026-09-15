import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { composeDescription, draftContent } from "./content.mjs";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const registryPath = path.join(root, "data", "products.json");
const skuPattern = /^LM-VM-([A-Z]{3})-(\d{3})$/;
let queue = Promise.resolve();

export function readRegistry() {
  const data = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  if (data.version !== 1 || !Array.isArray(data.products)) throw new Error("Invalid product registry");
  return data;
}

export function transact(change) {
  const action = queue.then(async () => {
    const registry = readRegistry();
    const result = await change(registry);
    const temporary = `${registryPath}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(registry, null, 2)}\n`, { flag: "wx" });
    fs.renameSync(temporary, registryPath);
    return result;
  });
  queue = action.catch(() => {});
  return action;
}

export async function reserve(category) {
  const code = String(category || "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw new Error("Category must be a three-letter code, such as MUG.");
  return transact((registry) => {
    const used = registry.products.flatMap((product) => {
      const match = skuPattern.exec(product.sku);
      return match?.[1] === code ? [Number(match[2])] : [];
    });
    const number = Math.max(0, ...used) + 1;
    if (number > 999) throw new Error("SKU range exhausted.");
    const sku = `LM-VM-${code}-${String(number).padStart(3, "0")}`;
    const product = {
      sku, displayName: "", fullName: "", category: code, type: "VM",
      motion: "", color: "", scene: "", style: "", status: "DRAFT",
      thumbnailPath: "", previewPath: "", etsyUrl: "", purchaseProvider: "ETSY",
      primaryKeyword: "", keywords: [], detailPageEnabled: false,
      sourceIsFinal: false, webAssetsUploaded: false, content: null,
    };
    registry.products.push(product);
    return product;
  });
}

export async function updateProduct(sku, fields) {
  return transact((registry) => {
    const product = registry.products.find((item) => item.sku === sku);
    if (!product) throw new Error("Unknown SKU. Reserve it in Publisher first.");
    const allowed = ["displayName", "fullName", "motion", "color", "scene", "style", "etsyUrl", "primaryKeyword", "keywords", "sourceIsFinal", "webAssetsUploaded", "content"];
    for (const key of allowed) if (Object.hasOwn(fields, key)) product[key] = fields[key];
    if (product.content) product.content.etsyDescription = composeDescription(product.content.variableDescription || "");
    if (Object.hasOwn(fields, "content") && product.content) {
      product.keywords = product.content.websiteKeywords || [];
      product.primaryKeyword = product.keywords[0] || product.primaryKeyword;
    }
    if (fields.status) {
      if (!["DRAFT", "READY", "PUBLISHED", "ARCHIVED"].includes(fields.status)) throw new Error("Invalid status.");
      if (fields.status === "PUBLISHED" && (!product.sourceIsFinal || !product.webAssetsUploaded || !product.thumbnailPath || !product.previewPath)) {
        throw new Error("Publishing requires final source confirmation and uploaded web assets.");
      }
      product.status = fields.status;
    }
    return product;
  });
}

export async function generateContent(sku, observations) {
  return transact((registry) => {
    const product = registry.products.find((item) => item.sku === sku);
    if (!product) throw new Error("Unknown SKU.");
    product.content = draftContent(product, observations);
    return product.content;
  });
}

export function validateRegistry(registry = readRegistry()) {
  const seen = new Set();
  for (const product of registry.products) {
    if (!skuPattern.test(product.sku)) throw new Error(`Invalid SKU: ${product.sku}`);
    if (seen.has(product.sku)) throw new Error(`Duplicate SKU: ${product.sku}`);
    seen.add(product.sku);
    if (!['DRAFT', 'READY', 'PUBLISHED', 'ARCHIVED'].includes(product.status)) throw new Error(`Invalid status: ${product.sku}`);
    if (product.content?.tags && product.content.tags.length !== 13) throw new Error(`${product.sku} must have exactly 13 Etsy tags.`);
  }
  return { products: registry.products.length, uniqueSkus: seen.size };
}
