import { infostudScraper } from "./infostud";
import { linkedinScraper } from "./linkedin";
import { remoteokScraper } from "./remoteok";
import { weworkremotelyScraper } from "./weworkremotely";
import { indeedScraper } from "./indeed";
import type { Scraper } from "./types";

export const scrapers: Scraper[] = [
  infostudScraper,
  linkedinScraper,
  remoteokScraper,
  weworkremotelyScraper,
  indeedScraper,
];

export { infostudScraper, linkedinScraper, remoteokScraper, weworkremotelyScraper, indeedScraper };
