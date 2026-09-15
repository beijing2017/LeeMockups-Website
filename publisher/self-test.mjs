import assert from "node:assert/strict";
import { readRegistry, validateRegistry } from "./registry.mjs";
import { draftContent } from "./content.mjs";

const registry = readRegistry();
const report = validateRegistry(registry);
for (let number = 1; number <= 5; number += 1) {
  assert.ok(registry.products.some((product) => product.sku === `LM-VM-MUG-${String(number).padStart(3, "0")}`));
}
const used = registry.products.filter((product) => product.sku.startsWith("LM-VM-MUG-")).map((product) => Number(product.sku.slice(-3)));
assert.equal(`LM-VM-MUG-${String(Math.max(...used) + 1).padStart(3, "0")}`, "LM-VM-MUG-006");
const content = draftContent(registry.products[0], { object: "mug", color: "black", motion: "floating", scene: "studio", style: "modern" });
assert.equal(content.tags.length, 13);
assert.ok(content.tags.every((tag) => tag.length <= 20));
console.log(JSON.stringify({ ...report, preserved: "LM-VM-MUG-001..005", nextSku: "LM-VM-MUG-006", etsyTags: content.tags.length }));
