import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

// PM2 can start the backend with either the repository root or server folder
// as its cwd. Load the known env locations without replacing values injected
// by the process manager, and ignore blank entries in an earlier file.
const serverDir = fileURLToPath(new URL('../..', import.meta.url));
const repoDir = path.dirname(serverDir);
const envFiles = [
  path.join(serverDir, '.env'),
  path.join(repoDir, '.env'),
  path.join(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server', '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  '/root/Veagle-safety/server/.env',
  '/root/Veagle-safety/.env',
  '/root/.env',
];

for (const envFile of [...new Set(envFiles)]) {
  if (!fs.existsSync(envFile)) continue;
  try {
    const rawContent = fs.readFileSync(envFile, 'utf-8');
    const parsed = dotenv.parse(rawContent);
    for (const [key, value] of Object.entries(parsed)) {
      const cleanK = String(key).replace(/^\uFEFF/, '').trim();
      if (value && !process.env[cleanK]) process.env[cleanK] = value;
    }

    // Support KEY : VALUE syntax as well
    const lines = rawContent.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([^=:]+)[\s:=]+(.*)$/);
      if (match) {
        const cleanK = String(match[1]).replace(/^\uFEFF/, '').trim();
        const cleanV = String(match[2]).trim().replace(/^["']|["']$/g, '');
        if (cleanV && !process.env[cleanK]) {
          process.env[cleanK] = cleanV;
        }
      }
    }
  } catch (_) {}
}

// Helper to extract clean env values
const getEnv = (key, defaultValue = '') => {
  const val = process.env[key] || process.env[key.trim()];
  if (!val) return defaultValue;
  let str = String(val).trim();
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    str = str.slice(1, -1).trim();
  }
  return str || defaultValue;
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
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
    secure: process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : true,
    user: process.env.EMAIL || process.env.SMTP_USER || '',
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || '',
    backupAccountsRaw: process.env.SMTP_BACKUP_ACCOUNTS || '',
  },
  razorpay: {
    keyId:
      getEnv('RAZORPAY_KEY_ID') ||
      getEnv('RAZORPAY_API_KEY') ||
      getEnv('RAZORPAY_KEY') ||
      getEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID') ||
      getEnv('NEXT_PUBLIC_RAZORPAY_KEY') ||
      '',
    keySecret:
      getEnv('RAZORPAY_KEY_SECRET') ||
      getEnv('RAZORPAY_API_SECRET') ||
      getEnv('RAZORPAY_SECRET') ||
      getEnv('RAZORPAY_SECRET_KEY') ||
      '',
    clientUrl: process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://sakhisuraksha.veaglespace.com' : 'http://localhost:3000'),
    serverBaseUrl: process.env.SERVER_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://sakhisuraksha.veaglespace.com' : 'http://localhost:5000'),
  },
};
