import { db } from "./db";
import { userPreferences, jobs } from "./schema";
import { eq } from "drizzle-orm";
import type { NewJob } from "./schema";

export async function getPreferences() {
  const prefs = await db.select().from(userPreferences).where(eq(userPreferences.id, 1));
  if (prefs.length === 0) return { keywords: [], excludedKeywords: [], cvKeywords: [], minRelevanceScore: 0 };
  const p = prefs[0];
  return {
    keywords: JSON.parse(p.keywords) as string[],
    excludedKeywords: JSON.parse(p.excludedKeywords) as string[],
    cvKeywords: p.cvKeywords ? (JSON.parse(p.cvKeywords) as string[]) : [],
    profileSkills: p.profileSkills ? (JSON.parse(p.profileSkills) as string[]) : [],
    minRelevanceScore: p.minRelevanceScore ?? 0,
  };
}

export function calculateRelevance(
  job: { title: string; description?: string | null; tags?: string | null },
  keywords: string[],
  excludedKeywords: string[],
  cvKeywords: string[] = [],
  profileSkills: string[] = []
): number {
  const text = `${job.title} ${job.description || ""} ${job.tags || ""}`.toLowerCase();

  // Check excluded keywords first
  for (const excluded of excludedKeywords) {
    if (excluded && text.includes(excluded.toLowerCase())) {
      return -1;
    }
  }

  // Combine all keyword sources with weights
  const allKeywords = [
    ...keywords.map((k) => ({ word: k, weight: 1 })),
    ...cvKeywords.map((k) => ({ word: k, weight: 0.8 })),
    ...profileSkills.map((k) => ({ word: k, weight: 0.6 })),
  ];

  // Deduplicate (keep highest weight)
  const keywordMap = new Map<string, number>();
  for (const { word, weight } of allKeywords) {
    if (!word) continue;
    const lower = word.toLowerCase();
    keywordMap.set(lower, Math.max(keywordMap.get(lower) || 0, weight));
  }

  if (keywordMap.size === 0) return 50;

  let score = 0;
  let maxPossible = 0;

  for (const [kw, weight] of keywordMap) {
    const titleWeight = 30 * weight;
    const descWeight = 10 * weight;
    maxPossible += titleWeight + descWeight;

    if (job.title.toLowerCase().includes(kw)) {
      score += titleWeight;
    }
    if (text.includes(kw)) {
      score += descWeight;
    }
  }

  return Math.min(100, Math.round((score / maxPossible) * 100));
}

export async function scoreAndSaveJobs(newJobs: NewJob[]) {
  const prefs = await getPreferences();
  const results = [];

  for (const job of newJobs) {
    const score = calculateRelevance(
      job,
      prefs.keywords,
      prefs.excludedKeywords,
      prefs.cvKeywords,
      prefs.profileSkills
    );
    if (score === -1) continue;

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
    const score = calculateRelevance(
      job,
      prefs.keywords,
      prefs.excludedKeywords,
      prefs.cvKeywords,
      prefs.profileSkills
    );
    await db.update(jobs).set({ relevanceScore: score }).where(eq(jobs.id, job.id));
  }
}
