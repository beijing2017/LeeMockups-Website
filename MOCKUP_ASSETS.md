# Mockup assets

The product catalog lives in `lib/products.ts`. `LM-VM-MUG-001` is registered as a DRAFT, with a permanent internal ID and SKU. Do not reuse a SKU after withdrawing a product. `nextSku()` suggests the next number and `assertUniqueProduct()` rejects an existing ID or SKU. These helpers are for future Publisher integration; concurrent creation will need a transactional database constraint.

Set the GitHub Actions repository variable `ASSET_BASE_URL` to the public Cloudflare asset origin, such as `https://assets.leemockups.com`; the Pages build passes it through as `NEXT_PUBLIC_ASSET_BASE_URL`. Keep product asset fields as paths below `/mockups/<SKU>/`; do not place Etsy media URLs in those fields. The expected first-product keys are:

- `/mockups/LM-VM-MUG-001/thumbnail.webp` — static square thumbnail, ideally 500 × 500.
- `/mockups/LM-VM-MUG-001/preview.webm` — full approximately 10-second 500 × 500 muted hover preview.
- `/mockups/LM-VM-MUG-001/preview.mp4` — H.264 fallback of the same full preview.

Upload the assets to Cloudflare, confirm their public URLs and CORS policy, then fill `thumbnailPath`, `previewPath`, and `previewMp4Path` in the product record and set `NEXT_PUBLIC_ASSET_BASE_URL` in the site build environment. Set status to READY when assets have been verified. After the Etsy listing is live, fill `etsyUrl`, set `purchaseProvider` to `etsy`, and set status to PUBLISHED. The site only displays a Buy on Etsy link for a PUBLISHED record with both values. No detail page or checkout is enabled.

The card retains a static thumbnail until hovered or focused; only then is the video element mounted. WebM is tried first and MP4 is the fallback. A missing asset keeps the card in a graceful "coming soon" state.

## Automatic conversion after rendering

The source render can stay at 2000 × 2000. Install or point to FFmpeg, then run `npm run prepare:mockup -- --input "C:\\renders\\LM-VM-MUG-001.mp4" --sku LM-VM-MUG-001 --output "C:\\mockup-assets" --ffmpeg "C:\\path\\to\\ffmpeg.exe"`. This creates `thumbnail.webp`, `preview.webm`, and `preview.mp4` in `C:\\mockup-assets\\LM-VM-MUG-001\\` without changing the source.

For hands-free processing, leave `npm run prepare:mockup -- --watch "C:\\renders" --output "C:\\mockup-assets" --ffmpeg "C:\\path\\to\\ffmpeg.exe"` running. Export each finished render as `<SKU>.mp4`, for example `LM-VM-MUG-001.mp4`. The watcher waits until the file stops growing, then converts it once. If a render is replaced, the changed file is processed again. The default ceiling is 800 KB **per video file**; change it with `--max-kb 600`, for example. FFmpeg searches multiple quality levels and retains the best version below the ceiling. It reports an error if a specific video cannot meet the limit; the 2000 × 2000 original is never modified.

Preview files are generated at 500 × 500, 15 fps, up to 10 seconds, with no audio. The first frame becomes the static thumbnail. Review visual quality before uploading to Cloudflare, because high-motion footage may need a higher size limit.
