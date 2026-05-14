import { pgTable, serial, text, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export type GitHubCommitMetadata = {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorEmail?: string;
  committedAt: string;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
};

// All database tables are defined here. This is the single source of truth —
// edit this file and run `npm run db:push` to apply changes to the database.
// Never alter tables directly in Neon.

// Articles covers all three site sections. The `type` field acts as a
// discriminator: "swe" | "astrophotography" | "writing".
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  content: text("content").notNull().default(""),
  tags: text("tags").notNull().default(""),        // comma-separated
  date: text("date").notNull().default(""),
  location: text("location"),
  readTime: text("read_time"),
  miscTabId: integer("misc_tab_id"),
  seriesId: integer("series_id"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;

// Misc section tabs. Unlike SWE/Astro tab config, these are content buckets
// created by the admin. Each tab can contain many misc articles.
export const miscTabs = pgTable("misc_tabs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(99),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type MiscTab = typeof miscTabs.$inferSelect;
export type NewMiscTab = typeof miscTabs.$inferInsert;

// Series objects group misc articles inside tabs. A tab can contain articles
// from multiple series, and readers can filter the active tab by series.
export const miscSeries = pgTable("misc_series", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type MiscSeries = typeof miscSeries.$inferSelect;
export type NewMiscSeries = typeof miscSeries.$inferInsert;

// SWE projects shown on the /swe?tab=projects tab.
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  githubUrl: text("github_url"),
  websiteUrl: text("website_url"),
  imageUrl: text("image_url"),
  tags: text("tags").notNull().default(""),        // comma-separated
  position: integer("position").notNull().default(99), // controls display order
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

// A labeled region on a specific image within a gallery photo.
// Coordinates are percentages of image dimensions (0–100).
export interface ImageRegion {
  id: string;
  imageIndex: number; // 0 = primary image, 1+ = additionalImages index
  label: string;
  cx: number; // center x, 0–100
  cy: number; // center y, 0–100
  rx: number; // x-radius, 0–100
  ry: number; // y-radius, 0–100
}

// Astrophotography gallery images with acquisition metadata.
// equipment, technique, and software are stored as comma-separated gear names
// (denormalised for simplicity — the gear library is the canonical source).
export const galleryPhotos = pgTable("gallery_photos", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull(),
  additionalImages: jsonb("additional_images").$type<string[]>(),
  regions: jsonb("regions").$type<ImageRegion[]>(),
  equipment: text("equipment").notNull().default(""),   // comma-separated
  capturedAt: text("captured_at").notNull().default(""),
  technique: text("technique").notNull().default(""),   // comma-separated
  software: text("software").notNull().default(""),     // comma-separated
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type NewGalleryPhoto = typeof galleryPhotos.$inferInsert;

// Gear library — equipment, software, and technique entries used in the
// astrophotography section. Equipment can have an image and a product link.
// The `type` field is one of: "equipment" | "software" | "technique".
export const astroGear = pgTable("astro_gear", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),   // equipment only
  link: text("link"),            // product/website link
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AstroGear = typeof astroGear.$inferSelect;
export type NewAstroGear = typeof astroGear.$inferInsert;

// Images attached to a gear item. Each image has its own description and an
// optional marquee (bounding box stored as {x,y,w,h} in 0-100 percentages).
export const gearImages = pgTable("gear_images", {
  id: serial("id").primaryKey(),
  gearId: integer("gear_id").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull().default(""),
  marquee: text("marquee"),            // JSON "{x,y,w,h}" or null
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type GearImage = typeof gearImages.$inferSelect;
export type NewGearImage = typeof gearImages.$inferInsert;

// Planned astrophotography sessions shown as callouts on the night sky map.
// targetId points at the shared sky target catalog; gearIds is a JSON array of
// astro_gear IDs to keep scheduling lightweight without a join table.
export const astroSessions = pgTable("astro_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  targetId: text("target_id").notNull(),
  targetName: text("target_name").notNull(),
  gearIds: text("gear_ids").notNull().default("[]"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AstroSession = typeof astroSessions.$inferSelect;
export type NewAstroSession = typeof astroSessions.$inferInsert;

export interface QuizMarquee {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const astroQuizzes = pgTable("astro_quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  resultHeadline: text("result_headline").notNull().default("Quiz complete"),
  resultSummary: text("result_summary").notNull().default("<p>Review your score below, then revisit the night sky map to keep exploring.</p>"),
  imageUrl: text("image_url"),
  sessionId: integer("session_id"),
  published: boolean("published").notNull().default(false),
  position: integer("position").notNull().default(99),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AstroQuiz = typeof astroQuizzes.$inferSelect;
export type NewAstroQuiz = typeof astroQuizzes.$inferInsert;

export const astroQuizQuestions = pgTable("astro_quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  question: text("question").notNull(),
  marquee: jsonb("marquee").$type<QuizMarquee | null>(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AstroQuizQuestion = typeof astroQuizQuestions.$inferSelect;
export type NewAstroQuizQuestion = typeof astroQuizQuestions.$inferInsert;

export const astroQuizOptions = pgTable("astro_quiz_options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  label: text("label").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  position: integer("position").notNull().default(0),
});

export type AstroQuizOption = typeof astroQuizOptions.$inferSelect;
export type NewAstroQuizOption = typeof astroQuizOptions.$inferInsert;

export const astroQuizAttempts = pgTable("astro_quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  readerEmail: text("reader_email").notNull(),
  readerName: text("reader_name"),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  completed: boolean("completed").notNull().default(true),
  answers: jsonb("answers").$type<Record<string, number>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AstroQuizAttempt = typeof astroQuizAttempts.$inferSelect;
export type NewAstroQuizAttempt = typeof astroQuizAttempts.$inferInsert;

export const readerProfiles = pgTable("reader_profiles", {
  email: text("email").primaryKey(),
  name: text("name"),
  image: text("image"),
  firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
});

export type ReaderProfile = typeof readerProfiles.$inferSelect;
export type NewReaderProfile = typeof readerProfiles.$inferInsert;

// Saved finder-mode previews for guided star-hopping on the sky map. Steps are
// stored as JSON: [{ targetId: string, description: string }].
export const finderPreviews = pgTable("finder_previews", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  targetId: text("target_id").notNull(),
  stepDelaySeconds: integer("step_delay_seconds").notNull().default(4),
  loop: boolean("loop").notNull().default(true),
  steps: text("steps").notNull().default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type FinderPreview = typeof finderPreviews.$inferSelect;
export type NewFinderPreview = typeof finderPreviews.$inferInsert;

// Book categories group reading-note books for filtering.
export const bookCategories = pgTable("book_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BookCategory = typeof bookCategories.$inferSelect;
export type NewBookCategory = typeof bookCategories.$inferInsert;

// Book entries are used to group public reading notes. Book reviews remain
// writing articles; these rows are the library index for note-taking.
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  yearPublished: integer("year_published").notNull(),
  categoryId: integer("category_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;

// Rich-text reading notes belong to a book. The book mapping is intentionally
// immutable through the edit API; only the note content can be changed later.
export const readingNotes = pgTable("reading_notes", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  description: text("description").notNull().default(""),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ReadingNote = typeof readingNotes.$inferSelect;
export type NewReadingNote = typeof readingNotes.$inferInsert;

// Homepage and /updates feed entries. Rows are auto-created by API routes when
// content is saved with publishAsUpdate=true. thumbnailUrl is populated when
// the content has an associated image (e.g. equipment with a photo).
export const siteUpdates = pgTable("site_updates", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  linkUrl: text("link_url"),
  thumbnailUrl: text("thumbnail_url"),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SiteUpdate = typeof siteUpdates.$inferSelect;
export type NewSiteUpdate = typeof siteUpdates.$inferInsert;

// Arbitrary key-value config store. Values are stored as JSON strings.
// Currently used to persist section tab order, labels, visibility, and theme config.
// Tab keys follow the pattern "tab-order-<section>" (e.g. "tab-order-swe").
export const siteConfig = pgTable("site_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),   // JSON-stringified
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SiteConfig = typeof siteConfig.$inferSelect;

// Reader comments on articles. New comments are unapproved by default — the admin
// must approve them (from /admin/dashboard/comments) before they appear publicly.
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  readerEmail: text("reader_email").notNull(),
  readerName: text("reader_name"),
  readerAvatarUrl: text("reader_avatar_url"),
  content: text("content").notNull(),
  approved: boolean("approved").notNull().default(false),
  country: text("country"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Comment = typeof comments.$inferSelect;

// SWE commit activity — one row per git commit, persisted from the sync pipeline.
// Allows adding manual notes and computed commit metadata.
export const sweActivity = pgTable("swe_activity", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(), // e.g. "vercel-commit-<sha>"
  type: text("type").notNull(),                       // "commit"
  message: text("message").notNull(),                 // editable display text
  repo: text("repo").notNull(),                       // repository/project name
  timestamp: timestamp("timestamp").notNull(),        // original event time
  url: text("url"),                                   // link to event
  note: text("note").notNull().default(""),           // manual context
  commitMetadata: jsonb("commit_metadata").$type<GitHubCommitMetadata>(),
  hidden: boolean("hidden").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SweActivity = typeof sweActivity.$inferSelect;
export type NewSweActivity = typeof sweActivity.$inferInsert;
