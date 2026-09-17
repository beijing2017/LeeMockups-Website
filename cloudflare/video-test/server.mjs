import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const maxBytes = 15 * 1024 * 1024;

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
