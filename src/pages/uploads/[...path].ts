import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { getUploadsDir } from '../../lib/upload-handler';

export const prerender = false;

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

export const GET: APIRoute = async ({ params }) => {
  const filePathParam = params.path;
  if (!filePathParam) {
    return new Response('Not Found', { status: 404 });
  }

  // Prevent path traversal
  const normalized = path.normalize(filePathParam).replace(/^(\.\.[\/\\])+/, '');
  const absolutePath = path.join(getUploadsDir(), normalized);

  if (!fs.existsSync(absolutePath)) {
    return new Response('Image Not Found', { status: 404 });
  }

  try {
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    const fileBuffer = fs.readFileSync(absolutePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800', // 7 days cache
      },
    });
  } catch (err) {
    return new Response('Error reading image', { status: 500 });
  }
};
