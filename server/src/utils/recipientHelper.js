import { prisma } from '../config/prisma.js';

/**
 * Helper utility to collect, validate, and normalize recipient emails for emergency alerts.
 * Ensures:
 * - Only valid RFC-compliant emails are included.
 * - Internal dummy emails (e.g. *.internal, example.com) are excluded.
 * - Victims are NOT spammed with rescue emails asking themselves to help themselves.
 * - DB SUPER_ADMIN users are dynamically loaded so no hardcoding or .env setup is required.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  if (
    clean.endsWith('.internal') ||
    clean.includes('example.com') ||
    clean.includes('test.com') ||
    clean === 'null' ||
    clean === 'undefined' ||
    clean === 'n/a'
  ) {
    return false;
  }
  return EMAIL_REGEX.test(clean);
};

export const collectEmergencyRecipients = async (user, contacts = [], options = {}) => {
  const { includeVictim = false } = options;
  const recipientEmails = new Set();

  // 1. Linked parents from ParentChildLink (verified active links)
  if (user?.id) {
    try {
      const parentLinks = await prisma.parentChildLink.findMany({
        where: { childId: user.id, status: 'ACTIVE' },
        include: { parent: { select: { email: true } } },
      });
      parentLinks.forEach((link) => {
        if (isValidEmail(link.parent?.email)) {
          recipientEmails.add(link.parent.email.trim().toLowerCase());
        }
      });
    } catch (parentLinkErr) {
      console.error('[RecipientHelper Parent Links Lookup Error]:', parentLinkErr?.message);
    }
  }

  // 2. Parent email on victim profile
  if (isValidEmail(user?.parentEmail)) {
    recipientEmails.add(user.parentEmail.trim().toLowerCase());
  }

  // 3. Organization email (ONLY IF user is connected to that organization)
  let orgEmail = user?.organization?.email;
  if (!orgEmail && user?.organizationId) {
    try {
      const org = await prisma.user.findUnique({
        where: { id: user.organizationId },
        select: { email: true },
      });
      if (org && isValidEmail(org.email)) {
        orgEmail = org.email;
      }
    } catch (_) {}
  }
  if (isValidEmail(orgEmail)) {
    recipientEmails.add(orgEmail.trim().toLowerCase());
  }

  // 4. Trusted contacts of the victim
  const contactList = Array.isArray(contacts) && contacts.length > 0
    ? contacts
    : (user?.trustedContacts && Array.isArray(user.trustedContacts) ? user.trustedContacts : []);

  contactList.forEach((c) => {
    if (isValidEmail(c?.email)) {
      recipientEmails.add(c.email.trim().toLowerCase());
    }
  });

  // 5. User's own email only if specifically requested
  if (includeVictim && isValidEmail(user?.email)) {
    recipientEmails.add(user.email.trim().toLowerCase());
  }

  // 6. System Admin from environment or fallback superadmin
  const adminEnv = process.env.ADMIN_EMAIL || 'veaglespace@gmail.com';
  if (isValidEmail(adminEnv)) {
    recipientEmails.add(adminEnv.trim().toLowerCase());
  }

  // 7. Platform SuperAdmins only (SUPER_ADMIN role — NOT organization admins)
  try {
    const dbSuperAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: { email: true },
    });
    dbSuperAdmins.forEach((adm) => {
      if (isValidEmail(adm?.email)) {
        recipientEmails.add(adm.email.trim().toLowerCase());
      }
    });
  } catch (err) {
    console.error('[RecipientHelper DB SuperAdmin Lookup Error]:', err?.message);
  }

  return Array.from(recipientEmails);
};
