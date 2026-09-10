import { NextRequest, NextResponse } from 'next/server';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

type ApiUser = { uid: string; email?: string };

function getAdminAuth() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Server authentication is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
    }

    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  return getAuth();
}

/** Verifies a Firebase ID token supplied by the signed-in client. */
export async function requireApiUser(req: NextRequest): Promise<ApiUser | NextResponse> {
  const authorization = req.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';

  if (!token) {
    if (process.env.NODE_ENV !== 'production' || !process.env.FIREBASE_PROJECT_ID) {
      return { uid: 'local_developer', email: 'developer@weblead.local' };
    }
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token, true);
    const allowedEmails = (process.env.TEAM_ALLOWED_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (process.env.NODE_ENV === 'production' && (allowedEmails.length === 0 || !decoded.email || !allowedEmails.includes(decoded.email.toLowerCase()))) {
      return NextResponse.json({ error: 'Your account is not authorized to use this workspace.' }, { status: 403 });
    }
    return { uid: decoded.uid, email: decoded.email };
  } catch (error) {
    console.warn('API token verification note:', error);

    if (process.env.NODE_ENV !== 'production' || !process.env.FIREBASE_PROJECT_ID) {
      return { uid: 'local_developer', email: 'developer@weblead.local' };
    }

    const errorCode = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';
    const errorMessage = error instanceof Error ? error.message : '';

    if (errorMessage.includes('Server authentication is not configured')) {
      return NextResponse.json(
        { error: 'Server Firebase Admin credentials are missing. Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Vercel, then redeploy.' },
        { status: 500 },
      );
    }

    if (errorMessage.includes('incorrect "aud"') || errorMessage.includes('incorrect "iss"')) {
      return NextResponse.json(
        { error: 'Server Firebase project does not match the signed-in account. Use service-account credentials from the same Firebase project as the web app, then redeploy.' },
        { status: 500 },
      );
    }

    if (errorCode === 'auth/id-token-expired' || errorCode === 'auth/id-token-revoked') {
      return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
    }

    if (errorCode.startsWith('app/') || errorCode === 'auth/invalid-credential') {
      return NextResponse.json(
        { error: 'Server Firebase Admin credentials are invalid. Generate a new service-account key for this Firebase project, update Vercel, and redeploy.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: 'Your session is invalid or has expired. Please sign in again.' }, { status: 401 });
  }
}

export function isApiError(result: ApiUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

/** Server-only Firestore access for public, opaque concept-preview links. */
export function getAdminFirestore() {
  try {
    getAdminAuth();
    return getFirestore();
  } catch {
    return null;
  }
}
