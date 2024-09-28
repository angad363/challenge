import { CheerioCrawler, Dataset } from 'crawlee';
import { CheerioAPI } from 'cheerio';
import { parse } from 'fast-csv';
import fs from 'fs';
import path from 'path';
import fsExtra from 'fs-extra';
import { CSV_INPUT_PATH, JSON_OUTPUT_PATH } from './resources';
import { title } from 'process';

/**
 * Represents a company from the CSV file
 * @interface CSVCompany
 */
interface CSVCompany {
  name: string;
  url: string;
}

/**
 * Represents a fully scraped company with all its details
 * @interface Company
 */
interface Company {
  name: string;
  description: string;
  website: string;
  yearFounded: string;
  teamSize: string;
  founders: Founder[];
  jobs: Job[];
  newsItems: NewsItem[];
  launchPost?: LaunchPost;
}

/**
 * Represents a founder of a company
 * @interface Founder
 */
interface Founder {
  fullName: string;
  title: string;
  bio: string;
  linkedin?: string;
  twitter?: string;
}

/**
 * Represents a job posting for a company
 * @interface Job
 */
interface Job {
  title: string;
  location: string;
  type: string;
  salaryRange: number;
  equityRange: number;
  minExperience: string;
}

/**
 * Represents a news item related to a company
 * @interface NewsItem
 */
interface NewsItem {
  title: string;
  url: string;
  date: string;
}

/**
 * Represents a user associated with a launch post
 * @interface LaunchPostUser
 */
interface LaunchPostUser {
  name: string;
}

/**
 * Represents a launch post for a company
 * @interface LaunchPost
 */
interface LaunchPost {
  title: string;
  url: string;
  twitter_share_url: string;
  body: string;
  tagline: string;
  user: LaunchPostUser;
}

/**
 * Parses the CSV file containing company information
 * @param {string} CSV_INPUT_PATH - The path to the CSV file
 * @returns {Promise<CSVCompany[]>} A promise that resolves to an array of CSVCompany objects
 */
const parseCSV = async (CSV_INPUT_PATH: string): Promise<CSVCompany[]> => {
  return new Promise((resolve, reject) => {
    const companies: CSVCompany[] = [];
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

/**
 * Scrapes a company page and extracts relevant information
 * @param {CheerioAPI} $ - The Cheerio API instance
 * @param {string} url - The URL of the company page
 * @returns {Company} An object containing the scraped company information
 */
const scrapeCompanyPage = ($: CheerioAPI, url: string): Company => {
  // Find the div with the data-page attribute
  const dataPageDiv = $('div[data-page]');

  // Parse the JSON data
  const pageData = JSON.parse(dataPageDiv.attr('data-page') || '{}');

  // Extract the company information from the parsed data
  const name = pageData.props.company.name || '';
  const description = pageData.props.company.long_description || '';
  const website = pageData.props.company.website || '';
  const yearFounded = pageData.props.company.year_founded || '';
  const teamSize = pageData.props.company.team_size || '';

  // Extract founders information
  const founders: Founder[] = (pageData.props.company.founders || []).map((founder: any) => ({
    fullName: founder.full_name || '',
    title: founder.title || '',
    bio: founder.founder_bio || '',
    linkedin: founder.linkedin_url || '',
    twitter: founder.twitter_url || '',
  }));

  // Extract jobs information
  const jobs: Job[] = (pageData.props.jobPostings || []).map((job: any) => ({
    title: job.title || '',
    location: job.location || '',
    type: job.type || '',
    salaryRange: job.salaryRange || '',
    equityRange: job.equityRange || '',
    minExperience: job.minExperience || '',
  }));

  // Extract news items
  const newsItems: NewsItem[] = (pageData.props.newsItems || []).map((item: any) => ({
    title: item.title || '',
    url: item.url || '',
    date: item.date || '',
  }));

  // Extract launch post information if available
  let launchPost: LaunchPost | undefined;
  if (pageData.props.launches && pageData.props.launches.length > 0) {
    const launch = pageData.props.launches[0];
    launchPost = {
      title: launch.title || '',
      url: launch.url || '',
      twitter_share_url: launch.twitter_share_url || '',
      body: launch.body || '',
      tagline: launch.tagline || '',
      user: {
        name: launch.user?.name || '',
      },
    };
  }

  // Return the compiled company information
  return {
    name,
    description,
    website,
    yearFounded,
    teamSize,
    founders,
    jobs,
    newsItems,
    launchPost,
  };
};

/**
 * Processes the list of companies, scrapes their information, and saves it to a JSON file
 * @returns {Promise<void>}
 */
export const processCompanyList = async (): Promise<void> => {
  try {
    // Parse the CSV file containing company information
    const companies = await parseCSV(CSV_INPUT_PATH);
    console.log(`Parsed ${companies.length} companies from CSV`);

    // Create a new CheerioCrawler instance
    const crawler = new CheerioCrawler({
      requestHandler: async ({ $, request }) => {
        // Scrape the company page
        const companyData = scrapeCompanyPage($, request.url);
        // Push the scraped data to the dataset
        await Dataset.pushData(companyData);
        // Uncomment the following line for debugging
        //console.log(`Scraped company: ${companyData.name}`);
      },
    });

    // Run the crawler on all company URLs
    await crawler.run(companies.map(company => company.url));

    // Open the dataset containing scraped information
    const dataset = await Dataset.open();
    const { items } = await dataset.getData();

    // Ensure the output directory exists
    await fsExtra.ensureDir(path.dirname(JSON_OUTPUT_PATH));
    // Write the scraped data to a JSON file
    await fsExtra.writeJson(JSON_OUTPUT_PATH, items, { spaces: 2 });
    console.log(`Wrote ${items.length} companies to ${JSON_OUTPUT_PATH}`);
  } catch (error) {
    console.error('Error processing company list:', error);
  }
};