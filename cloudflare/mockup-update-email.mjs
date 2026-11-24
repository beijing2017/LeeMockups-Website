const site = "https://www.leemockups.com";
const assets = "https://downloads.leemockups.com";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function productImage(product) {
  const galleryImage = product.gallery?.find((item) => item.type === "image" && /\.(jpe?g|png)$/i.test(item.path || ""));
  const path = galleryImage?.path || product.thumbnailPath;
  return typeof path === "string" && /^mockups\/LM-VM-[A-Z]{3}-\d{3}\/[A-Za-z0-9/_-]+\.(?:jpe?g|png|webp)$/i.test(path)
    ? `${assets}/${path}` : "";
}

export function renderMockupUpdateEmail(products, unsubscribeUrl) {
  const cards = products.map((product) => {
    const name = escapeHtml(String(product.name || product.sku).slice(0, 120));
    const url = `${site}/mockup/${encodeURIComponent(product.sku)}/`;
    const image = productImage(product);
    const picture = image
      ? `<img src="${escapeHtml(image)}" width="116" height="116" alt="${name}" style="display:block;width:116px;height:116px;object-fit:cover;border:0;border-radius:12px;background:#f3eff8">`
      : `<div style="width:116px;height:116px;border-radius:12px;background:#f3eff8"></div>`;
    return `<tr><td style="padding:0 0 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eae5f0;border-radius:16px;background:#ffffff"><tr><td width="116" valign="top" style="padding:12px">${picture}</td><td valign="middle" style="padding:12px 18px 12px 0"><div style="font:700 16px/1.35 Arial,sans-serif;color:#24212c">${name}</div><div style="padding-top:7px;font:13px/1.45 Arial,sans-serif;color:#766f7d">Create a video and 5 matching stills</div><div style="padding-top:14px"><a href="${url}" style="font:700 13px Arial,sans-serif;color:#7951e9;text-decoration:none">View mockup &rarr;</a></div></td></tr></table></td></tr>`;
  }).join("");
  const count = products.length;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>New LeeMockups mockups</title></head><body style="margin:0;padding:0;background:#f6f3fa;color:#24212c"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${count} new video ${count === 1 ? "mockup" : "mockups"} for your next product listing.</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3fa"><tr><td align="center" style="padding:32px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #eae5f0;border-radius:20px"><tr><td style="padding:28px 32px 20px;border-bottom:1px solid #f0edf3"><a href="${site}/" style="text-decoration:none;color:#24212c"><img src="${site}/leemockups-symbol.png" width="30" height="30" alt="" style="display:inline-block;vertical-align:middle;border:0"><span style="display:inline-block;vertical-align:middle;padding-left:10px;font:800 20px Arial,sans-serif;letter-spacing:-.5px">LeeMockups</span></a></td></tr><tr><td style="padding:34px 32px 8px"><div style="font:700 11px Arial,sans-serif;letter-spacing:2px;color:#7951e9">FRESH IN THE MOCKUP LIBRARY</div><h1 style="margin:12px 0 12px;font:800 30px/1.2 Arial,sans-serif;letter-spacing:-.8px;color:#24212c">New looks for your next listing.</h1><p style="margin:0 0 24px;font:15px/1.65 Arial,sans-serif;color:#696371">Add your artwork in your browser, then create a product video and matching still images. Here ${count === 1 ? "is the latest mockup" : "are the latest mockups"}:</p></td></tr><tr><td style="padding:0 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cards}</table></td></tr><tr><td style="padding:12px 32px 34px"><a href="${site}/mockups/" style="display:inline-block;padding:14px 24px;border-radius:10px;background:#7951e9;color:#ffffff;text-decoration:none;font:700 14px Arial,sans-serif">Browse all mockups &rarr;</a></td></tr><tr><td style="padding:22px 32px 28px;border-top:1px solid #f0edf3;font:12px/1.6 Arial,sans-serif;color:#8c8592">You received this email because you subscribed to LeeMockups product updates.<br><a href="${escapeHtml(unsubscribeUrl)}" style="color:#766f7d;text-decoration:underline">Unsubscribe</a> anytime.</td></tr></table></td></tr></table></body></html>`;
}
