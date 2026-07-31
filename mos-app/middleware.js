import { readCookie, verifySession } from './auth.js';

export const config = {
  matcher: '/((?!login(?:\\.html)?$|api/login$|api/logout$|favicon\\.png$).*)'
};

export default async function middleware(request) {
  const session = await verifySession(readCookie(request, 'mos_session'), process.env.MOS_SESSION_SECRET);
  const allowedEmail = (process.env.MOS_ADMIN_EMAIL || '').toLowerCase();
  if (session && session.email === allowedEmail) return;

  const loginUrl = new URL('/login', request.url);
  const requested = new URL(request.url);
  if (requested.pathname !== '/') loginUrl.searchParams.set('returnTo', requested.pathname);
  return Response.redirect(loginUrl, 302);
}
