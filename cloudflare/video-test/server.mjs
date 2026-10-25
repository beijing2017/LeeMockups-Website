import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createDecipheriv, hkdfSync, randomUUID } from 'node:crypto';

const maxBytes = 15 * 1024 * 1024;
const maxMockupBytes = 80 * 1024 * 1024;
const magic = Buffer.from('LMOFFLINE1');
const seed = Buffer.from('9146ab07d3e91258fceb60411df97042a8573cb9e02d65f71498a3be602fcd85', 'hex');
const jobs = new Map();

function decryptMockup(bytes) {
  if (!bytes.subarray(0, magic.length).equals(magic)) return bytes;
  if (bytes.length < 54) throw new Error('Mockup package is incomplete');
  const salt = bytes.subarray(10, 26);
  const iv = bytes.subarray(26, 38);
  const tag = bytes.subarray(38, 54);
  const ciphertext = bytes.subarray(54);
  const key = Buffer.from(hkdfSync('sha256', seed, salt, Buffer.from('LeeMockups offline v1'), 32));
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(magic);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let error = '';
    child.stderr.on('data', (chunk) => { error += chunk.toString(); if (error.length > 12000) error = error.slice(-12000); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg exited ${code}: ${error}`)));
  });
}

createServer(async (request, response) => {
  if (request.method === 'GET' && request.url?.startsWith('/jobs/base-test/')) {
    const [, , , jobId, action] = request.url.split('/');
    const job = jobs.get(jobId);
    if (!job) {
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'Job not found' }));
      return;
    }
    if (action === 'video') {
      if (job.status !== 'complete') {
        response.writeHead(409, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ error: 'Video is not ready', status: job.status }));
        return;
      }
      const video = await readFile(job.output);
      response.writeHead(200, {'content-type':'video/mp4','content-length':String(video.length),'content-disposition':'attachment; filename="LeeMockups-real-base-cloud.mp4"','x-video-frames':'300','x-video-fps':'30'});
      response.end(video);
      return;
    }
    response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify({ id: jobId, status: job.status, startedAt: job.startedAt, completedAt: job.completedAt || null, error: job.error || null }));
    return;
  }
  if (request.method === 'POST' && request.url === '/jobs/base-test') {
    const chunks = []; let size = 0;
    try {
      for await (const chunk of request) { size += chunk.length; if (size > maxMockupBytes) throw new Error('Mockup is larger than 80 MB'); chunks.push(chunk); }
      const folder = await mkdtemp(join(tmpdir(), 'leemockups-real-'));
      const archive = join(folder, 'mockup.zip');
      const extracted = join(folder, 'package');
      const output = join(folder, 'real-base-fixed-30fps.mp4');
      await writeFile(archive, decryptMockup(Buffer.concat(chunks)));
      await run('unzip', ['-q', archive, '-d', extracted]);
      const manifest = JSON.parse(await readFile(join(extracted, 'manifest.json'), 'utf8'));
      const base = join(extracted, manifest.layers?.base || manifest.layers?.white || 'base-layer.mp4');
      const jobId = randomUUID();
      const job = { status: 'processing', folder, output, startedAt: new Date().toISOString() };
      jobs.set(jobId, job);
      void (async () => {
        try {
          await run('ffmpeg', ['-y','-i',base,'-an','-vf','fps=30,scale=2000:2000:flags=lanczos','-t','10','-r','30','-frames:v','300','-c:v','libx264','-threads','2','-crf','16','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',output]);
          job.status = 'complete';
          job.completedAt = new Date().toISOString();
        } catch (error) {
          job.status = 'failed';
          job.error = error instanceof Error ? error.message : String(error);
          job.completedAt = new Date().toISOString();
          await rm(folder, { recursive: true, force: true });
        }
      })();
      response.writeHead(202, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      response.end(JSON.stringify({ id: jobId, status: job.status }));
    } catch (error) {
      response.writeHead(500, { 'content-type': 'application/json' }); response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    }
    return;
  }
  if (request.method !== 'POST' || request.url !== '/render') {
    response.writeHead(404, { 'content-type': 'application/json' }); response.end(JSON.stringify({ ok: false })); return;
  }
  const contentType = request.headers['content-type'] || '';
  if (!/^image\/(png|jpeg)/i.test(contentType)) {
    response.writeHead(415, { 'content-type': 'application/json' }); response.end(JSON.stringify({ error: 'PNG or JPG required' })); return;
  }
  const chunks = []; let size = 0;
  try {
    for await (const chunk of request) { size += chunk.length; if (size > maxBytes) throw new Error('Image is larger than 15 MB'); chunks.push(chunk); }
    const folder = await mkdtemp(join(tmpdir(), 'leemockups-'));
    const input = join(folder, contentType.includes('jpeg') ? 'art.jpg' : 'art.png');
    const output = join(folder, 'cloud-fixed-30fps.mp4');
    try {
      await writeFile(input, Buffer.concat(chunks));
      await run('ffmpeg', ['-y','-loop','1','-i',input,'-f','lavfi','-i','color=c=0x26232b:s=2000x2000:r=30:d=10',
        '-filter_complex',"[0:v]scale=1500:1500:force_original_aspect_ratio=decrease,pad=1500:1500:(ow-iw)/2:(oh-ih)/2:color=white[art];[1:v][art]overlay=x='250+80*sin(2*PI*t/10)':y='250+45*cos(2*PI*t/10)':shortest=1,format=yuv420p[out]",
        '-map','[out]','-t','10','-r','30','-frames:v','300','-c:v','libx264','-preset','medium','-crf','18','-movflags','+faststart',output]);
      const video = await readFile(output);
      response.writeHead(200, {'content-type':'video/mp4','content-length':String(video.length),'content-disposition':'attachment; filename="LeeMockups-cloud-fixed-30fps.mp4"','x-video-frames':'300','x-video-fps':'30'});
      response.end(video);
    } finally { await rm(folder, { recursive: true, force: true }); }
  } catch (error) {
    response.writeHead(500, { 'content-type': 'application/json' }); response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
  }
}).listen(Number(process.env.PORT || 8080), '0.0.0.0');
