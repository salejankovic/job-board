import type { ScrapedJob, Scraper } from "./types";

// Replace Indeed (which blocks scrapers) with Jobicy API
// Jobicy provides remote jobs with good European coverage

interface JobicyJob {
  id: number;
  jobTitle: string;
  companyName: string;
  jobGeo: string;
  jobLevel: string;
  jobType: string[];
  jobIndustry: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  jobExcerpt: string;
  pubDate: string;
  url: string;
}

const TAGS = ["marketing", "copywriting", "social-media", "seo", "content"];

// Map Jobicy geo to our source labels
function getSource(geo: string): string {
  const g = geo.toLowerCase();
  if (g.includes("spain") || g.includes("españa")) return "jobicy_es";
  if (g.includes("greece") || g.includes("ελλάδα")) return "jobicy_gr";
  if (g.includes("italy") || g.includes("italia")) return "jobicy_it";
  if (g.includes("europe") || g.includes("emea")) return "jobicy_eu";
  return "jobicy";
}

export const indeedScraper: Scraper = {
  name: "jobicy",
  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    for (const tag of TAGS) {
      try {
        const url = `https://jobicy.com/api/v2/remote-jobs?count=50&tag=${tag}`;
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });

        if (!res.ok) continue;

        const data = await res.json();
        const jobList = (data.jobs || []) as JobicyJob[];

        for (const item of jobList) {
          const salary =
            item.salaryMin && item.salaryMax
              ? `${item.salaryCurrency || "$"}${item.salaryMin.toLocaleString()} - ${item.salaryCurrency || "$"}${item.salaryMax.toLocaleString()}`
              : null;

          jobs.push({
            title: item.jobTitle.substring(0, 200),
            company: item.companyName,
            location: item.jobGeo || "Remote",
            url: item.url,
            source: getSource(item.jobGeo || ""),
            description: (item.jobExcerpt || "").substring(0, 500),
            salary,
            tags: tag,
            isRemote: true,
            postedAt: item.pubDate || null,
          });
        }

        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        console.error(`Jobicy scrape error for "${tag}":`, err);
      }
    }

    const unique = new Map<string, ScrapedJob>();
    for (const job of jobs) {
      unique.set(job.url, job);
    }
    return Array.from(unique.values());
  },
};
