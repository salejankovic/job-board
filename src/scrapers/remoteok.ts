import type { ScrapedJob, Scraper } from "./types";

interface RemoteOKJob {
  slug: string;
  id: string;
  epoch: number;
  date: string;
  company: string;
  position: string;
  tags: string[];
  logo: string;
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  url: string;
}

export const remoteokScraper: Scraper = {
  name: "remoteok",
  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    try {
      const res = await fetch("https://remoteok.com/api", {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) return [];

      const data = (await res.json()) as RemoteOKJob[];

      // First item is metadata, skip it
      for (const item of data.slice(1)) {
        if (!item.position || !item.company) continue;

        const tags = (item.tags || []).join(",").toLowerCase();
        const title = item.position.toLowerCase();
        const desc = (item.description || "").toLowerCase();

        // Filter to marketing/PR related
        const relevant =
          title.includes("marketing") ||
          title.includes("content") ||
          title.includes("social") ||
          title.includes("seo") ||
          title.includes("copywrite") ||
          title.includes("brand") ||
          title.includes("pr ") ||
          title.includes("communications") ||
          tags.includes("marketing") ||
          tags.includes("copywriting") ||
          tags.includes("non-tech") ||
          desc.includes("marketing") ||
          desc.includes("social media");

        if (!relevant) continue;

        const salary =
          item.salary_min && item.salary_max
            ? `$${item.salary_min.toLocaleString()} - $${item.salary_max.toLocaleString()}`
            : null;

        jobs.push({
          title: item.position.substring(0, 200),
          company: item.company,
          location: item.location || "Remote",
          url: `https://remoteok.com/remote-jobs/${item.slug || item.id}`,
          source: "remoteok",
          description: (item.description || "").substring(0, 500),
          salary,
          tags: (item.tags || []).join(","),
          isRemote: true,
          postedAt: item.date || (item.epoch ? new Date(item.epoch * 1000).toISOString() : null),
        });
      }
    } catch (err) {
      console.error("RemoteOK scrape error:", err);
    }

    return jobs;
  },
};
