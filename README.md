# LipiNotes

A privacy-first, end-to-end encrypted notes and novel writing app. All encryption happens in your browser — the server never sees your plaintext.

## Features

- **End-to-end encryption** — AES-256-GCM with PBKDF2 key derivation
- **File explorer** — folders, notes, drag-and-drop reorder, context menus
- **Folder/note passwords** — per-item sub-keys derived from master key
- **Rich note editor** — Tiptap with tables, task lists, typography
- **Sinhala IME** — phonetic romanized input for Sinhala script
- **Novel mode** — per-chapter editors with word goal tracking
- **Full-text search** — decrypts locally from IndexedDB cache
- **Tags** — color-coded tags with filter support
- **Offline-first** — IndexedDB cache, sync queue, PWA
- **Google Drive backup** — encrypted blobs backed up to Drive
- **Recycle bin** — soft delete with 30-day auto-purge
- **Version history** — up to 10 versions per note
- **PDF export** — export notes and novels as PDF

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd lipinotes
npm install
```

### 2. Set up database

Create a free PostgreSQL database on [Neon](https://neon.tech) or use a local instance.

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:
- `DATABASE_URL` — your PostgreSQL connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `AUTH_SECRET` — same value as above
- `NEXTAUTH_URL` — `http://localhost:3000` for dev
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from [Google Cloud Console](https://console.cloud.google.com)

### 4. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project, enable Google OAuth API
3. Create OAuth 2.0 credentials (Web application)
4. Add Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret to `.env`

### 5. Run migrations

```bash
npm run db:push
# or for production migrations:
# npx prisma migrate dev --name init
```

### 6. Generate PWA icons

```bash
node scripts/generate-icons.mjs
```

Then replace `public/icons/icon-192.svg` and `icon-512.svg` with proper PNG icons.

### 7. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Add cron job for trash purge:
   ```json
   // vercel.json
   {
     "crons": [{ "path": "/api/cron/purge-trash", "schedule": "0 3 * * *" }]
   }
   ```

## Security model

- Master key derived via PBKDF2 (100,000 iterations, SHA-256) from `userId + optional passphrase`
- All note content encrypted with AES-256-GCM before any API call
- Sub-keys for locked folders/notes derived from master key + password + item ID
- Keys live in memory only (Zustand, no localStorage)
- Server stores and returns opaque base64 blobs — it never decrypts
- SHA-256 password hashes stored server-side for folder/note lock verification

## Tech stack

Next.js 15 · Auth.js v5 · Prisma · PostgreSQL · Tiptap · Zustand · TanStack Query · Dexie.js · @dnd-kit · Tailwind CSS v4 · Web Crypto API
