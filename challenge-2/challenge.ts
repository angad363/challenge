import { CheerioCrawler, Dataset } from 'crawlee';
import { CheerioAPI } from 'cheerio';
import { parse } from 'fast-csv';
import fs from 'fs';
import path from 'path';
import fsExtra from 'fs-extra';
import { CSV_INPUT_PATH, JSON_OUTPUT_PATH } from './resources';
import { title } from 'process';

interface CSVCompany {
  name: string;
  url: string;
}

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

interface Founder {
  fullName: string;
  title: string;
  bio: string;
  linkedin?: string;
  twitter?: string;
}

interface Job {
  title: string;
  location: string;
  type: string;
  salaryRange: number;
  equityRange: number;
  minExperience: string;
}

interface NewsItem {
  title: string;
  url: string;
  date: string;
}

interface LaunchPostUser {
  name: string;
}

interface LaunchPost {
  title: string;
  url: string;
  twitter_share_url: string;
  body: string;
  tagline: string;
  user: LaunchPostUser;
}

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

const scrapeCompanyPage = ($: CheerioAPI, url: string): Company => {
  // Find the div with the data-page attribute
  const dataPageDiv = $('div[data-page]');

  // Parse the JSON data
  const pageData = JSON.parse(dataPageDiv.attr('data-page') || '{}');

  // Extract the company name from the parsed data
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

export const processCompanyList = async (): Promise<void> => {
  try {
    const companies = await parseCSV(CSV_INPUT_PATH);
    console.log(`Parsed ${companies.length} companies from CSV`);

    const crawler = new CheerioCrawler({
      requestHandler: async ({ $, request }) => {
        const companyData = scrapeCompanyPage($, request.url);
        await Dataset.pushData(companyData);
        //console.log(`Scraped company: ${companyData.name}`);
      },
    });

    await crawler.run(companies.map(company => company.url));

    const dataset = await Dataset.open();
    const { items } = await dataset.getData();

    await fsExtra.ensureDir(path.dirname(JSON_OUTPUT_PATH));
    await fsExtra.writeJson(JSON_OUTPUT_PATH, items, { spaces: 2 });
    console.log(`Wrote ${items.length} companies to ${JSON_OUTPUT_PATH}`);
  } catch (error) {
    console.error('Error processing company list:', error);
  }
};