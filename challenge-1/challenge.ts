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

/**
 * Main function to process the data dump.
 * This function orchestrates the entire process of downloading, extracting,
 * parsing, and storing data into an SQLite database.
 */
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

/**
 * Ensures a directory exists asynchronously.
 * Creates the directory if it does not exist.
 *
 * @param {string} directory - The path of the directory to ensure.
 */
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

/**
 * Downloads a file using HTTPS and saves it locally.
 *
 * @param {string} url - The URL of the file to download.
 * @param {string} dest - The destination path to save the downloaded file.
 */
async function downloadFile(url: string, dest: string): Promise<void> {
  const file = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      response.pipe(file);  // Pipe the response data into the file stream
      file.on('finish', () => {
        file.close(resolve);  // Close the file stream once download is complete
      });
    }).on('error', (err) => {
      fs.unlink(dest, (unlinkErr) => { // Attempt to delete incomplete file on error
        if (unlinkErr) {
          console.error(`Failed to delete incomplete file: ${unlinkErr.message}`);
        }
        reject(err);  // Reject promise with error
      });
    });
  });
}

/**
 * Sets up an SQLite database using Knex.js.
 * Creates tables for customers and organizations with appropriate columns.
 */
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
    table.increments('id').primary();  // Auto-incrementing primary key
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
    table.increments('id').primary();  // Auto-incrementing primary key
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

/**
 * Decompresses and extracts a .tar.gz archive.
 *
 * @param {string} archivePath - The path to the .tar.gz archive.
 * @param {string} extractDir - The directory to extract files into.
 */
async function extractTarGz(archivePath: string, extractDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.createReadStream(archivePath)
      .pipe(zlib.createGunzip())   // Decompresses the gzip archive
      .pipe(tar.extract({ cwd: extractDir }))  // Extracts tar contents into specified directory
      .on('finish', resolve)  // Resolve promise when extraction finishes successfully
      .on('error', reject);  // Reject promise on error during extraction
  });
}

/**
 * Parses a CSV file and inserts its data into a specified database table.
 *
 * @param {string} filePath - The path to the CSV file.
 * @param {string} tableName - The name of the database table to insert data into.
 */
async function parseAndInsertCSV(filePath: string, tableName: string): Promise<void> {
  const db = knex({
    client: 'sqlite3',
    connection: { filename: SQLITE_DB_PATH },
    useNullAsDefault: true,
  });

  const rows: any[] = [];   // Array to hold parsed CSV rows
  
  return new Promise((resolve, reject) => { 
    fs.createReadStream(filePath)
      .pipe(fastcsv.parse({ headers: true }))  // Parse CSV with headers
      .on('data', (row) => rows.push(row))     // Push each row into rows array
      .on('end', async () => {
        try {
          await db.batchInsert(tableName, rows, 100);   // Insert rows in batches for efficiency
          resolve();  // Resolve promise upon successful insertion
        } catch (err) {
          reject(err);  // Reject promise if insertion fails
        }
      })
      .on('error', reject);  // Reject promise on error during parsing
  });
}