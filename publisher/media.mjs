import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { root, transact } from "./registry.mjs";

const outputRoot = path.join(root, "publisher-output");
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";

function run(binary, args) {
  const result = spawnSync(binary, args, { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  if (result.error) throw new Error(`${binary} is unavailable. Set FFMPEG_PATH and FFPROBE_PATH.`);
  if (result.status !== 0) throw new Error((result.stderr || result.stdout).slice(-1500));
  return result.stdout;
}

function assertFile(file, sku, extension) {
  const absolute = path.resolve(String(file || ""));
  if (!fs.statSync(absolute, { throwIfNoEntry: false })?.isFile()) throw new Error(`Missing ${extension} file.`);
  if (path.extname(absolute).toLowerCase() !== extension || path.basename(absolute, extension) !== sku) {
    throw new Error(`Expected ${sku}${extension}.`);
  }
  return absolute;
}

function probeVideo(file) {
  const result = spawnSync(ffmpeg, ["-i", file], { encoding: "utf8" });
  if (result.error) throw new Error("FFmpeg is unavailable. Set FFMPEG_PATH.");
  const info = result.stderr || "";
  const size = /Video:.*?\b(\d{3,5})x(\d{3,5})\b/.exec(info);
  const time = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(info);
  const duration = time ? Number(time[1]) * 3600 + Number(time[2]) * 60 + Number(time[3]) : NaN;
  if (!size || Number(size[1]) !== 2000 || Number(size[2]) !== 2000 || !Number.isFinite(duration) || duration < 8 || duration > 15) {
    throw new Error("Source video must be 2000×2000 and roughly 10 seconds (8–15 seconds). ");
  }
}

function card(file, heading, steps) {
  const escape = (value) => value.replaceAll("\\", "\\\\").replaceAll(":", "\\:").replaceAll("'", "\\'");
  const filter = `drawtext=text='${escape(heading)}':fontsize=66:fontcolor=white:x=80:y=180,drawtext=text='${escape(steps)}':fontsize=34:fontcolor=white:x=80:y=320`;
  run(ffmpeg, ["-y", "-f", "lavfi", "-i", "color=c=0x292333:s=1000x1000", "-vf", filter, "-frames:v", "1", file]);
}

export async function prepare({ sku, mockupPath, videoPath, alternateImagePath }) {
  if (!/^LM-VM-[A-Z]{3}-\d{3}$/.test(sku)) throw new Error("Invalid SKU.");
  const mockup = assertFile(mockupPath, sku, ".mockup");
  const video = assertFile(videoPath, sku, ".mp4");
  const alternate = path.resolve(String(alternateImagePath || ""));
  if (!fs.statSync(alternate, { throwIfNoEntry: false })?.isFile() || !/\.(png|jpe?g)$/i.test(alternate)) {
    throw new Error("Provide one alternate artwork effect image (PNG or JPG).");
  }
  probeVideo(video);
  const registry = (await import("./registry.mjs")).readRegistry();
  const product = registry.products.find((item) => item.sku === sku);
  if (!product) throw new Error("Reserve this SKU in Publisher first.");
  const dir = path.join(outputRoot, sku);
  const web = path.join(dir, "web");
  const etsy = path.join(dir, "etsy-package");
  fs.mkdirSync(web, { recursive: true });
  fs.mkdirSync(etsy, { recursive: true });
  const thumb = `${sku}-thumb.webp`;
  const preview = `${sku}-preview.webm`;
  run(ffmpeg, ["-y", "-ss", "1", "-i", video, "-vf", "scale=500:500", "-frames:v", "1", "-quality", "82", path.join(web, thumb)]);
  run(ffmpeg, ["-y", "-i", video, "-an", "-vf", "scale=500:500,fps=24", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "40", "-deadline", "good", path.join(web, preview)]);
  run(ffmpeg, ["-y", "-ss", "1", "-i", video, "-vf", "scale=1000:1000", "-frames:v", "1", "-q:v", "3", path.join(etsy, `${sku}-etsy-01.jpg`)]);
  run(ffmpeg, ["-y", "-i", video, "-an", "-vf", "scale=1000:1000,fps=24", "-c:v", "libx264", "-crf", "22", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(etsy, `${sku}-etsy-video.mp4`)]);
  run(ffmpeg, ["-y", "-i", alternate, "-vf", "scale=1000:1000:force_original_aspect_ratio=decrease,pad=1000:1000:(ow-iw)/2:(oh-ih)/2:white", "-frames:v", "1", "-q:v", "3", path.join(etsy, `${sku}-etsy-02.jpg`)]);
  card(path.join(etsy, `${sku}-etsy-03.png`), "ADD YOUR DESIGN", "Open mockup  >  Replace artwork  >  Preview");
  card(path.join(etsy, `${sku}-etsy-04.png`), "CREATE YOUR VIDEO", "Load mockup  >  Add design  >  Export");
  fs.copyFileSync(mockup, path.join(etsy, `${sku}.mockup`));
  fs.writeFileSync(path.join(etsy, "LISTING.txt"), `${product.content?.etsyTitle || product.fullName}\n\n${product.content?.etsyDescription || "Review and approve content in Publisher."}\n\nTAGS\n${(product.content?.tags || []).join(", ")}\n`);
  fs.writeFileSync(path.join(dir, "upload-manifest.json"), JSON.stringify({
    assetBaseUrl: process.env.ASSET_BASE_URL || "",
    webAssets: [thumb, preview].map((file) => ({ local: `web/${file}`, r2Key: `mockups/${sku}/${file}` })),
    note: "Upload web assets to your own Cloudflare R2 bucket before setting PUBLISHED. Test source is not final.",
  }, null, 2));
  await transact((data) => {
    const row = data.products.find((item) => item.sku === sku);
    row.thumbnailPath = `mockups/${sku}/${thumb}`;
    row.previewPath = `mockups/${sku}/${preview}`;
    row.status = "READY";
    row.sourceIsFinal = false;
    row.webAssetsUploaded = false;
  });
  return { directory: dir, webAssets: [thumb, preview], etsyPackage: etsy, status: "READY" };
}
