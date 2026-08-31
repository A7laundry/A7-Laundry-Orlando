import { expiredSessionCookie } from '../auth.js';

export function GET(request) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL('/login', request.url).toString(),
      'Cache-Control': 'no-store',
      'Set-Cookie': expiredSessionCookie()
    }
  });
}
