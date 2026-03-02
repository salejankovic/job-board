import type { NewJob } from "@/lib/schema";

export type ScrapedJob = Omit<NewJob, "id" | "relevanceScore" | "createdAt" | "scrapedAt">;

export interface Scraper {
  name: string;
  scrape(): Promise<ScrapedJob[]>;
}
