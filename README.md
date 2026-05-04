# Personal Website CMS

A full-stack personal website and content management system built with Next.js. The public site covers software engineering, astrophotography, writing/book reviews, categorized reading notes, misc pages, updates, reader comments, and a custom interactive night-sky map. A Google OAuth admin panel manages articles, books, reading-note categories, reading notes, projects, gallery photos, gear, astro sessions, site content, visibility, theme settings, and tab configuration.

**Live site:** https://mohamedall.com  
**Hosting:** Vercel

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 App Router | TypeScript, React 19 |
| Styling | Tailwind CSS v4 | Theme values in CSS variables |
| Database | Neon Postgres | Serverless HTTP driver |
| ORM | Drizzle ORM | `lib/schema.ts` is the source of truth |
| Auth | NextAuth v5 beta | Google OAuth; single configured admin email |
| Blob Storage | Vercel Blob | Gallery and gear image uploads |
| Rich Text | Tiptap | Article and reading-note body editor |
| Animation | Framer Motion | Page/tab transitions and visual polish |
| Icons | Lucide React | UI icons |
| Testing | Vitest + Testing Library | API, hooks, components, utilities |
| Analytics | Vercel Analytics | Injected in `app/layout.tsx` |

---

## Project Structure

```text
app/
  page.tsx                         Homepage: hero, updates, section portals
  swe/                             Software engineering section and article pages
  astrophotography/                Astro section, including gallery, gear, sky map
  writing/                         Book reviews, reading notes, and article pages
  misc/                            Misc section with configurable article tabs
  updates/                         Public updates feed
  admin/
    page.tsx                       Google OAuth login
    dashboard/
      page.tsx                     CMS dashboard and section-specific actions
      new/                         Create article
      [id]/                        Edit article
      projects/                    SWE projects CRUD
      gallery/                     Astrophotography gallery CRUD
      astro-gear/                  Gear library CRUD
      astro-sessions/              Schedule astrophotography sessions
      reading-notes/               Book entries and rich-text reading notes
      updates/                     Updates feed CRUD
      settings/                    Site settings, visibility, theme, tab order
  api/
    articles/                      Article CRUD and slug lookup
    projects/                      Project CRUD and GitHub metadata
    gallery/                       Gallery photo CRUD and upload token route
    astro-gear/                    Gear CRUD, image CRUD, upload token route
    astro-sessions/                Astro session CRUD
    book-categories/               Book category API
    books/                         Book entry API
    reading-notes/                 Reading note API
    comments/                      Reader comments
    updates/                       Site updates
    config/                        JSON key-value config store

components/
  admin/                           Admin forms and settings editors
  astrophotography/                Astro public tabs, gallery, gear, sky map
  swe/                             SWE article tab
  celestial/                       Decorative celestial background helpers
  *.tsx                            Shared UI: Navbar, Hero, PageHeader, TabBar, etc.

lib/
  schema.ts                        Drizzle table definitions and inferred types
  db.ts                            Neon/Drizzle client factory
  auth.ts                          Admin and reader session helpers
  api.ts                           Shared API response helpers
  hooks/                           Client data/config hooks
  section-visibility.ts            Section visibility and numbering helpers
  sky-*.ts                         Night-sky data, math, engine, drawing, targets
  updates.ts                       Site update helper
  utils.ts                         Shared utilities

tests/
  api/                             Route handler tests
  components/                      React component tests
  hooks/                           Hook tests
  lib/                             Utility/helper tests

scripts/
  db-push.js                       Drizzle schema push wrapper

middleware.ts                      Protects `/admin/dashboard/*`
auth.ts                            NextAuth root config
drizzle.config.ts                  Drizzle Kit config
next.config.ts                     Next.js image/domain config
vitest.config.ts                   Vitest config
```

---

## Public Site

| Section | URL | Main features |
|---|---|---|
| Home | `/` | Hero, recent updates, visible section portals |
| Software Engineering | `/swe` | Articles, projects, about/experience |
| Astrophotography | `/astrophotography` | Articles, astro calendar, gallery, gear, night-sky map |
| Writing | `/writing` | Book reviews and reading notes |
| Misc | `/misc` | Article-backed configurable tabs |
| Updates | `/updates` | Full updates feed |

Deep-linking to a tab works via `?tab=<tab-id>`, for example:

```text
/astrophotography?tab=gear
/astrophotography?tab=sky
/swe?tab=projects
```

Gear links can also deep-link to an equipment modal:

```text
/astrophotography?tab=gear&gear=<gear-id>
```

The navbar and section headers respect section visibility. When sections are hidden, visible section numbers are recalculated consistently across navigation, home cards, and page headers.

There is also a hidden admin shortcut: tapping/clicking the spacer between `AO.` and the nav controls four times within a short window routes to `/admin`.

---

## Night-Sky Map

The `NightSkyMap` component is a custom canvas-based sky visualization backed by local astronomy data and math:

- bright stars, background stars, constellation linework, deep-sky objects, planets, and Moon
- pan, zoom, touch gestures, fullscreen mode, location transitions
- constellation selection and target framing
- session callouts with target rings, witness lines, and expandable details

Astro sessions are scheduled in the admin panel. Each session stores:

- title
- scheduled date/time
- sky target
- planned equipment
- notes

Session targets can be constellations, deep-sky objects, planets, or Moon. Upcoming sessions show as accent callouts. Old sessions can be toggled on and render muted gray but remain clickable. Clicking a session frames the target and expands the card. Witness lines and target rings are only shown when the target ring is fully visible in the map frame.

Target options come from `lib/sky-targets.ts`, which is derived from constellation data, DSO data, and solar-system targets.

---

## Writing

The Writing section is split into:

- Book reviews: existing `type="writing"` articles, managed through the article editor.
- Reading notes: rich-text notes grouped under book entries.

Book entries store a title, author, year published, and category. Categories can be created while creating a book, and the public Reading Notes tab can be filtered by category. Reading notes map many-to-one to a book entry and are shown publicly as a horizontal book carousel; selecting a book lists its notes newest to oldest. In the admin panel, a reading note's book assignment is fixed after creation. Only the note text is editable.

---

## Admin Panel

Navigate to `/admin` and sign in with Google. Only the configured admin email can access `/admin/dashboard/*` and write APIs.

| Page | URL | Purpose |
|---|---|---|
| Dashboard | `/admin/dashboard` | Articles by section, section-specific actions |
| New Article | `/admin/dashboard/new` | Create article with rich-text body |
| Edit Article | `/admin/dashboard/[id]` | Edit/publish/delete article |
| Projects | `/admin/dashboard/projects` | SWE project management |
| Gallery | `/admin/dashboard/gallery` | Astro photo management |
| Gear Library | `/admin/dashboard/astro-gear` | Equipment, software, technique management |
| Astro Sessions | `/admin/dashboard/astro-sessions` | Schedule sky-map sessions |
| Reading Notes | `/admin/dashboard/reading-notes` | Create books and rich-text reading notes |
| Updates | `/admin/dashboard/updates` | Edit/delete updates |
| Settings | `/admin/dashboard/settings` | Section visibility, site content, experience, palette, typography, tab order, config links |

The Astrophotography dashboard actions include:

- Gear Library
- All Photos
- New Photo
- New Session
- New Article

### Publish as Update

Several admin create flows include a “Publish as Update” toggle. When enabled, the create action also inserts a row in `site_updates`, optionally with a thumbnail and a deep link back to the content.

---

## Database

**Provider:** Neon serverless Postgres  
**ORM:** Drizzle ORM

`lib/schema.ts` is the single source of truth. Update that file and run `npm run db:push`; do not manually alter tables in Neon.

### Tables

| Table | Purpose |
|---|---|
| `articles` | Articles for SWE, astrophotography, writing, and misc |
| `projects` | SWE project entries |
| `gallery_photos` | Astro gallery photos and acquisition metadata |
| `astro_gear` | Equipment, software, and technique entries |
| `gear_images` | Additional images attached to gear |
| `astro_sessions` | Scheduled astro sessions for the night-sky map |
| `book_categories` | Categories for filtering reading-note books |
| `books` | Book entries used by reading notes |
| `reading_notes` | Rich-text notes mapped to books |
| `site_updates` | Homepage and `/updates` feed |
| `site_config` | JSON config values for tabs/content/settings |
| `comments` | Reader comments on articles |

### Applying Schema Changes

```bash
npm run db:push        # push to the dev database in .env.local
npm run db:push --prod # temporarily use .env.prod.forsync, push, then restore .env.local
```

The current astro session and reading-notes features require the `astro_sessions`, `book_categories`, `books`, and `reading_notes` tables to exist in the target database.

---

## Blob Storage

Images are uploaded to Vercel Blob:

- gallery photos
- gear thumbnails/detail images

The app uses direct browser-to-Blob upload flows to avoid serverless request body limits. Authenticated upload token routes live under:

```text
/api/gallery/upload
/api/astro-gear/upload
```

Blob URLs are stored in Postgres and rendered with `next/image`. Vercel Blob hostnames are allowed in `next.config.ts`.

---

## Authentication

Auth uses NextAuth v5 beta with Google OAuth.

There is one admin email, currently duplicated by design:

- `middleware.ts` protects `/admin/dashboard/*`
- `lib/auth.ts` protects API writes and exposes reader session helpers

If the admin changes, update both files.

Protection layers:

1. `middleware.ts` redirects non-admins away from `/admin/dashboard/*`.
2. API write routes call `getSession()` from `lib/auth.ts`.
3. Public GET routes are generally unauthenticated.
4. Reader comments can use any signed-in Google account; comment approval remains admin-controlled.

---

## Environment Variables

Create `.env.local`:

```env
DATABASE_URL=
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production, configure the same variables in Vercel. Use the production domain for `NEXT_PUBLIC_SITE_URL`.

For production schema pushes, `.env.prod.forsync` must contain:

```env
DATABASE_URL=<production neon connection string>
```

---

## Scripts

```bash
npm run dev          # start local Next dev server
npm run build        # production build and type check
npm run start        # start production server after build
npm run lint         # run ESLint
npm run test         # run Vitest once
npm run test:watch   # Vitest watch mode
npm run test:ui      # Vitest UI
npm run db:push      # push Drizzle schema
```

Known note: `npm run lint` currently surfaces broader existing React compiler and test typing issues in older files. `npm run build` and `npm run test` are the reliable verification commands used during recent work.

---

## Testing

Tests use Vitest and Testing Library. DB/auth/fetch dependencies are mocked where needed.

```bash
npm run test
```

Current coverage includes:

- article APIs
- config API
- comments API
- updates API
- astro sessions API
- book categories, books, and reading notes API
- auth/comment components
- data hooks
- section visibility helpers
- sky target catalog
- shared utilities

Run a single file:

```bash
npx vitest run tests/api/astro-sessions.test.ts
npx vitest run tests/lib/sky-targets.test.ts
```
