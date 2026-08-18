import dotenv from 'dotenv';
dotenv.config();

// Helper to extract clean env values
const getEnv = (key, defaultValue = '') => {
  return process.env[key] || process.env[key.trim()] || defaultValue;
};

const jwtSecretValue = process.env.JWT_KEY || process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'tichi_suraksha_super_secret_jwt_key_2026' : undefined);

if (process.env.NODE_ENV === 'production' && !jwtSecretValue) {
  throw new Error('FATAL ERROR: JWT_SECRET or JWT_KEY is not defined in the environment variables.');
}

export const config = {
  port: process.env.PORT || (process.env.NODE_ENV === 'production' ? 5002 : 5000),
  jwtSecret: jwtSecretValue,
  jwt: {
    secret: jwtSecretValue,
    expiresIn: '30d',
  },
  emailService: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.EMAIL || process.env.SMTP_USER || '',
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || '',
  },
  payu: {
    baseUrl: process.env.PAYU_BASE_URL || 'https://test.payu.in/_payment',
    key: process.env.PAYU_TEST_KEY || process.env['PAYU_TEST_KEY '] || 'GKJE3Z',
    salt: process.env.payu_test_salt || process.env['payu_test_salt '] || '0zqiCnB4GslxAanSxjEAutWkWuggFiGs',
    clientUrl: process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'http://localhost:3002' : 'http://localhost:3000'),
    serverBaseUrl: process.env.SERVER_BASE_URL || (process.env.NODE_ENV === 'production' ? 'http://localhost:5002' : 'http://localhost:5000'),
  },
};
