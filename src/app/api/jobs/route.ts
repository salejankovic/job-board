import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { jobs } from "@/lib/schema";
import { desc, like, eq, gte, or, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await initDb();

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const source = searchParams.get("source") || "";
    const remoteOnly = searchParams.get("remote") === "true";
    const minScore = parseInt(searchParams.get("minScore") || "0", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 50;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(jobs.title, `%${search}%`),
          like(jobs.company, `%${search}%`),
          like(jobs.description, `%${search}%`)
        )
      );
    }

    if (source) {
      conditions.push(eq(jobs.source, source));
    }

    if (remoteOnly) {
      conditions.push(eq(jobs.isRemote, true));
    }

    if (minScore > 0) {
      conditions.push(gte(jobs.relevanceScore, minScore));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [results, countResult] = await Promise.all([
      db
        .select()
        .from(jobs)
        .where(where)
        .orderBy(desc(jobs.relevanceScore), desc(jobs.scrapedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(where),
    ]);

    return NextResponse.json({
      jobs: results,
      total: countResult[0]?.count || 0,
      page,
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
