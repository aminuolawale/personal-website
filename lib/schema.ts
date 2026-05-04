import { pgTable, serial, text, boolean, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";

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
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;

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

// Astrophotography gallery images with acquisition metadata.
// equipment, technique, and software are stored as comma-separated gear names
// (denormalised for simplicity — the gear library is the canonical source).
export const galleryPhotos = pgTable("gallery_photos", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull(),
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
// Currently used to persist tab order for the SWE and Astrophotography sections.
// Keys follow the pattern "tab-order-<section>" (e.g. "tab-order-swe").
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
