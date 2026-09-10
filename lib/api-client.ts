import { auth } from './firebase';

/** Sends authenticated requests to the application API without exposing server secrets. */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const user = auth.currentUser;

  if (user) {
    try {
      const token = await user.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    } catch (err) {
      console.warn('Failed to retrieve Firebase ID token:', err);
    }
  }

  return fetch(input, { ...init, headers });
}
