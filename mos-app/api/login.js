import { createSession, sessionCookie, verifyPassword } from '../auth.js';

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

export async function POST(request) {
  const origin = request.headers.get('origin');
  if (!origin || new URL(origin).origin !== new URL(request.url).origin) return json({ error: 'Solicitação inválida.' }, 403);

  const expectedEmail = (process.env.MOS_ADMIN_EMAIL || '').trim().toLowerCase();
  const secret = process.env.MOS_SESSION_SECRET || '';
  if (!expectedEmail || !secret || !process.env.MOS_PASSWORD_SALT || !process.env.MOS_PASSWORD_HASH) {
    return json({ error: 'O acesso ao MOS não está configurado.' }, 503);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Solicitação inválida.' }, 400); }
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const validPassword = await verifyPassword(password, process.env.MOS_PASSWORD_SALT, process.env.MOS_PASSWORD_HASH);
  if (email !== expectedEmail || !validPassword) return json({ error: 'E-mail ou senha inválidos.' }, 401);

  const token = await createSession(email, secret);
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token) });
}
