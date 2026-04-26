# Personal Website CMS

A full-stack personal portfolio and content management system built with Next.js. The site covers three areas — **software engineering**, **astrophotography**, and **writing** — each with its own section, tab layout, and article system. A password-free admin panel (Google OAuth) handles all content creation.

**Live site:** https://mohamedall.com  
**Hosting:** Vercel

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | [Next.js 16](https://nextjs.org) App Router | TypeScript throughout |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) | Theme via `@theme` CSS variables, not `tailwind.config.js` |
| Database | [Neon](https://neon.tech) | Serverless Postgres, connects over HTTP (no persistent pool) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) | Schema-first, schema changes via `drizzle-kit push` |
| Auth | [NextAuth v5 beta](https://authjs.dev) | Google OAuth; one hardcoded admin email |
| Blob Storage | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) | Stores all uploaded images |
| Rich Text | [Tiptap](https://tiptap.dev) | Used for article bodies in the admin editor |
| Animations | [Framer Motion](https://www.framer.com/motion/) | Page transitions and scroll reveals |
| Icons | [Lucide React](https://lucide.dev) | |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) | Injected in `app/layout.tsx` |

---

## Project Structure

```
app/                        Next.js App Router pages and API routes
  (public pages)
    page.tsx                Landing page — hero, updates feed, section portals
    swe/                    Software engineering section
    astrophotography/       Astrophotography section
    writing/                Writing section
    updates/                All-updates feed page

  admin/
    page.tsx                Login page (Google OAuth button)
    dashboard/
      page.tsx              Main CMS dashboard — article list, section tabs
      new/                  Create new article
      [id]/                 Edit existing article
      projects/             Projects CRUD
      gallery/              Gallery photos CRUD + image upload
      astro-gear/           Gear library (equipment / software / technique)
      updates/              Manage site update entries
      settings/             Tab order configuration

  api/                      REST API — public reads, authenticated writes
    articles/               Article CRUD + filter by type or slug
    projects/               Project CRUD + GitHub metadata fetch
    gallery/                Gallery photo CRUD
    gallery/upload/         Vercel Blob token endpoint for gallery images
    astro-gear/             Gear library CRUD
    astro-gear/upload/      Vercel Blob token endpoint for gear images
    updates/                Site updates CRUD
    config/                 Key-value config store (used for tab order)

components/
  admin/                    Forms used only inside the admin panel
    ArticleForm.tsx         Full article editor (title, body, tags, publish)
    GalleryPhotoForm.tsx    Photo upload form with gear multiselects
    ProjectForm.tsx         Project form with GitHub auto-fill
    TabOrderEditor.tsx      Tab reordering UI (up/down arrows)

  astrophotography/         Public astrophotography tab components
  swe/                      Public SWE tab components
  celestial/                Animated star/nebula background
  (shared UI)
    Hero.tsx, Navbar.tsx, Footer.tsx, PageHeader.tsx, TabBar.tsx, etc.

lib/
  schema.ts                 Single source of truth for all DB table definitions
  db.ts                     Drizzle client factory (getDb)
  auth.ts                   Admin session helper (getSession)
  site.ts                   Site-wide constants (name, URL, social links)
  tag-colors.ts             Tag → Tailwind class mappings per section
  hooks/
    use-articles.ts         Fetch published articles by section
    use-tab-order.ts        Fetch and apply saved tab order from config API

scripts/
  db-push.js                Schema push helper — supports --prod flag

auth.ts                     NextAuth configuration (root file, not inside lib/)
middleware.ts               Edge middleware — protects /admin/dashboard/*
drizzle.config.ts           Drizzle Kit config — reads DATABASE_URL from .env.local
next.config.ts              Next.js config — allows Vercel Blob image hostnames
```

---

## Database

**Provider:** [Neon](https://neon.tech) — serverless Postgres. Connections go over HTTP so there is no persistent connection pool. Each request opens and closes a connection, which is fine for a low-traffic personal site.

**ORM:** [Drizzle ORM](https://orm.drizzle.team) — `lib/schema.ts` is the single source of truth for all table definitions. Never alter tables directly in Neon; always update the schema file and run `npm run db:push`.

### Tables

| Table | Purpose |
|---|---|
| `articles` | Posts for all three sections — `type` field is `swe`, `astrophotography`, or `writing` |
| `projects` | SWE projects shown on the projects tab |
| `gallery_photos` | Astrophotography images with equipment, software, technique, and capture time metadata |
| `astro_gear` | Equipment (with optional image and link), software, and technique entries for the gear library |
| `site_updates` | Homepage/updates-page feed entries — auto-created when content is published with the "Publish as Update" toggle |
| `site_config` | Arbitrary key-value store — currently holds tab order for each section as a JSON array |

### Applying schema changes

Edit `lib/schema.ts`, then run:

```bash
npm run db:push        # push to dev database (reads DATABASE_URL from .env.local)
npm run db:push --prod # push to production database (reads from .env.prod.forsync)
```

---

## Blob Storage

**Provider:** [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)

Used for all uploaded images — gallery photos and equipment images in the gear library.

**Why client-side upload?** Vercel serverless functions have a ~4.5 MB request body limit. To handle large images, the browser uploads directly to Vercel Blob using a two-step flow:

1. The browser calls `/api/gallery/upload` (or `/api/astro-gear/upload`) to get a short-lived signed token. This step checks admin authentication.
2. The browser sends the file directly to Vercel Blob using that token, bypassing the function body limit entirely.

Uploaded image URLs are stored in the database and rendered via `next/image`. All Vercel Blob hostnames are allowed in `next.config.ts` via the `*.public.blob.vercel-storage.com` wildcard.

---

## Authentication

**Provider:** [NextAuth v5 beta](https://authjs.dev) with Google OAuth.

There is exactly **one admin** — the email address hardcoded in two files:

- `middleware.ts` — edge-level route protection
- `lib/auth.ts` — API-level session check

To change the admin, update `ADMIN_EMAIL` in both files.

**How protection is layered:**

1. `middleware.ts` runs at the edge and redirects any non-admin away from `/admin/dashboard/*` before the page renders — fast and cheap.
2. Every API write route additionally calls `getSession()` as a second check, so the API cannot be bypassed even if middleware were somehow circumvented.
3. Public GET routes have no auth requirement — content is public by design.

---

## Environment Variables

Create `.env.local` at the project root:

```env
# Neon Postgres connection string (from Neon dashboard)
DATABASE_URL=

# NextAuth secret — generate with: openssl rand -base64 32
AUTH_SECRET=

# Google OAuth app credentials (from Google Cloud Console → APIs & Services → Credentials)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Vercel Blob token (from Vercel dashboard → Storage → Blob → your store)
BLOB_READ_WRITE_TOKEN=

# Used for OG images and sitemap — no trailing slash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production, add these as environment variables in the Vercel project dashboard. Change `NEXT_PUBLIC_SITE_URL` to the live domain.

---

## Custom Scripts

### `scripts/db-push.js`

Wraps `drizzle-kit push` with optional production database support.

```bash
npm run db:push           # push using DATABASE_URL in .env.local
npm run db:push --prod    # temporarily swap in the URL from .env.prod.forsync, push, revert
```

`.env.prod.forsync` is gitignored and must contain at minimum:

```env
DATABASE_URL=<production neon connection string>
```

The `--prod` path is detected via `npm_config_prod=true`, which npm automatically injects when you pass `--prod` to any script. The revert runs in a `finally` block, so `.env.local` is always restored even if the push fails.

---

## Admin Panel

Navigate to `/admin` to sign in with Google. Only the configured admin email can access the dashboard.

| Page | URL | What it does |
|---|---|---|
| Dashboard | `/admin/dashboard` | Article list; switch between writing / SWE / astrophotography |
| New article | `/admin/dashboard/new` | Create article with rich-text body, tags, date, read time |
| Edit article | `/admin/dashboard/[id]` | Update, publish, or delete an article |
| Projects | `/admin/dashboard/projects` | Add SWE projects; auto-fills title and description from GitHub |
| Gallery | `/admin/dashboard/gallery` | Upload photos; attach equipment, software, technique metadata |
| Gear library | `/admin/dashboard/astro-gear` | Add equipment (with image + product link), software, and technique |
| Updates | `/admin/dashboard/updates` | Edit or delete entries in the updates feed |
| Settings | `/admin/dashboard/settings` | Reorder tabs in the SWE and Astrophotography sections |

### "Publish as Update" toggle

Most create forms include a **Publish as Update** toggle. When enabled, creating the item also inserts a row in `site_updates` with a descriptive message and a deep link back to that content. If the item has an image (e.g. equipment), the update also stores a thumbnail URL. These entries surface on the homepage and on `/updates`.

---

## Public Site Sections

| Section | URL | Tabs |
|---|---|---|
| Software Engineering | `/swe` | Articles · Projects · About Me |
| Astrophotography | `/astrophotography` | Articles · Astro Calendar · Gallery · Gear |
| Writing | `/writing` | Articles |

Tab order for SWE and Astrophotography is configurable from the admin Settings page. The order is stored as a JSON array in `site_config` and fetched on the client via the `useTabOrder` hook.

Deep-linking to a specific tab works via `?tab=<tab-id>` — for example, a site update about a new gear item links to `/astrophotography?tab=gear`.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local with the variables listed above

# 3. Push the database schema to your dev Neon database
npm run db:push

# 4. Start the dev server
npm run dev
```

The site will be at http://localhost:3000 and the admin panel at http://localhost:3000/admin.

---

## Deployment

The project deploys to [Vercel](https://vercel.com) automatically on every push to `main`. Vercel builds the Next.js app and serves it globally via its edge network.

**Pre-deployment checklist:**
- All environment variables are set in the Vercel project dashboard
- `NEXT_PUBLIC_SITE_URL` is set to the production domain (no trailing slash)
- Schema has been pushed to the production database (`npm run db:push --prod`)
- Google OAuth redirect URI includes the production domain (in Google Cloud Console)
