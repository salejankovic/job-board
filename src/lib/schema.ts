import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  url: text("url").notNull().unique(),
  source: text("source").notNull(),
  description: text("description"),
  salary: text("salary"),
  tags: text("tags"),
  relevanceScore: real("relevance_score").default(0),
  isRemote: integer("is_remote", { mode: "boolean" }).default(false),
  postedAt: text("posted_at"), // original posting date
  scrapedAt: text("scraped_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const userPreferences = sqliteTable("user_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  keywords: text("keywords").notNull().default('["marketing","digital marketing","content","social media","PR","communications","brand","copywriting","SEO","SEM","analytics","community manager","content creator","campaign"]'),
  excludedKeywords: text("excluded_keywords").notNull().default('[]'),
  minRelevanceScore: real("min_relevance_score").default(0),
  // Profile
  profileName: text("profile_name"),
  profileSummary: text("profile_summary"), // about me, current job, what looking for
  profileSkills: text("profile_skills"), // JSON array of skills
  profilePreferences: text("profile_preferences"), // what kind of work, preferences
  // CV
  cvText: text("cv_text"), // extracted text from uploaded CV
  cvKeywords: text("cv_keywords"), // JSON array of keywords extracted from CV
});

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type UserPreference = typeof userPreferences.$inferSelect;
