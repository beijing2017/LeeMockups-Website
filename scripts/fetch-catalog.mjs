import { writeFile } from "node:fs/promises";

const url = "https://downloads.leemockups.com/catalog/products.json";
let lastError;
let prepared = false;
for (let attempt = 1; attempt <= 4; attempt++) {
  try {
    const response = await fetch(`${url}?build=${Date.now()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Catalog returned ${response.status}`);
    const catalog = await response.json();
    if (!Array.isArray(catalog?.products)) throw new Error("Invalid product catalog");
    await writeFile(".catalog-build.json", JSON.stringify(catalog));
    console.log(`Prepared ${catalog.products.length} mockups for this build.`);
    prepared = true;
    break;
  } catch (error) {
    lastError = error;
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
  }
}
if (!prepared) throw lastError;
