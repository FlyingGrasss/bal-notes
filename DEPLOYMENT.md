# BAL Notes testing and deployment

BAL Notes uses BAL ID as its single identity provider. BAL ID owns the
Supabase Auth users, Google sign-in, sessions, and OAuth consent screen. BAL
Notes is only an OAuth client and keeps its own product data in the `balnotes`
schema.

## Canonical setup

- Production URL: `https://notes.balogrenci.org`
- BAL ID URL: `https://balid.balogrenci.org`
- Supabase project: `BALID`
- Supabase project ref: `cyyppepgzyemdrwtuyrs`
- Supabase dashboard: `https://supabase.com/dashboard/project/cyyppepgzyemdrwtuyrs`
- Supabase URL: `https://cyyppepgzyemdrwtuyrs.supabase.co`
- BAL ID OAuth issuer: `https://cyyppepgzyemdrwtuyrs.supabase.co/auth/v1`
- Runtime database schema: `balnotes`

The canonical Supabase database contains these isolated schemas:

- `bal_id`: central BAL ID profiles and migration history
- `baloder`: BALÖDER profiles, product tables, assistant tables, and migration history
- `balnotes`: BAL Notes tables and migration history

The old BALÖDER database was used as a read-only source during consolidation
and was not modified.

## Test BAL Notes locally

1. Use Node.js 24 and pnpm 11. The repository includes `.nvmrc`; with
   nvm-windows, run `nvm use 24` before starting the app. Node 26 may still
   start Next.js, but pnpm will correctly report it as an unsupported engine.
2. Copy `.env.example` to `.env.local`.
3. Fill the environment variables below. The URL and issuer values are already
   fixed for the canonical BAL ID project; the database password, OAuth
   credentials, admin emails, and Blob token are secrets and must be supplied
   locally.

   ```env
   # Supabase transaction pooler (port 6543) for the Next.js runtime.
   DATABASE_URL="postgresql://postgres.cyyppepgzyemdrwtuyrs:PASSWORD@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

   # Direct connection (port 5432) used by Prisma CLI/migrations only.
   DIRECT_URL="postgresql://postgres.cyyppepgzyemdrwtuyrs:PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?schema=balnotes"

   APP_URL="http://localhost:3000"
   HOMEWORK_APP_URL="http://localhost:3000"
   AUTH_SECRET="at-least-32-random-characters"

   NEXT_PUBLIC_SUPABASE_URL="https://cyyppepgzyemdrwtuyrs.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-or-publishable-key"

   BAL_ID_ISSUER_URL="https://cyyppepgzyemdrwtuyrs.supabase.co/auth/v1"
   BAL_ID_CLIENT_ID="the-BAL-Notes-local-confidential-client-id"
   BAL_ID_CLIENT_SECRET="the-BAL-Notes-local-client-secret"

   ADMIN_EMAILS="admin@example.com"
   BLOB_READ_WRITE_TOKEN="private-vercel-blob-token"
   ```

   `DATABASE_URL` and `DIRECT_URL` must point to the same physical database.
   `DATABASE_URL` is used through the transaction pooler at runtime, while
   `DIRECT_URL` is loaded by `prisma.config.ts` for migrations. Do not use a
   service-role key, JWT secret, Google client secret, or OAuth secret as the
   Supabase anon/publishable key.

4. Install dependencies and generate Prisma Client:

   ```bash
   pnpm install
   pnpm prisma generate
   ```

5. Confirm the schema is already applied:

   ```bash
   pnpm prisma migrate status
   ```

6. Start the app:

   ```bash
   pnpm dev
   ```

Open `http://localhost:3000` to test the public surface:

- `/` — homepage sections (approved notes only)
- `/notlar` — discovery and filtering (approved notes only)
- `/notlar/<id>` — public detail/share page for every non-draft note
- `/sozler` — approved teacher quotes

Public discovery can load without signing in. A submitted note or quote starts
as `PENDING`; it appears in discovery/homepage sections only after an admin
approves it at `/admin`. To test sign-in, voting, uploads, and submissions,
complete the BAL ID OAuth client setup below first. Sign-in starts at
`/auth/bal-id`, and authenticated submissions are made at `/paylas`.

## BAL ID OAuth setup

Perform this setup in the canonical Supabase project (`BALID`, ref
`cyyppepgzyemdrwtuyrs`). If OAuth Server is already enabled, verify the values
instead of creating a second server configuration.

