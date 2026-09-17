import { Container, getContainer } from '@cloudflare/containers';

export class VideoRenderer extends Container {
  defaultPort = 8080;
  sleepAfter = '2m';
}

type Env = { VIDEO_RENDERER: DurableObjectNamespace<VideoRenderer> };

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (url.pathname === '/health') {
      return Response.json({ ok: true, service: 'leemockups-video-test', isolated: true }, { headers: cors });
    }
    if (url.pathname !== '/render' || request.method !== 'POST') {
      return Response.json({ ok: false, error: 'POST a PNG or JPG to /render.' }, { status: 404, headers: cors });
    }
    const contentType = request.headers.get('content-type') || '';
    if (!/^image\/(png|jpeg)/i.test(contentType)) {
      return Response.json({ ok: false, error: 'Only PNG and JPG are accepted.' }, { status: 415, headers: cors });
    }
    const length = Number(request.headers.get('content-length') || 0);
    if (length > 15 * 1024 * 1024) {
      return Response.json({ ok: false, error: 'Image must be 15 MB or smaller.' }, { status: 413, headers: cors });
    }
    const container = getContainer(env.VIDEO_RENDERER, 'fixed-fps-test');
    const response = await container.fetch(new Request('http://container/render', {
      method: 'POST', headers: { 'content-type': contentType }, body: request.body,
    }));
    const headers = new Headers(response.headers);
    Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
    headers.set('cache-control', 'no-store');
    return new Response(response.body, { status: response.status, headers });
  },
} satisfies ExportedHandler<Env>;
