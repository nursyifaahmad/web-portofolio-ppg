import type { APIRoute } from 'astro';
import { clearAdminSession } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  clearAdminSession(cookies);
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Berhasil logout.',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
