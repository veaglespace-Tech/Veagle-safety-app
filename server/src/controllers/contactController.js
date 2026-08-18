import { prisma } from '../config/prisma.js';

export const getContacts = async (req, res) => {
  try {
    const contacts = await prisma.trustedContact.findMany({
      where: { userId: req.user?.id },
      orderBy: { priorityOrder: 'asc' },
    });
    return res.json({ contacts });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

export const addContact = async (req, res) => {
  try {
    const { name, relationship, phone, email } = req.body;

    if (!name || !relationship || !phone) {
      return res.status(400).json({ error: 'Name, relationship, and phone are required' });
    }

    const count = await prisma.trustedContact.count({ where: { userId: req.user?.id } });
    if (count >= 5) {
      return res.status(400).json({ error: 'Maximum limit of 5 trusted contacts reached' });
    }

    const contact = await prisma.trustedContact.create({
      data: {
        userId: req.user?.id,
        name: name.trim(),
        relationship,
        phone: phone.replace(/\D/g, ''),
        email: email ? email.trim() : '',
        priorityOrder: count + 1,
      },
    });

    const currentUser = await prisma.user.findUnique({ where: { id: req.user?.id } });
    if (currentUser && (!currentUser.emergencyContactName || count === 0)) {
      await prisma.user.update({
        where: { id: req.user?.id },
        data: {
          emergencyContactName: name.trim(),
          emergencyContactPhone: phone.replace(/\D/g, ''),
        },
      });
    }

    return res.status(201).json({ message: 'Trusted contact added', contact });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add contact' });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.trustedContact.deleteMany({
      where: {
        id: typeof id === 'number' ? id : parseInt(id, 10),
        userId: req.user?.id,
      },
    });

    return res.json({ message: 'Contact removed successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove contact' });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, relationship, phone, email } = req.body;

    const contactId = typeof id === 'number' ? id : parseInt(id, 10);
    const existing = await prisma.trustedContact.findFirst({
      where: { id: contactId, userId: req.user?.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Trusted contact not found' });
    }

    const updated = await prisma.trustedContact.update({
      where: { id: contactId },
      data: {
        ...(name && { name: name.trim() }),
        ...(relationship && { relationship }),
        ...(phone && { phone: phone.replace(/\D/g, '') }),
        ...(email !== undefined && { email: email ? email.trim() : '' }),
      },
    });

    return res.json({ message: 'Trusted contact updated successfully', contact: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update contact' });
  }
};
