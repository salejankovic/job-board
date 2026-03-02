import { infostudScraper } from "./infostud";
import { linkedinScraper } from "./linkedin";
import { remoteokScraper } from "./remoteok";
import { weworkremotelyScraper } from "./weworkremotely";
import { indeedScraper as jobicyScraper } from "./indeed";
import type { Scraper } from "./types";

export const scrapers: Scraper[] = [
  infostudScraper,
  linkedinScraper,
  remoteokScraper,
  weworkremotelyScraper,
  jobicyScraper,
];

export { infostudScraper, linkedinScraper, remoteokScraper, weworkremotelyScraper, jobicyScraper };
