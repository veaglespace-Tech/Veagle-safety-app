import { prisma } from '../config/prisma.js';

export const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, maxUses, assignedUserId, validFrom, validUntil, applicablePlanCodes } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ success: false, message: 'Code, discountType, and discountValue are required.' });
    }

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
        maxUses: maxUses ? parseInt(maxUses) : null,
        assignedUserId: assignedUserId ? parseInt(assignedUserId) : null,
        createdById: req.user.id, // from auth middleware
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        applicablePlanCodes: applicablePlanCodes || null,
        isActive: true,
      }
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ success: false, message: 'Failed to create coupon.' });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      include: {
        assignedUser: { select: { fullName: true, email: true } },
        creator: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch coupons.' });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, isActive, validUntil, maxUses, assignedUserId } = req.body;
    const couponId = parseInt(id);

    if (code) {
      const existing = await prisma.coupon.findFirst({
        where: { code, NOT: { id: couponId } }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        ...(code && { code }),
        ...(discountType && { discountType }),
        ...(discountValue !== undefined && { discountValue: parseFloat(discountValue) }),
        ...(isActive !== undefined && { isActive }),
        ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
        ...(maxUses !== undefined && { maxUses: maxUses ? parseInt(maxUses) : null }),
        ...(assignedUserId !== undefined && { assignedUserId: assignedUserId ? parseInt(assignedUserId) : null }),
      }
    });

    res.status(200).json({ success: true, coupon });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ success: false, message: 'Failed to update coupon.' });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if used in successful payment
    const payments = await prisma.paymentHistory.findFirst({
      where: { couponId: parseInt(id), status: 'SUCCESS' }
    });

    if (payments) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete coupon because it has been used in a successful payment. Please disable it instead.' 
      });
    }

    await prisma.coupon.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ success: false, message: 'Failed to delete coupon.' });
  }
};

export const getAssignableUsers = async (req, res) => {
  try {
    // Return users that can be assigned coupons (e.g. all admins or users)
    const users = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'USER'] } }, // Customize as needed
      select: { id: true, fullName: true, email: true, role: true },
      orderBy: { fullName: 'asc' }
    });
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error fetching assignable users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

export const getMyCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { assignedUserId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    console.error('Error fetching my coupons:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your coupons.' });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, planId } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    
    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive coupon code.' });
    }

    const now = new Date();
    if (coupon.validFrom && coupon.validFrom > now) {
      return res.status(400).json({ success: false, message: 'Coupon is not yet active.' });
    }
    if (coupon.validUntil && coupon.validUntil < now) {
      return res.status(400).json({ success: false, message: 'Coupon has expired.' });
    }

    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit has been reached.' });
    }

    if (coupon.applicablePlanCodes && coupon.applicablePlanCodes.length > 0) {
      if (!planId || !coupon.applicablePlanCodes.includes(planId.toString())) {
        return res.status(400).json({ success: false, message: 'Coupon is not valid for the selected plan.' });
      }
    }

    // FIRST-TIME PAID UPGRADE RULE
    // Check if the user has any prior SUCCESS payments
    const priorPayments = await prisma.paymentHistory.findFirst({
      where: {
        userId: req.user.id,
        status: 'SUCCESS'
      }
    });

    if (priorPayments) {
      return res.status(400).json({ success: false, message: 'Coupons can only be applied for first-time upgrades.' });
    }

    res.status(200).json({ 
      success: true, 
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ success: false, message: 'Failed to validate coupon.' });
  }
};
