/**
 * Helper utility to collect and normalize all recipient emails for an emergency session
 * (User + Admin + Parent Email + Trusted Guardian Contacts)
 */
export const collectEmergencyRecipients = (user, contacts = []) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'abhijeetambhore4@gmail.com';
  const recipientEmails = new Set();

  if (user?.email && typeof user.email === 'string') {
    recipientEmails.add(user.email.trim().toLowerCase());
  }

  if (adminEmail && typeof adminEmail === 'string') {
    recipientEmails.add(adminEmail.trim().toLowerCase());
  }

  if (user?.parentEmail && typeof user.parentEmail === 'string') {
    recipientEmails.add(user.parentEmail.trim().toLowerCase());
  }

  // Support both passed contacts array AND user.trustedContacts relation array
  const contactList = Array.isArray(contacts) && contacts.length > 0
    ? contacts
    : (user?.trustedContacts && Array.isArray(user.trustedContacts) ? user.trustedContacts : []);

  contactList.forEach((c) => {
    if (c?.email && typeof c.email === 'string' && c.email.trim()) {
      recipientEmails.add(c.email.trim().toLowerCase());
    }
  });

  return Array.from(recipientEmails);
};
