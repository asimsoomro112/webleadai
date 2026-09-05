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
    console.error('API authentication failed:', error);
    return NextResponse.json({ error: 'Your session is invalid or has expired. Please sign in again.' }, { status: 401 });
  }
}

export function isApiError(result: ApiUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

/** Server-only Firestore access for public, opaque concept-preview links. */
export function getAdminFirestore() {
  getAdminAuth();
  return getFirestore();
}
