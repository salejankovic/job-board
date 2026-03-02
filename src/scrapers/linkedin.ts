import * as cheerio from "cheerio";
import type { ScrapedJob, Scraper } from "./types";

// LinkedIn public job search (no auth needed)
const QUERIES = ["marketing", "PR communications", "social media", "content marketing", "digital marketing"];

// geoId for Serbia: 101855366, f_WT=2 for remote
const SEARCHES = [
  ...QUERIES.map((q) => ({
    query: q,
    url: `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(q)}&location=Serbia&geoId=101855366&position=1&pageNum=0`,
    remote: false,
  })),
  ...QUERIES.map((q) => ({
    query: q,
    url: `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(q)}&f_WT=2&position=1&pageNum=0`,
    remote: true,
  })),
];

export const linkedinScraper: Scraper = {
  name: "linkedin",
  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    for (const search of SEARCHES) {
      try {
        const res = await fetch(search.url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml",
          },
        });

        if (!res.ok) continue;

        const html = await res.text();
        const $ = cheerio.load(html);

        // LinkedIn public job cards
        $(".base-card, .job-search-card, .base-search-card").each((_, el) => {
          const $el = $(el);
          const title =
            $el.find(".base-search-card__title, h3").first().text().trim();
          const company =
            $el.find(".base-search-card__subtitle, h4").first().text().trim();
          const location =
            $el.find(".job-search-card__location, .base-search-card__metadata span").first().text().trim();
          const href =
            $el.find("a").first().attr("href") || $el.attr("data-entity-urn") || "";

          if (title && href) {
            const cleanUrl = href.split("?")[0]; // Remove tracking params
            jobs.push({
              title: title.substring(0, 200),
              company: company || "Unknown",
              location: location || (search.remote ? "Remote" : "Serbia"),
              url: cleanUrl.startsWith("http") ? cleanUrl : `https://www.linkedin.com${cleanUrl}`,
              source: "linkedin",
              description: null,
              salary: null,
              tags: search.query,
              isRemote: search.remote || location.toLowerCase().includes("remote"),
            });
          }
        });

        // Rate limit between requests
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        console.error(`LinkedIn scrape error for "${search.query}":`, err);
      }
    }

    const unique = new Map<string, ScrapedJob>();
    for (const job of jobs) {
      unique.set(job.url, job);
    }
    return Array.from(unique.values());
  },
};
