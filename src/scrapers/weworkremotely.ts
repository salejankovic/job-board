import * as cheerio from "cheerio";
import type { ScrapedJob, Scraper } from "./types";

// WeWorkRemotely categories relevant to marketing
const CATEGORIES = [
  "https://weworkremotely.com/categories/remote-copywriting-jobs",
  "https://weworkremotely.com/categories/remote-marketing-jobs",
  "https://weworkremotely.com/remote-jobs/search?term=marketing",
  "https://weworkremotely.com/remote-jobs/search?term=social+media",
  "https://weworkremotely.com/remote-jobs/search?term=content",
];

export const weworkremotelyScraper: Scraper = {
  name: "weworkremotely",
  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    for (const categoryUrl of CATEGORIES) {
      try {
        const res = await fetch(categoryUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });

        if (!res.ok) continue;

        const html = await res.text();
        const $ = cheerio.load(html);

        $("li.feature, section.jobs article li").each((_, el) => {
          const $el = $(el);
          const $link = $el.find("a").last();
          const href = $link.attr("href");
          const title =
            $el.find(".title, h3").first().text().trim() ||
            $link.text().trim();
          const company =
            $el.find(".company, h2 span.company").first().text().trim() || "Unknown";
          const location =
            $el.find(".region, .location").first().text().trim() || "Remote";

          if (title && href && title.length > 3) {
            const fullUrl = href.startsWith("http")
              ? href
              : `https://weworkremotely.com${href}`;
            jobs.push({
              title: title.substring(0, 200),
              company: company.substring(0, 100),
              location,
              url: fullUrl,
              source: "weworkremotely",
              description: null,
              salary: null,
              tags: "remote",
              isRemote: true,
            });
          }
        });

        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        console.error(`WeWorkRemotely scrape error:`, err);
      }
    }

    const unique = new Map<string, ScrapedJob>();
    for (const job of jobs) {
      unique.set(job.url, job);
    }
    return Array.from(unique.values());
  },
};
