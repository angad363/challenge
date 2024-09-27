/* trunk-ignore-all(prettier) */
import { parse } from 'fast-csv';
import fs from 'fs';
import { CheerioCrawler, Dataset } from 'crawlee';
import { CheerioAPI } from 'cheerio';
import { writeFile } from 'fs/promises';
import path from 'path';
import fsExtra from 'fs-extra';
import { CSV_INPUT_PATH, JSON_OUTPUT_PATH } from './resources';

interface Company {
  name: string;
  url: string;
  description?: string;
  founded?: string;
  teamSize?: number;
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
  linkedIn?: string;
}

interface LaunchPost {
  title: string;
}

const ensureOutputDirectory = async (): Promise<void> => {
  const outDir = path.dirname(JSON_OUTPUT_PATH);
  await fsExtra.ensureDir(outDir);
  console.log(`Ensured output directory exists: ${outDir}`);
};

export const processCompanyList = async (): Promise<void> => {
  try {
    const companies = await parseCSV(CSV_INPUT_PATH);
    console.log(`Parsed ${companies.length} companies from CSV`);

    const crawler = new CheerioCrawler({
      requestHandler: async ({ $, request }) => {
        await scrapeCompanyPage($, request.url);
      },
    });

    await crawler.run(companies.map(company => company.url));

    const dataset = await Dataset.open();
    const { items } = await dataset.getData();

    await fsExtra.ensureDir('out');
    await fsExtra.writeJson(JSON_OUTPUT_PATH, items, { spaces: 2 });
    console.log(`Wrote ${items.length} companies to ${JSON_OUTPUT_PATH}`);
  } catch (error) {
    console.error('Error processing company list:', error);
  }
};

const parseCSV = async (): Promise<Company[]> => {
  return new Promise((resolve, reject) => {
    const companies: Company[] = [];
    fs.createReadStream(CSV_INPUT_PATH)
      .pipe(parse({ headers: true }))
      .on('error', error => reject(error))
      .on('data', (row: { 'Company Name': string; 'YC URL': string }) => {
        companies.push({
          name: row['Company Name'],
          url: row['YC URL']
        });
      })
      .on('end', () => resolve(companies));
  });
};

const scrapeCompanyPage = async ($: CheerioAPI, url: string): Promise<void> => {
  // Company name
  const name = $('meta[name="title"]').attr('content')?.split(':')[0].trim() || '';

  // Short description
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const description = metaDescription.split('.')[0].trim();

  // Founded year
  const foundedMatch = metaDescription.match(/Founded in (\d{4})/);
  const founded = foundedMatch ? foundedMatch[1] : '';

  // Team size
  const teamSizeMatch = metaDescription.match(/has (\d+) employees/);
  const teamSize = teamSizeMatch ? parseInt(teamSizeMatch[1], 10) : undefined;

  // Location
  const locationMatch = metaDescription.match(/based in ([^\.]+)/);
  const location = locationMatch ? locationMatch[1].trim() : '';

  // Founders
  const foundersMatch = metaDescription.match(/Founded in \d{4} by ([^,]+)/);
  const founders = foundersMatch
    ? foundersMatch[1].split(' and ').map((name: string) => ({ name: name.trim() }))
    : [];

  // Jobs
  const jobsMatch = metaDescription.match(/hiring for (\d+) roles? in ([^\.]+)/);
  const jobs = jobsMatch
    ? [{ role: jobsMatch[2].trim(), openPositions: parseInt(jobsMatch[1], 10) }]
    : [];

  // Launch post URL (if available)
  const launchPostUrl = $('a:contains("Launch YC")').attr('href');

  // Push the scraped data to the dataset
  await Dataset.pushData({
    name,
    url,
    description,
    founded,
    teamSize,
    location,
    founders,
    jobs,
    launchPostUrl,
  });

  console.log(`Scraped data for ${name}`);
};



const scrapeLaunchPost = async (url: string): Promise<void> => {
  const crawler = new CheerioCrawler({
    requestHandler: async ({ $ }) => {
      const title = $('h1').first().text().trim();
      const content = $('div.prose').text().trim();
      await Dataset.pushData({ title, content, url });
    },
  });

  await crawler.run([url]);
};