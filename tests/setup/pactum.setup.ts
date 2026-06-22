import * as dotenv from 'dotenv';
import * as path from 'path';
import * as pactum from 'pactum';

dotenv.config({ path: path.join(__dirname, '../.env.test') });

beforeAll(() => {
  const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3001';
  pactum.request.setBaseUrl(baseUrl);
  pactum.request.setDefaultTimeout(60000);
});