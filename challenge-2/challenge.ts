import { CheerioCrawler, Dataset } from "crawlee";
import { parse, parseString } from "fast-csv";
import * as fs from "fs/promises";
import * as fsExtra from "fs-extra";
import * as cheerio from 'cheerio';
import { CSV_INPUT_PATH, JSON_OUTPUT_PATH } from "./resources";

interface Company {
  name: string;
  url: string;
  description?: string;
  founded?: string;
  teamSize?: string;
  jobs?: Job[];
  founders?: Founder[];
  launchPosts?: LaunchPost[];
}

interface Job {
  role: string;
  location: string;
}

interface Founder {
  name: string;
  role?: string;
  bio?: string;
  linkedIn?: string;
  twitter?: string;
}

interface LaunchPost {
  title: string;
  url: string;
  date?: string;
}

const parseCSV = async (): Promise<Company[]> => {
  const companies: Company[] = [];
  const fileContent = await fs.readFile(CSV_INPUT_PATH, "utf-8");

  return new Promise((resolve, reject) => {
    parseString(fileContent, { headers: true })
      .on("data", (row) => {
        if (row["YC URL"]) {
          companies.push({
            name: row["Company Name"] || "",
            url: row["YC URL"],
          });
        } else {
          console.warn(`Skipping row with no URL:`, row);
        }
      })
      .on("end", () => {
        console.log(`Parsed ${companies.length} companies from CSV`);
        resolve(companies);
      })
      .on("error", reject);
  });
};

const extractCompanyInfo = ($: cheerio.CheerioAPI): Partial<Company> => {
  const companyInfo: Partial<Company> = {};

  // Log the full HTML content for debugging
  console.log("Full HTML content:", $.html());

  companyInfo.name =
    $('.text-lg.font-bold').first().text().trim() ||
    $('h1').first().text().trim() ||
    $('meta[name="name"]').attr('content')?.trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    '';
  companyInfo.description =
    $("h2").first().text().trim() ||
    $('meta[name="description"]').attr("content")?.trim();

  $(".space-y-0\\.5 .flex.flex-row.justify-between").each((_, el) => {
    const label = $(el).find("span").first().text().trim();
    const value = $(el).find("span").last().text().trim();
    if (label === "Founded:") companyInfo.founded = value;
    else if (label === "Team Size:") companyInfo.teamSize = value;
    else if (label === "Location:") companyInfo.location = value;
  });

// Extract founders
$('h3:contains("Active Founders")').nextAll('.space-y-5').first().children('.flex.flex-row.flex-col').each((_, el) => {
  const name = $(el).find('h3.text-lg.font-bold').text().trim().split(',')[0];
  const role = $(el).find('h3.text-lg.font-bold').text().trim().split(',')[1]?.trim();
  const bio = $(el).find('p.prose.max-w-full').text().trim();
  const linkedIn = $(el).find('a[href*="linkedin.com"]').attr('href');
  const twitter = $(el).find('a[href*="twitter.com"]').attr('href');

  if (name) {
    companyInfo.founders.push({ name, role, bio, linkedIn, twitter });
  }
});

  companyInfo.jobs = [];
  $('h3:contains("Jobs at")')
    .next()
    .find("li")
    .each((_: any, el: any) => {
      const role = $(el).find("a").text().trim();
      const location = $(el).find("span").text().trim();
      if (role) {
        companyInfo.jobs.push({ role, location });
      }
    });

  companyInfo.founders = [];
  $(".founder").each((_: any, el: any) => {
    const name = $(el).find("h3").text().trim();
    const bio = $(el).find("p").text().trim();
    if (name) {
      companyInfo.founders.push({ name, bio });
    }
  });

  companyInfo.latestNews = [];
  $("#news .ycdc-with-link-color").each((_, el) => {
    const title = $(el).find("a").text().trim();
    const url = $(el).find("a").attr("href");
    const date = $(el).next(".text-sm").text().trim();
    if (title && url) {
      companyInfo.latestNews.push({ title, url, date });
    }
  });

  return companyInfo;
};

export const processCompanyList = async (): Promise<void> => {
  console.log("Starting processCompanyList");
  const companies = await parseCSV();
  console.log(`Parsed ${companies.length} companies`);

  const crawler = new CheerioCrawler({
    async requestHandler({ $, request }) {
      console.log(`Processing ${request.url}`);
      try {
        const companyInfo = extractCompanyInfo($);
        console.log(
          `Extracted info for ${companyInfo.name || "unknown company"}:`,
          JSON.stringify(companyInfo, null, 2),
);

        if (Object.keys(companyInfo).length <= 1) {
          console.log("Full HTML content:", $.html());
        }

        await Dataset.pushData({ url: request.url, ...companyInfo });
      } catch (error) {
        console.error(`Error processing ${request.url}:`, error);
        console.log("Full HTML content:", $.html());
      }
    },
    maxConcurrency: 2,
    maxRequestsPerCrawl: companies.length,
    requestHandlerTimeoutSecs: 60,
  });

  console.log("Starting crawler");
  await crawler.run(companies.map((company) => company.url));
  console.log("Crawler finished");

  const scrapedData = await Dataset.open();
  const items = await scrapedData.getData();

  await fsExtra.ensureDir("out");
  await fs.writeFile(JSON_OUTPUT_PATH, JSON.stringify(items.items, null, 2));
  console.log(`Wrote ${items.items.length} items to JSON file`);
};
