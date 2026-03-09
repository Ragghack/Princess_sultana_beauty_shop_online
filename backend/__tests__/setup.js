require('dotenv').config({ path: '.env.test' });

// Increase timeout for tests
jest.setTimeout(10000);