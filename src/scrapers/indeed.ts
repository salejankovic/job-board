import * as cheerio from "cheerio";
import type { ScrapedJob, Scraper } from "./types";

const QUERIES = ["marketing", "social media", "content", "PR", "digital marketing", "SEO"];

const COUNTRIES = [
  { code: "es", domain: "es.indeed.com", name: "Spain" },
  { code: "gr", domain: "gr.indeed.com", name: "Greece" },
  { code: "it", domain: "it.indeed.com", name: "Italy" },
];

export const indeedScraper: Scraper = {
  name: "indeed",
  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    for (const country of COUNTRIES) {
      for (const query of QUERIES) {
        try {
          // Use English query on local Indeed domain
          const url = `https://${country.domain}/jobs?q=${encodeURIComponent(query)}&l=&lang=en`;
          const res = await fetch(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept-Language": "en-US,en;q=0.9",
            },
          });

          if (!res.ok) continue;

          const html = await res.text();
          const $ = cheerio.load(html);

          // Indeed job cards
          $(".job_seen_beacon, .jobsearch-ResultsList .result, .tapItem, [data-jk]").each(
            (_, el) => {
              const $el = $(el);
              const title =
                $el.find("h2 a span, .jobTitle span, h2.jobTitle").first().text().trim();
              const company =
                $el.find("[data-testid='company-name'], .companyName, .company").first().text().trim();
              const location =
                $el.find("[data-testid='text-location'], .companyLocation, .location").first().text().trim();
              const href =
                $el.find("h2 a, a.jcs-JobTitle").first().attr("href") || "";
              const salary =
                $el.find(".salary-snippet-container, .estimated-salary, .metadata.salary-snippet-container").first().text().trim() || null;

              if (title && title.length > 3) {
                const fullUrl = href.startsWith("http")
                  ? href
                  : `https://${country.domain}${href}`;
                jobs.push({
                  title: title.substring(0, 200),
                  company: company || "Unknown",
                  location: location || country.name,
                  url: fullUrl,
                  source: `indeed_${country.code}`,
                  description: null,
                  salary,
                  tags: query,
                  isRemote: false,
                });
              }
            }
          );

          // Rate limit
          await new Promise((r) => setTimeout(r, 2000));
        } catch (err) {
          console.error(`Indeed ${country.code} scrape error for "${query}":`, err);
        }
      }
    }

    const unique = new Map<string, ScrapedJob>();
    for (const job of jobs) {
      unique.set(job.url, job);
    }
    return Array.from(unique.values());
  },
};