### 1. Configure the BAL ID OAuth server

In the Supabase dashboard:

1. Open **Authentication → OAuth Server**.
2. Enable **OAuth 2.1 server capabilities**.
3. Set the **Authorization Path** to `/auth/consent`.

The authorization path belongs to BAL ID. It is the consent UI that displays
the requesting product and lets the user approve or deny access. Supabase Auth
will send OAuth requests to the BAL ID deployment at:

```text
https://balid.balogrenci.org/auth/consent?authorization_id=...
```

If this URL is instead generated on `www.balogrenci.org`, the Supabase Site
URL is pointing at BALÖDER. That host does not contain BAL ID's consent page
and returns a 404. Change the Site URL to `https://balid.balogrenci.org`;
`www.balogrenci.org` must not be used as the OAuth consent origin.

If BAL ID is being run locally, its site URL must instead point to that local
BAL ID origin while testing the local BAL ID app.

### 2. Check BAL ID URL configuration

In **Authentication → URL Configuration** for the same project:

- Set the Site URL to the deployed BAL ID origin (`https://balid.balogrenci.org`
  in production).
- Keep BAL ID's own login callback URLs registered, including
  `http://localhost:3000/auth/callback` for local BAL ID development and
  `https://balid.balogrenci.org/auth/callback` for production.

These are BAL ID's Supabase login callbacks. They are separate from the BAL
Notes OAuth client redirect URIs in the next step.

### 3. Register BAL Notes OAuth clients

In **Authentication → OAuth Apps** (under **Manage**), click **Add a new
client**. Use a separate confidential client for each environment:

| Client | Type | Token endpoint authentication | Exact redirect URI |
| --- | --- | --- | --- |
| BAL Notes Local | Confidential | `client_secret_basic` | `http://localhost:3000/auth/callback` |
| BAL Notes Production | Confidential | `client_secret_basic` | `https://notes.balogrenci.org/auth/callback` |

The application uses authorization code + PKCE (`S256`). The Supabase OAuth
server requires the redirect URI to match exactly; do not add a trailing slash,
wildcard, or an unregistered domain. Confidential clients use the generated
client secret through HTTP Basic authentication, which is what the BAL Notes
callback route sends.

Copy the generated credentials as follows:

- Local BAL Notes `.env.local`: use the **BAL Notes Local** client ID and secret.
- Vercel Preview/Production: use the **BAL Notes Production** client ID and
  secret in the appropriate environment.

`BAL_ID_CLIENT_ID` and `BAL_ID_CLIENT_SECRET` are OAuth client credentials.
They are not the Supabase anon key, service-role key, JWT secret, or Google
client credentials.

The BAL Notes app currently requests the `email profile` scopes. An `openid`
scope is not required. If `openid` is added later, configure an asymmetric
Supabase JWT signing key (RS256 or ES256) first.

### 4. Configure Google sign-in once in BAL ID

Configure Google under **Authentication → Providers → Google** in the BAL ID
Supabase project. Product apps do not receive Google credentials and do not
create their own Google sessions. A user signs in with Google through BAL ID,
then BAL ID issues BAL Notes an OAuth grant after the consent screen.

### 5. Test the OAuth flow

With BAL Notes running locally:

1. Open `http://localhost:3000/auth/bal-id`.
2. Sign in on BAL ID (Google or another enabled BAL ID provider).
3. Review the BAL Notes consent screen and choose **Allow and continue**.
4. Confirm that BAL ID redirects to
   `http://localhost:3000/auth/callback` and then back to BAL Notes.
5. Open `/paylas` and submit a test note or teacher quote.
6. As an admin, open `/admin` and approve it. Verify that it then appears in
   `/notlar` and the appropriate homepage section.

Common failures:

- `yapilandirma`: a BAL Notes OAuth client ID/secret or issuer is missing.
- `token-hatasi`: the client secret, redirect URI, or PKCE exchange does not
  match the registered client.
- `gecersiz-istek`: the OAuth state cookie is missing or stale; restart the
  flow in the same browser.
- `kimlik-hatasi`: BAL ID did not return a verified email/profile through the
  requested scopes.

OAuth endpoints for this project are:

```text
Authorization: https://cyyppepgzyemdrwtuyrs.supabase.co/auth/v1/oauth/authorize
Token:         https://cyyppepgzyemdrwtuyrs.supabase.co/auth/v1/oauth/token
UserInfo:      https://cyyppepgzyemdrwtuyrs.supabase.co/auth/v1/oauth/userinfo
```

