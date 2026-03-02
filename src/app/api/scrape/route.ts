import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { scoreAndSaveJobs } from "@/lib/relevance";
import { scrapers } from "@/scrapers";
import type { ScrapedJob } from "@/scrapers/types";

export const maxDuration = 60; // Vercel function timeout

export async function POST() {
  try {
    await initDb();

    const results: Record<string, { found: number; saved: number; error?: string }> = {};

    for (const scraper of scrapers) {
      try {
        const scrapedJobs: ScrapedJob[] = await scraper.scrape();
        const saved = await scoreAndSaveJobs(
          scrapedJobs.map((j) => ({
            ...j,
            scrapedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }))
        );
        results[scraper.name] = { found: scrapedJobs.length, saved: saved.length };
      } catch (err) {
        results[scraper.name] = {
          found: 0,
          saved: 0,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Vercel cron handler
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return POST();
}
