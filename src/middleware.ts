import { defineMiddleware } from 'astro:middleware';
import { isAdminAuthenticated } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Protect /admin and any sub-routes except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && pathname !== '/admin/login/') {
    if (!isAdminAuthenticated(context.cookies)) {
      return context.redirect('/admin/login');
    }
  }

  // If already logged in, redirect /admin/login to /admin
  if ((pathname === '/admin/login' || pathname === '/admin/login/') && isAdminAuthenticated(context.cookies)) {
    return context.redirect('/admin');
  }

  return next();
});
