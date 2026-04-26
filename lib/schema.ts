import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";

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
