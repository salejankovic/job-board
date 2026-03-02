import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { jobs } from "@/lib/schema";
import { desc, asc, like, eq, gte, or, and, sql } from "drizzle-orm";

// Tab-to-filter mapping
const TAB_FILTERS: Record<string, (typeof jobs)["_"]["columns"]> = {};

function getTabCondition(tab: string) {
  switch (tab) {
    case "belgrade":
      return or(
        like(jobs.location, "%Belgrade%"),
        like(jobs.location, "%Beograd%"),
        like(jobs.location, "%Serbia%"),
        eq(jobs.source, "infostud")
      );
    case "remote":
      return eq(jobs.isRemote, true);
    case "italy":
      return or(
        like(jobs.location, "%Italy%"),
        like(jobs.location, "%Italia%"),
        like(jobs.location, "%Milan%"),
        like(jobs.location, "%Rome%"),
        eq(jobs.source, "jobicy_it")
      );
    case "spain":
      return or(
        like(jobs.location, "%Spain%"),
        like(jobs.location, "%España%"),
        like(jobs.location, "%Madrid%"),
        like(jobs.location, "%Barcelona%"),
        eq(jobs.source, "jobicy_es")
      );
    case "greece":
      return or(
        like(jobs.location, "%Greece%"),
        like(jobs.location, "%Athens%"),
        eq(jobs.source, "jobicy_gr")
      );
    default:
      return undefined;
  }
}

export async function GET(request: NextRequest) {
  try {
    await initDb();

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const source = searchParams.get("source") || "";
    const tab = searchParams.get("tab") || "";
    const remoteOnly = searchParams.get("remote") === "true";
    const minScore = parseInt(searchParams.get("minScore") || "0", 10);
    const sortBy = searchParams.get("sort") || "relevance"; // "relevance" or "date"
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

    if (tab) {
      const tabCondition = getTabCondition(tab);
      if (tabCondition) conditions.push(tabCondition);
    }

    if (remoteOnly) {
      conditions.push(eq(jobs.isRemote, true));
    }

    if (minScore > 0) {
      conditions.push(gte(jobs.relevanceScore, minScore));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy =
      sortBy === "date"
        ? [desc(jobs.scrapedAt), desc(jobs.relevanceScore)]
        : [desc(jobs.relevanceScore), desc(jobs.scrapedAt)];

    const [results, countResult] = await Promise.all([
      db
        .select()
        .from(jobs)
        .where(where)
        .orderBy(...orderBy)
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
