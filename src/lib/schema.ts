import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  url: text("url").notNull().unique(),
  source: text("source").notNull(), // infostud, linkedin, remoteok, weworkremotely, indeed_es, indeed_gr, indeed_it
  description: text("description"),
  salary: text("salary"),
  tags: text("tags"), // comma-separated
  relevanceScore: real("relevance_score").default(0),
  isRemote: integer("is_remote", { mode: "boolean" }).default(false),
  scrapedAt: text("scraped_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const userPreferences = sqliteTable("user_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  keywords: text("keywords").notNull().default('["marketing","digital marketing","content","social media","PR","communications","brand","copywriting","SEO","SEM","analytics","community manager","content creator","campaign"]'),
  excludedKeywords: text("excluded_keywords").notNull().default('[]'),
  minRelevanceScore: real("min_relevance_score").default(0),
});

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type UserPreference = typeof userPreferences.$inferSelect;
