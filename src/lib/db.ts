import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export async function initDb() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT,
      url TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL,
      description TEXT,
      salary TEXT,
      tags TEXT,
      relevance_score REAL DEFAULT 0,
      is_remote INTEGER DEFAULT 0,
      posted_at TEXT,
      scraped_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keywords TEXT NOT NULL DEFAULT '["marketing","digital marketing","content","social media","PR","communications","brand","copywriting","SEO","SEM","analytics","community manager","content creator","campaign"]',
      excluded_keywords TEXT NOT NULL DEFAULT '[]',
      min_relevance_score REAL DEFAULT 0,
      profile_name TEXT,
      profile_summary TEXT,
      profile_skills TEXT,
      profile_preferences TEXT,
      cv_text TEXT,
      cv_keywords TEXT
    );
    INSERT OR IGNORE INTO user_preferences (id, keywords, excluded_keywords, min_relevance_score)
    VALUES (1, '["marketing","digital marketing","content","social media","PR","communications","brand","copywriting","SEO","SEM","analytics","community manager","content creator","campaign"]', '[]', 0);
  `);
  // Add new columns if they don't exist (for existing databases)
  const migrations = [
    "ALTER TABLE jobs ADD COLUMN posted_at TEXT",
    "ALTER TABLE user_preferences ADD COLUMN profile_name TEXT",
    "ALTER TABLE user_preferences ADD COLUMN profile_summary TEXT",
    "ALTER TABLE user_preferences ADD COLUMN profile_skills TEXT",
    "ALTER TABLE user_preferences ADD COLUMN profile_preferences TEXT",
    "ALTER TABLE user_preferences ADD COLUMN cv_text TEXT",
    "ALTER TABLE user_preferences ADD COLUMN cv_keywords TEXT",
  ];
  for (const sql of migrations) {
    try {
      await client.execute(sql);
    } catch {
      // Column already exists, ignore
    }
  }
}
