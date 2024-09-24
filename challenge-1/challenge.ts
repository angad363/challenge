import { DUMP_DOWNLOAD_URL, SQLITE_DB_PATH } from "./resources";
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as https from 'https';
import * as zlib from 'zlib';
import * as tar from 'tar';
import * as path from 'path';
import knex from 'knex';
import * as fastcsv from 'fast-csv';
import { fileURLToPath } from 'url';

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Main function to process the data dump
export async function processDataDump(): Promise<void> {
  const tmpDir = path.join(__dirname, 'tmp');
  const archivePath = path.join(tmpDir, 'dump.tar.gz');
  const extractDir = path.join(tmpDir, 'extracted');
  const outDir = path.join(__dirname, 'out');

  // Ensure necessary directories exist
  await ensureDirectoryExistsAsync(tmpDir);
  await ensureDirectoryExistsAsync(extractDir);
  await ensureDirectoryExistsAsync(outDir);

  // Step 1: Download the .tar.gz file
  await downloadFile(DUMP_DOWNLOAD_URL, archivePath);

  // Step 2: Decompress and extract the archive
  await extractTarGz(archivePath, extractDir);

  // Adjust file paths based on actual structure inside the extracted directory
  const customersCsvPath = path.join(extractDir, 'dump', 'customers.csv'); // Updated with actual path
  const organizationsCsvPath = path.join(extractDir, 'dump', 'organizations.csv'); // Updated with actual path

  // Step 3: Set up SQLite database
  await setupDatabase();

  // Step 4: Parse CSV files and insert data into database
  await parseAndInsertCSV(customersCsvPath, 'customers');
  await parseAndInsertCSV(organizationsCsvPath, 'organizations');

  console.log("✅ Done!");
}

// Function to ensure a directory exists asynchronously
async function ensureDirectoryExistsAsync(directory: string): Promise<void> {
  try {
    await fsPromises.mkdir(directory, { recursive: true });
    console.log(`Directory '${directory}' is ready.`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw err;
    }
  }
}

// Function to download a file using HTTPS and save it locally
async function downloadFile(url: string, dest: string): Promise<void> {
  const file = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, (unlinkErr) => {
        if (unlinkErr) {
          console.error(`Failed to delete incomplete file: ${unlinkErr.message}`);
        }
        reject(err);
      });
    });
  });
}

// Function to set up SQLite database using Knex.js
async function setupDatabase(): Promise<void> {
  const db = knex({
    client: 'sqlite3',
    connection: { filename: SQLITE_DB_PATH },
    useNullAsDefault: true,
  });

  // Drop existing tables if they exist
  await db.schema.dropTableIfExists('customers');
  await db.schema.dropTableIfExists('organizations');

  // Create customers table with appropriate columns
  await db.schema.createTable('customers', (table) => {
    table.increments('id').primary();
    table.integer('Index').notNullable();
    table.string('Customer Id').notNullable();
    table.string('First Name').notNullable();
    table.string('Last Name').notNullable();
    table.string('Company').notNullable();
    table.string('City').notNullable();
    table.string('Country').notNullable();
    table.string('Phone 1').notNullable();
    table.string('Phone 2').notNullable();
    table.string('Email').notNullable();
    table.date('Subscription Date').notNullable();
    table.string('Website').notNullable();
  });

  // Create organizations table with appropriate columns
  await db.schema.createTable('organizations', (table) => {
    table.increments('id').primary();
    table.integer('Index').notNullable();
    table.string('Organization Id').notNullable();
    table.string('Name').notNullable();
    table.string('Website').notNullable();
    table.string('Country').notNullable();
    table.text('Description').notNullable(); // Assuming description can be long
    table.integer('Founded').notNullable(); // Assuming 'Founded' is a year
    table.string('Industry').notNullable();
    table.integer('Number of employees').notNullable(); // Assuming this is an integer
  });
}

// Function to decompress and extract a .tar.gz archive
async function extractTarGz(archivePath: string, extractDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.createReadStream(archivePath)
      .pipe(zlib.createGunzip())
      .pipe(tar.extract({ cwd: extractDir }))
      .on('finish', resolve)
      .on('error', reject);
  });
}

// Function to parse a CSV file and insert its data into a specified database table
async function parseAndInsertCSV(filePath: string, tableName: string): Promise<void> {
  const db = knex({
    client: 'sqlite3',
    connection: { filename: SQLITE_DB_PATH },
    useNullAsDefault: true,
  });

  const rows: any[] = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(fastcsv.parse({ headers: true }))
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        try {
          await db.batchInsert(tableName, rows, 100);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on('error', reject);
  });
}