import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { userPreferences } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { rescoreAllJobs } from "@/lib/relevance";

export async function GET() {
  try {
    await initDb();
    const prefs = await db.select().from(userPreferences).where(eq(userPreferences.id, 1));
    if (prefs.length === 0) {
      return NextResponse.json({ keywords: [], excludedKeywords: [], minRelevanceScore: 0 });
    }
    return NextResponse.json({
      keywords: JSON.parse(prefs[0].keywords),
      excludedKeywords: JSON.parse(prefs[0].excludedKeywords),
      minRelevanceScore: prefs[0].minRelevanceScore,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await initDb();
    const body = await request.json();
    const { keywords, excludedKeywords, minRelevanceScore } = body;

    await db
      .update(userPreferences)
      .set({
        keywords: JSON.stringify(keywords || []),
        excludedKeywords: JSON.stringify(excludedKeywords || []),
        minRelevanceScore: minRelevanceScore ?? 0,
      })
      .where(eq(userPreferences.id, 1));

    // Rescore all jobs with new preferences
    await rescoreAllJobs();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
