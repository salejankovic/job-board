import { db } from "./db";
import { userPreferences, jobs } from "./schema";
import { eq } from "drizzle-orm";
import type { NewJob } from "./schema";

export async function getPreferences() {
  const prefs = await db.select().from(userPreferences).where(eq(userPreferences.id, 1));
  if (prefs.length === 0) return { keywords: [], excludedKeywords: [], minRelevanceScore: 0 };
  const p = prefs[0];
  return {
    keywords: JSON.parse(p.keywords) as string[],
    excludedKeywords: JSON.parse(p.excludedKeywords) as string[],
    minRelevanceScore: p.minRelevanceScore ?? 0,
  };
}

export function calculateRelevance(
  job: { title: string; description?: string | null; tags?: string | null },
  keywords: string[],
  excludedKeywords: string[]
): number {
  const text = `${job.title} ${job.description || ""} ${job.tags || ""}`.toLowerCase();

  // Check excluded keywords first
  for (const excluded of excludedKeywords) {
    if (excluded && text.includes(excluded.toLowerCase())) {
      return -1; // Mark as excluded
    }
  }

  if (keywords.length === 0) return 50; // No keywords = neutral score

  let score = 0;
  let matches = 0;

  for (const keyword of keywords) {
    if (!keyword) continue;
    const kw = keyword.toLowerCase();
    // Title match worth more
    if (job.title.toLowerCase().includes(kw)) {
      score += 30;
      matches++;
    }
    // Description match
    if (text.includes(kw)) {
      score += 10;
      matches++;
    }
  }

  // Normalize to 0-100
  const maxPossible = keywords.length * 40;
  return Math.min(100, Math.round((score / maxPossible) * 100));
}

export async function scoreAndSaveJobs(newJobs: NewJob[]) {
  const prefs = await getPreferences();
  const results = [];

  for (const job of newJobs) {
    const score = calculateRelevance(job, prefs.keywords, prefs.excludedKeywords);
    if (score === -1) continue; // Skip excluded jobs

    const jobWithScore = {
      ...job,
      relevanceScore: score,
      scrapedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      await db.insert(jobs).values(jobWithScore).onConflictDoNothing();
      results.push(jobWithScore);
    } catch {
      // Duplicate URL, skip
    }
  }

  return results;
}

export async function rescoreAllJobs() {
  const prefs = await getPreferences();
  const allJobs = await db.select().from(jobs);

  for (const job of allJobs) {
    const score = calculateRelevance(job, prefs.keywords, prefs.excludedKeywords);
    await db.update(jobs).set({ relevanceScore: score }).where(eq(jobs.id, job.id));
  }
}
