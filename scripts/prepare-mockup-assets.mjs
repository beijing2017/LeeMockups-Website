import { spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const skuPattern = /^LM-VM-[A-Z]+-\d{3,}$/;
const options = parseArgs(process.argv.slice(2));
const ffmpeg = options.ffmpeg || process.env.FFMPEG_PATH || "ffmpeg";
const outputRoot = path.resolve(options.output || "mockup-assets");
const maxBytes = Math.round(Number(options.maxKb || 800) * 1024);

if (!Number.isFinite(maxBytes) || maxBytes < 100 * 1024) fail("--max-kb must be at least 100");
if (options.watch) {
  await watchFolder(path.resolve(options.watch));
} else {
  if (!options.input || !options.sku) fail("Provide --input <video.mp4> and --sku <SKU>, or --watch <folder>");
  await prepare(path.resolve(options.input), options.sku);
}

function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    if (!key?.startsWith("--") || !args[index + 1]) fail(`Invalid argument: ${key || "(missing)"}`);
    result[key.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = args[index + 1];
  }
  return result;
}

function fail(message) { throw new Error(message); }

async function run(args, { capture = false } = {}) {
  return await new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, args, { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); if (stderr.length > 12000) stderr = stderr.slice(-12000); });
    child.on("error", (error) => reject(new Error(`Cannot start FFmpeg (${ffmpeg}): ${error.message}`)));
    child.on("close", (code) => code === 0 ? resolve(capture ? stderr : undefined) : reject(new Error(`FFmpeg exited ${code}:\n${stderr.slice(-2500)}`)));
  });
}

async function durationSeconds(input) {
  const metadata = await run(["-hide_banner", "-i", input], { capture: true }).catch((error) => error.message);
  const match = metadata.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) fail(`Cannot read video duration: ${input}`);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

async function encode(input, destination, format, quality) {
  const base = ["-hide_banner", "-loglevel", "error", "-y", "-i", input, "-t", "10", "-an", "-vf", "fps=15,scale=500:500:flags=lanczos,format=yuv420p"];
  const codec = format === "webm"
    ? ["-c:v", "libvpx-vp9", "-deadline", "good", "-cpu-used", "4", "-crf", String(quality), "-b:v", "0"]
    : ["-c:v", "libx264", "-preset", "medium", "-crf", String(quality), "-movflags", "+faststart"];
  await run([...base, ...codec, destination]);
  return (await stat(destination)).size;
}

async function bestUnderLimit(input, temp, format) {
  const range = format === "webm" ? [24, 63] : [20, 45];
  let [low, high] = range;
  let best = null;
  while (low <= high) {
    const quality = Math.floor((low + high) / 2);
    const file = path.join(temp, `trial-${format}-${quality}.${format}`);
    const bytes = await encode(input, file, format, quality);
    if (bytes <= maxBytes) { best = { file, bytes, quality }; high = quality - 1; }
    else { low = quality + 1; }
  }
  if (!best) fail(`${format.toUpperCase()} cannot fit under ${Math.round(maxBytes / 1024)} KB at 500×500/15 fps; raise --max-kb or inspect the source.`);
  return best;
}

async function prepare(input, sku) {
  if (!skuPattern.test(sku)) fail(`Invalid SKU: ${sku}`);
  const duration = await durationSeconds(input);
  if (duration < 9.5) fail(`Source is only ${duration.toFixed(2)} seconds; expected approximately 10 seconds.`);
  const destination = path.join(outputRoot, sku);
  await mkdir(destination, { recursive: true });
  const temp = await mkdtemp(path.join(tmpdir(), "leemockups-preview-"));
  try {
    const thumbnail = path.join(temp, "thumbnail.webp");
    await run(["-hide_banner", "-loglevel", "error", "-y", "-i", input, "-frames:v", "1", "-vf", "scale=500:500:flags=lanczos", "-quality", "82", thumbnail]);
    const webm = await bestUnderLimit(input, temp, "webm");
    const mp4 = await bestUnderLimit(input, temp, "mp4");
    await copyFile(thumbnail, path.join(destination, "thumbnail.webp"));
    await copyFile(webm.file, path.join(destination, "preview.webm"));
    await copyFile(mp4.file, path.join(destination, "preview.mp4"));
    console.log(`${sku}: thumbnail.webp, preview.webm ${(webm.bytes / 1024).toFixed(0)} KB (CRF ${webm.quality}), preview.mp4 ${(mp4.bytes / 1024).toFixed(0)} KB (CRF ${mp4.quality}) → ${destination}`);
  } finally { await rm(temp, { recursive: true, force: true }); }
}

async function watchFolder(folder) {
  console.log(`Watching ${folder} for completed <SKU>.mp4 renders. Output: ${outputRoot}`);
  const observed = new Map();
  let busy = false;
  async function scan() {
    if (busy) return;
    busy = true;
    try {
      for (const entry of await readdir(folder)) {
        const match = entry.match(/^(LM-VM-[A-Z]+-\d{3,})\.mp4$/i);
        if (!match) continue;
        const sku = match[1].toUpperCase();
        const input = path.join(folder, entry);
        const info = await stat(input);
        const signature = `${info.size}:${info.mtimeMs}`;
        const prior = observed.get(input);
        const stable = prior?.signature === signature ? prior.stable + 1 : 0;
        if (stable >= 2 && !prior?.processed) {
          try { await prepare(input, sku); observed.set(input, { signature, stable, processed: true }); }
          catch (error) { console.error(`${entry}: ${error.message}`); observed.set(input, { signature, stable, processed: true }); }
        } else observed.set(input, { signature, stable, processed: prior?.processed && prior.signature === signature });
      }
    } catch (error) { console.error(error.message); }
    finally { busy = false; }
  }
  await scan();
  setInterval(scan, 3000);
}
