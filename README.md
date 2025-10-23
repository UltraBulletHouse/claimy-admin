# Claimy Admin

Claimy Admin is a secure Next.js dashboard for the single authorized admin to manage Claimy cases. It integrates Firebase Authentication, Gmail API, Cloudinary and MongoDB, and is deployable to Vercel.

## Features

- Google sign-in restricted to `ADMIN_EMAIL`
- Short-lived admin session token verified on every API call
- Case dashboard with search, status filters, pagination and manual Gmail sync
- Case detail workspace with manual analysis, AI prompt helper, email drafting/sending, Gmail thread viewer, replies, status transitions, approvals, rejections and permanent deletion
- Gmail send using OAuth2 with optional Cloudinary attachments
- MongoDB persistence via Mongoose with status history tracking
- TailwindCSS responsive UI ready for local dev and Vercel deployment

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_FIREBASE_*` – client SDK config
- `NEXT_PUBLIC_ADMIN_EMAIL` and `ADMIN_EMAIL` – exact Google account allowed
- `ADMIN_SECRET_TOKEN` – long random string for signing session tokens
- `MONGODB_URI` – Atlas connection string
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` – Firebase Admin service account values (private key must keep newline escapes)
- Gmail OAuth: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_USER`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

Never commit `.env.local`.

### 3. Firebase setup

1. Create a Firebase project.
2. Enable Google sign-in in **Authentication → Sign-in method**.
3. Create a web app and copy the client config to `NEXT_PUBLIC_FIREBASE_*`.
4. Generate a service account in **Project settings → Service accounts**.
5. Copy the service account email and project ID into env vars.
6. Convert the private key to single-line with `\n` escaped and set `FIREBASE_PRIVATE_KEY`.

### 4. Gmail API setup

1. Create OAuth client ID (Desktop or Web) in Google Cloud Console.
2. Enable Gmail API.
3. Use OAuth Playground to authorize Gmail scopes `https://www.googleapis.com/auth/gmail.send` and `https://www.googleapis.com/auth/gmail.readonly`.
4. Exchange the authorization for a refresh token and set `GMAIL_REFRESH_TOKEN`.
5. Set `GMAIL_USER` to the Gmail address the admin will send from.

### 5. Cloudinary setup

1. Create a Cloudinary account and note your cloud name, API key and secret.
2. Populate the Cloudinary env vars.
3. Ensure case assets stored by the consumer app are publicly accessible or that the URLs saved in MongoDB are usable for downloading.

### 6. MongoDB

Prepare a MongoDB Atlas cluster (or reuse existing). The `cases` collection must store documents matching the schema described in `lib/models/Case.ts`.

### 7. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with the authorized Google account.

### 8. Deploy to Vercel

1. Create a new Vercel project pointing to `claimy-admin`.
2. In **Project Settings → Environment Variables**, add all vars from `.env.local` (do **not** add secrets to Git).
3. Deploy. Vercel’s serverless functions will host the API routes.

### API Reference (curl examples)

Replace placeholders with real values and include the `Authorization: Bearer <adminSessionToken>` header when calling from terminal.

```bash
# Exchange Firebase ID token for admin session token
curl -X POST https://your-vercel-domain/api/admin/session \
  -H "Authorization: Bearer <firebase-id-token>"

# List cases
curl https://your-vercel-domain/api/admin/cases?status=inReview \
  -H "Authorization: Bearer <admin-session-token>"

# Get case detail
curl https://your-vercel-domain/api/admin/cases/<caseId> \
  -H "Authorization: Bearer <admin-session-token>"

# Save manual analysis
curl -X POST https://your-vercel-domain/api/admin/cases/<caseId>/analysis \
  -H "Authorization: Bearer <admin-session-token>" \
  -H "Content-Type: application/json" \
  -d '{"text":"Investigation notes"}'

# Generate prompt
curl -X POST https://your-vercel-domain/api/admin/cases/<caseId>/generate-prompt \
  -H "Authorization: Bearer <admin-session-token>"

# Save email draft
curl -X POST https://your-vercel-domain/api/admin/cases/<caseId>/email/draft \
  -H "Authorization: Bearer <admin-session-token>" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Update","body":"Hello","to":"store@example.com"}'

# Send email
curl -X POST https://your-vercel-domain/api/admin/cases/<caseId>/email/send \
  -H "Authorization: Bearer <admin-session-token>" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Hello","body":"Message","to":"store@example.com","attachProduct":true,"attachReceipt":false}'

# Fetch thread
curl https://your-vercel-domain/api/admin/cases/<caseId>/thread \
  -H "Authorization: Bearer <admin-session-token>"

# Reply to thread
curl -X POST https://your-vercel-domain/api/admin/cases/<caseId>/thread/reply \
  -H "Authorization: Bearer <admin-session-token>" \
  -H "Content-Type: application/json" \
  -d '{"body":"Following up"}'

# Request additional info
curl -X POST https://your-vercel-domain/api/admin/cases/<caseId>/request-info \
  -H "Authorization: Bearer <admin-session-token>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Please send purchase confirmation"}'

# Approve case
curl -X POST https://your-vercel-domain/api/admin/cases/<caseId>/approve \
  -H "Authorization: Bearer <admin-session-token>" \
  -H "Content-Type: application/json" \
  -d '{"code":"DISCOUNT-2024"}'

# Reject case
curl -X POST https://your-vercel-domain/api/admin/cases/<caseId>/reject \
  -H "Authorization: Bearer <admin-session-token>" \
  -H "Content-Type: application/json" \
  -d '{"note":"Insufficient proof"}'

# Delete case
curl -X DELETE https://your-vercel-domain/api/admin/cases/<caseId> \
  -H "Authorization: Bearer <admin-session-token>" \
  -H "Content-Type: application/json" \
  -d '{"deleteAssets":true}'

# Manual Gmail sync
curl -X POST https://your-vercel-domain/api/admin/sync-mails \
  -H "Authorization: Bearer <admin-session-token>"
```

### Security Notes

- `.env.local` is gitignored; never commit secrets.
- `ADMIN_SECRET_TOKEN` must be a strong random string.
- Firebase service account keys are required as environment variables, not committed files.
- Gmail refresh token and Cloudinary credentials must be stored only in env vars.
- API routes enforce both Firebase admin validation and the HMAC-signed admin session token.
- Only the single `ADMIN_EMAIL` may access the dashboard.

### Final Checklist

- [ ] Create Firebase project, enable Google login, generate service account and copy keys.
- [ ] Generate Gmail OAuth credentials and refresh token via OAuth Playground.
- [ ] Create Cloudinary account and set API credentials.
- [ ] Set `ADMIN_EMAIL` / `NEXT_PUBLIC_ADMIN_EMAIL` to the authorized Google account.
- [ ] Generate and set `ADMIN_SECRET_TOKEN`.
- [ ] Configure `MONGODB_URI`.
- [ ] Install dependencies and run `npm run dev`.
- [ ] Deploy to Vercel and replicate all environment variables there.
