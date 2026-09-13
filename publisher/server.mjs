import http from "node:http";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { readRegistry, reserve, updateProduct, generateContent } from "./registry.mjs";
import { prepare } from "./media.mjs";

const html = fs.readFileSync(fileURLToPath(new URL("./ui.html", import.meta.url)), "utf8");
const port = Number(process.env.PUBLISHER_PORT || 4177);
const send = (res, code, body) => {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
};
http.createServer(async (req, res) => {
  const host = req.headers.host || "";
  const origin = req.headers.origin;
  if (!/^127\.0\.0\.1:\d+$/.test(host) || (origin && origin !== `http://${host}`)) return send(res, 403, { error: "Local access only" });
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(html);
    return;
  }
  if (req.url === "/api/products" && req.method === "GET") return send(res, 200, readRegistry());
  if (req.url !== "/api/action" || req.method !== "POST") return send(res, 404, { error: "Not found" });
  try {
    let raw = "";
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 100_000) throw new Error("Request too large.");
    }
    const { action, ...fields } = JSON.parse(raw);
    const result = action === "reserve" ? await reserve(fields.category)
      : action === "save" ? await updateProduct(fields.sku, fields.fields)
      : action === "content" ? await generateContent(fields.sku, fields.observations)
      : action === "prepare" ? await prepare(fields)
      : null;
    if (!result) throw new Error("Unknown action.");
    send(res, 200, { result });
  } catch (error) { send(res, 400, { error: error.message }); }
}).listen(port, "127.0.0.1", () => console.log(`LeeMockups Publisher: http://127.0.0.1:${port}`));
