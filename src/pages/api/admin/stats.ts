import type { APIRoute } from 'astro';
import { isAdminAuthenticated } from '../../../lib/auth';
import { getAdminStats, getGaleriList, getInovasiList } from '../../../lib/data-store';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, url }) => {
  if (!isAdminAuthenticated(cookies)) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const exportType = url.searchParams.get('export');
  if (exportType === 'galeri') {
    return new Response(JSON.stringify(getGaleriList(), null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="backup-galeri.json"',
      },
    });
  }

  if (exportType === 'inovasi') {
    return new Response(JSON.stringify(getInovasiList(), null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="backup-inovasi.json"',
      },
    });
  }

  const stats = getAdminStats();
  return new Response(JSON.stringify({ success: true, data: stats }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
