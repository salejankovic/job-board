import * as cheerio from "cheerio";
import type { ScrapedJob, Scraper } from "./types";

const SEARCH_QUERIES = ["marketing", "PR", "social media", "content", "copywriting", "SEO"];
const BASE_URL = "https://poslovi.infostud.com";

export const infostudScraper: Scraper = {
  name: "infostud",
  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    for (const query of SEARCH_QUERIES) {
      try {
        const url = `${BASE_URL}/posao?keyword=${encodeURIComponent(query)}&city=Beograd`;
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "sr-Latn-RS,sr;q=0.9,en;q=0.8",
          },
        });

        if (!res.ok) continue;

        const html = await res.text();
        const $ = cheerio.load(html);

        $("a[href*='/posao/']").each((_, el) => {
          const $el = $(el);
          const title = $el.find("h2, .job-title, .title").first().text().trim() ||
            $el.text().trim();
          const company = $el.find(".company, .employer").first().text().trim() || "Unknown";
          const href = $el.attr("href");
          const location = $el.find(".location, .city").first().text().trim() || "Belgrade, Serbia";

          if (title && href && title.length > 3) {
            const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
            jobs.push({
              title: title.substring(0, 200),
              company: company.substring(0, 100),
              location,
              url: fullUrl,
              source: "infostud",
              description: null,
              salary: null,
              tags: query,
              isRemote: false,
            });
          }
        });
      } catch (err) {
        console.error(`Infostud scrape error for "${query}":`, err);
      }
    }

    // Deduplicate by URL
    const unique = new Map<string, ScrapedJob>();
    for (const job of jobs) {
      unique.set(job.url, job);
    }
    return Array.from(unique.values());
  },
};
