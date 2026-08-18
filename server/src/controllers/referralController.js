import { prisma } from '../config/prisma.js';
import crypto from 'crypto';

// Generate a random 6-character alphanumeric string for referral codes
const generateReferralCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

export const createPartner = async (req, res) => {
  try {
    const { name, email, mobile, partnerReferralCode, isActive } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    // Check if partner already exists
    const existingPartner = await prisma.referralPartner.findUnique({
      where: { email },
    });

    if (existingPartner) {
      return res.status(400).json({ success: false, message: 'Partner with this email already exists.' });
    }

    let finalCode = partnerReferralCode;
    if (!finalCode) {
      // Auto-generate code and ensure it's unique
      let isUnique = false;
      while (!isUnique) {
        finalCode = generateReferralCode();
        const existingCode = await prisma.referralPartner.findUnique({
          where: { partnerReferralCode: finalCode },
        });
        if (!existingCode) {
          isUnique = true;
        }
      }
    } else {
      // Validate provided code uniqueness
      const existingCode = await prisma.referralPartner.findUnique({
        where: { partnerReferralCode: finalCode },
      });
      if (existingCode) {
        return res.status(400).json({ success: false, message: 'Referral code is already taken.' });
      }
    }

    const newPartner = await prisma.referralPartner.create({
      data: {
        name,
        email,
        mobile,
        partnerReferralCode: finalCode,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({ success: true, partner: newPartner });
  } catch (error) {
    console.error('Error creating partner:', error);
    res.status(500).json({ success: false, message: 'Failed to create partner.' });
  }
};

export const getAllPartners = async (req, res) => {
  try {
    const partners = await prisma.referralPartner.findMany({
      include: {
        _count: {
          select: { referredUsers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, partners });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch partners.' });
  }
};

export const getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await prisma.referralPartner.findUnique({
      where: { id: parseInt(id) },
      include: {
        referredUsers: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            subscriptionStatus: true,
            currentPlanId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        },
      },
    });

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found.' });
    }

    res.status(200).json({ success: true, partner });
  } catch (error) {
    console.error('Error fetching partner:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch partner.' });
  }
};

export const updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { partnerName, email, partnerReferralCode, discountPercentage, isActive } = req.body;

    const partnerId = parseInt(id);

    // Check if updating email or code to an existing one
    if (email || partnerReferralCode) {
      const existing = await prisma.referralPartner.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(partnerReferralCode ? [{ partnerReferralCode }] : []),
          ],
          NOT: { id: partnerId }
        }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email or Referral Code already in use by another partner.' });
      }
    }

    const partner = await prisma.referralPartner.update({
      where: { id: partnerId },
      data: { 
        ...(partnerName && { partnerName }),
        ...(email && { email }),
        ...(partnerReferralCode && { partnerReferralCode }),
        ...(discountPercentage !== undefined && { discountPercentage: parseFloat(discountPercentage) }),
        ...(isActive !== undefined && { isActive })
      },
    });

    res.status(200).json({ success: true, partner });
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({ success: false, message: 'Failed to update partner.' });
  }
};

export const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = parseInt(id);

    // Check if partner has referred users
    const referredUsersCount = await prisma.user.count({
      where: { referredByPartnerId: partnerId }
    });

    if (referredUsersCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete partner because they have referred users. Please disable them instead.' 
      });
    }

    await prisma.referralPartner.delete({
      where: { id: partnerId }
    });

    res.status(200).json({ success: true, message: 'Partner deleted successfully.' });
  } catch (error) {
    console.error('Error deleting partner:', error);
    res.status(500).json({ success: false, message: 'Failed to delete partner.' });
  }
};

export const getPartnerStats = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required.' });
    }

    const partner = await prisma.referralPartner.findFirst({
      where: {
        email,
        partnerReferralCode: code,
      },
      include: {
        referredUsers: {
          select: {
            subscriptionStatus: true,
          }
        },
      },
    });

    if (!partner) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const totalReferred = partner.referredUsers.length;
    const activeSubscribers = partner.referredUsers.filter(u => u.subscriptionStatus === 'ACTIVE').length;

    res.status(200).json({
      success: true,
      partner: {
        name: partner.name,
        email: partner.email,
        partnerReferralCode: partner.partnerReferralCode,
        isActive: partner.isActive,
      },
      stats: {
        totalReferred,
        activeSubscribers,
      }
    });
  } catch (error) {
    console.error('Error fetching partner stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};
