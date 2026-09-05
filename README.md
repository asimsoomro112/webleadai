<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# WebLead AI

Team workspace for AI-assisted lead discovery, research, outreach drafting, proposals, and CRM workflow. It is configured for Vercel and Firebase Authentication/Firestore.

## Deploy to Vercel

1. Import this repository in Vercel. Framework preset: **Next.js**. Build command: `npm run build`.
2. Copy `.env.example` values into Vercel → Settings → Environment Variables for **Production** and **Preview**. Do not expose `GEMINI_API_KEY` or `FIREBASE_PRIVATE_KEY` as `NEXT_PUBLIC_*` variables.
3. Create a Firebase service account for the same Firebase project and set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` from its JSON key. Keep the private key's line breaks as `\\n` when entering it in Vercel.
4. Set `TEAM_ALLOWED_EMAILS` to the comma-separated email addresses of every team member who may use AI features. Production APIs deny all other accounts.
5. In Firebase Authentication, add your Vercel domain and custom domain to **Authorized domains**. Deploy `firestore.rules` before inviting real users.

Concept preview links are persisted in Firestore and use opaque IDs, so they continue working after Vercel serverless instances restart.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Run the release checks before deployment:

```bash
npm run lint
npm run build
```
