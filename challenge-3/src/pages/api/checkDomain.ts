import { NextApiRequest, NextApiResponse } from 'next';
import { isDomainAvailable } from '../../lib/resources';
/**
 * Checks the availability of a given domain by making an API call
 *
 * @param {string} domain - The domain name to check
 * @returns {Promise<boolean>} A promise that resolves to true if the domain is available, false otherwise
 * @throws {Error} If the API call fails
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { domain } = req.query;

  if (typeof domain !== 'string') {
    return res.status(400).json({ error: 'Invalid domain parameter' });
  }

  try {
    const available = await isDomainAvailable(domain);
    res.status(200).json({ available });
  } catch (error) {
    res.status(500).json({ error: 'Error checking domain availability' });
  }
}