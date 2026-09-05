import { auth } from './firebase';

/** Sends authenticated requests to the application API without exposing server secrets. */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication is required.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
