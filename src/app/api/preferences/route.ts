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
      return NextResponse.json({
        keywords: [],
        excludedKeywords: [],
        minRelevanceScore: 0,
        profileName: "",
        profileSummary: "",
        profileSkills: [],
        profilePreferences: "",
        cvText: "",
        cvKeywords: [],
      });
    }
    const p = prefs[0];
    return NextResponse.json({
      keywords: JSON.parse(p.keywords),
      excludedKeywords: JSON.parse(p.excludedKeywords),
      minRelevanceScore: p.minRelevanceScore,
      profileName: p.profileName || "",
      profileSummary: p.profileSummary || "",
      profileSkills: p.profileSkills ? JSON.parse(p.profileSkills) : [],
      profilePreferences: p.profilePreferences || "",
      cvText: p.cvText || "",
      cvKeywords: p.cvKeywords ? JSON.parse(p.cvKeywords) : [],
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
    const {
      keywords,
      excludedKeywords,
      minRelevanceScore,
      profileName,
      profileSummary,
      profileSkills,
      profilePreferences,
      cvText,
      cvKeywords,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (keywords !== undefined) updateData.keywords = JSON.stringify(keywords);
    if (excludedKeywords !== undefined) updateData.excludedKeywords = JSON.stringify(excludedKeywords);
    if (minRelevanceScore !== undefined) updateData.minRelevanceScore = minRelevanceScore;
    if (profileName !== undefined) updateData.profileName = profileName;
    if (profileSummary !== undefined) updateData.profileSummary = profileSummary;
    if (profileSkills !== undefined) updateData.profileSkills = JSON.stringify(profileSkills);
    if (profilePreferences !== undefined) updateData.profilePreferences = profilePreferences;
    if (cvText !== undefined) updateData.cvText = cvText;
    if (cvKeywords !== undefined) updateData.cvKeywords = JSON.stringify(cvKeywords);

    await db
      .update(userPreferences)
      .set(updateData)
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
