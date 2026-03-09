import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { userPreferences } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { rescoreAllJobs } from "@/lib/relevance";
import { PDFParse } from "pdf-parse";
// eslint-disable-next-line @typescript-eslint/no-explicit-any

// Extract keywords from CV text
function extractKeywords(text: string): string[] {
  const relevantTerms = new Set<string>();

  // Common marketing/PR skills and tools to look for
  const knownSkills = [
    "marketing", "digital marketing", "content marketing", "social media",
    "SEO", "SEM", "PPC", "Google Ads", "Facebook Ads", "Meta Ads",
    "analytics", "Google Analytics", "copywriting", "PR", "public relations",
    "communications", "brand", "branding", "strategy", "campaign",
    "email marketing", "CRM", "HubSpot", "Salesforce", "Mailchimp",
    "Adobe", "Photoshop", "Canva", "Figma", "WordPress",
    "content creation", "video", "photography", "editing",
    "project management", "Asana", "Trello", "Jira",
    "market research", "data analysis", "reporting", "KPI",
    "community management", "influencer", "affiliate",
    "B2B", "B2C", "lead generation", "conversion",
    "JavaScript", "Python", "SQL", "Excel", "PowerPoint",
    "English", "Serbian", "Spanish", "Italian", "Greek",
  ];

  const lowerText = text.toLowerCase();
  for (const skill of knownSkills) {
    if (lowerText.includes(skill.toLowerCase())) {
      relevantTerms.add(skill);
    }
  }

  // Also extract capitalized phrases (likely proper nouns, tools, companies)
  const capitalizedPattern = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g;
  let match;
  while ((match = capitalizedPattern.exec(text)) !== null) {
    const term = match[1];
    if (term.length > 2 && term.length < 30) {
      relevantTerms.add(term);
    }
  }

  return Array.from(relevantTerms).slice(0, 50); // Cap at 50 keywords
}

export async function POST(request: NextRequest) {
  try {
    await initDb();

    const formData = await request.formData();
    const file = formData.get("cv") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    let extractedText = "";

    if (file.type === "application/pdf") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parser = new PDFParse(buffer) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      await parser.load();
      extractedText = await parser.getText();
    } else if (
      file.type === "text/plain" ||
      file.name.endsWith(".txt")
    ) {
      extractedText = await file.text();
    } else {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload a PDF or TXT file." },
        { status: 400 }
      );
    }

    const cvKeywords = extractKeywords(extractedText);

    // Save to preferences
    await db
      .update(userPreferences)
      .set({
        cvText: extractedText.substring(0, 10000), // Cap stored text
        cvKeywords: JSON.stringify(cvKeywords),
      })
      .where(eq(userPreferences.id, 1));

    // Rescore jobs with new CV keywords
    await rescoreAllJobs();

    return NextResponse.json({
      success: true,
      extractedKeywords: cvKeywords,
      textLength: extractedText.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