For Supabase's current server behavior and client-registration details, see
the [OAuth 2.1 server getting-started guide](https://supabase.com/docs/guides/auth/oauth-server/getting-started)
and [OAuth 2.1 flows](https://supabase.com/docs/guides/auth/oauth-server/oauth-flows).

## Deploying all products

For a fresh environment, apply migrations in this order against the same
physical Supabase database:

```bash
cd old_projects/balid
pnpm prisma migrate deploy

cd ../baloder
pnpm prisma migrate deploy

cd ../../bal-notes
pnpm prisma migrate deploy
```

The existing restored database is already migrated. Do not run `migrate reset`
against it.

Configure every deployment with the same `NEXT_PUBLIC_SUPABASE_URL`, anon or
publishable key, and physical database. Use separate OAuth client IDs/secrets
for BALÖDER and BAL Notes, and separate local/production clients where
possible. BALÖDER must use the canonical BAL ID database URL, not the
preserved old source database.

For the BAL Notes Vercel project:

1. Add the variables from `.env.example` in both Preview and Production.
2. Set Production `APP_URL` to `https://notlar.balogrenci.org`.
3. Set Production `BAL_ID_CLIENT_ID` and `BAL_ID_CLIENT_SECRET` to the BAL
   Notes Production OAuth client credentials.
4. Add `notes.balogrenci.org` as the custom domain and wait for HTTPS to be
   active.
5. Confirm that the production OAuth redirect URI is exactly
   `https://notes.balogrenci.org/auth/callback`.
6. Use a private Vercel Blob store token for uploads.

BAL Notes reads `APP_URL` for canonical links and OAuth redirects. BAL ID and
BALÖDER may use their own `NEXT_PUBLIC_SITE_URL` variables; do not substitute
that variable for BAL Notes unless the application code is changed.

BAL Ödevler is deployed separately from its own repository to
`https://odevler.balogrenci.org`. It reads the same physical database and
shares the BAL ID admin emails, but it no longer shares this codebase,
deployment, or environment variables. See the `bal-odevler` repository for its
setup and launch checklist.

## Database security before public launch

The Supabase database inspection currently reports Row Level Security (RLS)
disabled on the eight `balnotes` tables. The application accesses these
product schemas through server-side Prisma and they should remain out of the
Supabase Data API exposed-schema list, but this warning must still be resolved
before allowing direct client access or adding browser-side Supabase queries.

Do not enable RLS without defining policies: enabling it first would block
normal access. Review the policies for notes, assets, votes, quotes, profiles,
OAuth attempts, and Prisma migrations, then re-run the Supabase advisors.

## Verification commands

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test:run
pnpm prisma migrate status
```

After deploying, test BAL ID login, BAL Notes login, public
`/notlar/<id>` links, note upload, admin approval, voting, OAuth grant
revocation, and product-local account deletion. Revoking a BAL ID grant should
invalidate the product refresh session while leaving the central BAL ID
account intact.

## Credential hygiene

The local environment files contain credentials. Rotate database passwords,
Supabase service-role keys, Blob tokens, mail/API keys, and all OAuth secrets
before production deployment. Never commit `.env.local`, database dumps, or
generated backups.

## BAL Ödevler deployment

BAL Ödevler is a separate application deployed from its own repository to
`https://odevler.balogrenci.org`. It shares the same physical database
(`balnotes` schema homework tables) and BAL ID admin emails, but has its own
Vercel project, environment variables, and launch checklist. See the
`bal-odevler` repository's `DEPLOYMENT.md` for the full checklist:

1. Sign in with the BAL ID email listed in `ADMIN_EMAILS`.
2. Open `/admin` and create the first teacher or smart-board writer account.
3. Save or scan the generated QR link immediately. The private key is not
   recoverable from the database after the creation screen is closed.
4. Open the feed from a student browser and confirm it is readable without
   signing in.
5. Scan the writer QR, publish a homework item, edit it, and delete it.
6. Rotate the writer key and confirm the previous QR no longer logs in.
7. Revoke the writer account and confirm its existing session can no longer
   publish, edit, or delete homework.

The QR login uses a database-backed session and must remain protected by the
application's rate limit. Keep writer keys out of logs, screenshots, issue
reports, and source control. The public feed contains only homework fields;
writer session tokens and credential hashes must never be sent to client
components.
