import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

/**
 * Hostinger SMTP Failover Service
 * 
 * Manages an ordered pool of Hostinger SMTP credentials (sos01 to sos05).
 * When an account's quota/limit is exhausted or an error occurs, it automatically
 * switches to the next account and re-attempts dispatch seamlessly.
 */

// 1. Build the ordered pool of accounts
const defaultAccounts = [
  { user: 'sos01@sakhisuraksha.veaglespace.com', pass: 'Veagle@12345' },
  { user: 'sos02@sakhisuraksha.veaglespace.com', pass: 'Veagle@12345' },
  { user: 'sos03@sakhisuraksha.veaglespace.com', pass: 'Veagle@12345' },
  { user: 'sos04@sakhisuraksha.veaglespace.com', pass: 'Veagle@12345' },
  { user: 'sos05@sakhisuraksha.veaglespace.com', pass: 'Veagle@12345' },
];

function parseAccounts() {
  const raw = config.emailService.backupAccountsRaw;
  if (!raw || typeof raw !== 'string') return defaultAccounts;

  const list = raw
    .split(',')
    .map((entry) => {
      const [u, p] = entry.split(':');
      if (u && p) return { user: u.trim(), pass: p.trim() };
      return null;
    })
    .filter(Boolean);

  return list.length > 0 ? list : defaultAccounts;
}

const accountsPool = parseAccounts();
const hostingerHost = config.emailService.host || 'smtp.hostinger.com';
const hostingerPort = config.emailService.port || 465;
const isSecure = config.emailService.secure !== undefined ? config.emailService.secure : true;

// 2. Pre-create transporters for each account in the pool
const transporters = accountsPool.map((acc) => ({
  account: acc,
  transporter: nodemailer.createTransport({
    host: hostingerHost,
    port: hostingerPort,
    secure: isSecure,
    auth: {
      user: acc.user,
      pass: acc.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  }),
}));

// Current active account pointer (0 = sos01)
let currentAccountIndex = 0;

/**
 * Get active sender email address
 */
export function getActiveSenderEmail() {
  return accountsPool[currentAccountIndex]?.user || 'sos01@sakhisuraksha.veaglespace.com';
}

/**
 * Check if error indicates quota exhaustion or rate limit
 */
function isLimitError(err) {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = String(err.responseCode || err.code || '');
  return (
    code === '452' || // 452 Too many recipients or disk full
    code === '550' || // 550 Mailbox quota exceeded or daily limit
    code === '451' || // 451 Temporary local error / rate exceeded
    code === '554' || // 554 Transaction failed
    msg.includes('quota') ||
    msg.includes('limit') ||
    msg.includes('rate') ||
    msg.includes('exceeded') ||
    msg.includes('too many') ||
    msg.includes('blocked')
  );
}

/**
 * Dispatches mail with automatic failover to next account if limits/errors occur.
 * 
 * @param {Object} mailOptions Standard nodemailer options ({ from, to, cc, subject, html, attachments })
 * @returns {Promise<Object>} info result of transporter.sendMail
 */
export async function sendMailWithFailover(mailOptions) {
  const total = transporters.length;
  let lastError = null;

  for (let attempt = 0; attempt < total; attempt++) {
    const activeIdx = (currentAccountIndex + attempt) % total;
    const { account, transporter } = transporters[activeIdx];

    try {
      // Ensure "from" header uses the active authenticated sender
      const fromName = mailOptions.fromName || '🚨 Sakhi Suraksha Emergency Command';
      const outgoingFrom = `"${fromName}" <${account.user}>`;

      const finalOptions = {
        ...mailOptions,
        from: outgoingFrom,
      };

      const info = await transporter.sendMail(finalOptions);

      // Successfully sent -> update current active pointer
      currentAccountIndex = activeIdx;
      console.log(`[Hostinger Failover] Email sent successfully via ${account.user} (MessageId: ${info.messageId})`);
      return info;
    } catch (err) {
      lastError = err;
      console.warn(
        `[Hostinger Failover Warning] Account ${account.user} failed (${err.responseCode || err.code}): ${err.message}. Trying next backup account...`
      );
    }
  }

  console.error('[Hostinger Failover Error] All 5 Hostinger accounts failed to send email:', lastError?.message);
  throw lastError;
}

/**
 * Verify connectivity of all configured Hostinger accounts
 */
export async function verifyAllAccounts() {
  const results = [];
  for (let i = 0; i < transporters.length; i++) {
    const { account, transporter } = transporters[i];
    try {
      await transporter.verify();
      results.push({ account: account.user, status: 'CONNECTED' });
    } catch (e) {
      results.push({ account: account.user, status: 'FAILED', error: e.message });
    }
  }
  return results;
}
