import type { APIRoute } from 'astro';
import { verifyCredentials, setAdminSession } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let username = '';
    let password = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      username = body.username || '';
      password = body.password || '';
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      username = (formData.get('username') as string) || '';
      password = (formData.get('password') as string) || '';
    }

    if (!verifyCredentials(username, password)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Username atau password admin tidak valid.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Set secure HTTP-only cookie
    setAdminSession(cookies);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Login berhasil.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: err?.message || 'Terjadi kesalahan pada server.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
