import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendSosSafeAlert } from '../services/mailer.js';
import { getIO } from '../socket.js';
import bcrypt from 'bcryptjs';

/**
 * Super Admin Command Center Overview
 */
export const getAdminOverview = asyncHandler(async (req, res) => {
  const activeSos = await prisma.sosSession.findMany({
    where: { status: 'ACTIVE' },
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true, profilePhoto: true } },
      locations: { orderBy: { recordedAt: 'desc' }, take: 1 },
      alerts: true,
    },
    orderBy: { startedAt: 'desc' },
  });

  const recentSos = await prisma.sosSession.findMany({
    take: 10,
    orderBy: { startedAt: 'desc' },
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });

  const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
  const activeSubscriptions = await prisma.user.count({ where: { subscriptionStatus: 'ACTIVE' } });

  // Calculate revenue statistics from SUCCESS payment transactions
  const successfulPayments = await prisma.paymentHistory.aggregate({
    where: { status: 'SUCCESS' },
    _sum: {
      amount: true,
      baseAmount: true,
      gstAmount: true,
    },
    _count: { id: true },
  });

  const gstSetting = await prisma.systemSetting.findUnique({ where: { key: 'GST_PERCENTAGE' } });
  const currentGstPercentage = gstSetting ? parseFloat(gstSetting.value) : 18.0;

  return res.json({
    metrics: {
      activeSosCount: activeSos.length,
      totalUsers,
      activeSubscriptions,
      totalRevenue: successfulPayments._sum.amount || 0,
      totalBaseRevenue: successfulPayments._sum.baseAmount || 0,
      totalGstCollected: successfulPayments._sum.gstAmount || 0,
      totalSuccessfulTransactions: successfulPayments._count.id || 0,
      currentGstPercentage,
      systemStatus: '100% OPERATIONAL',
    },
    activeSos,
    recentSos,
  });
});

/**
 * Fetch All Registered Users with Full Profile & Subscription Details
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      profilePhoto: true,
      bloodGroup: true,
      address: true,
      city: true,
      state: true,
      country: true,
      isEmailVerified: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      trustedContacts: {
        select: {
          id: true,
          name: true,
          relationship: true,
          phone: true,
          email: true,
        },
        orderBy: { priorityOrder: 'asc' },
      },
      _count: {
        select: {
          trustedContacts: true,
          sosSessions: true,
          journeys: true,
          paymentHistories: true,
        },
      },
    },
  });

  return res.json({ users });
});

/**
 * Update User Role (User <-> SuperAdmin)
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  if (!userId || !role || !['USER', 'SUPER_ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Invalid user ID or role parameter' });
  }

  const targetUserId = typeof userId === 'number' ? userId : parseInt(userId, 10);

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role },
  });

  return res.json({
    message: `User ${updated.fullName} role updated to ${role}`,
    user: { id: updated.id, role: updated.role },
  });
});

/**
 * Update Full User Details by SuperAdmin (including Direct Email Change without OTP)
 */
export const updateUserDetailsAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    fullName,
    email,
    phone,
    role,
    profilePhoto,
    bloodGroup,
    address,
    city,
    state,
    pincode,
    emergencyContactName,
    emergencyContactPhone,
    medicalNotes,
    password,
  } = req.body;

  const targetUserId = parseInt(id, 10);
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    return res.status(404).json({ error: 'User account not found' });
  }

  // Check email uniqueness if email is changed
  if (email && email.toLowerCase().trim() !== targetUser.email.toLowerCase().trim()) {
    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findFirst({
      where: { email: cleanEmail, id: { not: targetUserId } },
    });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }
  }

  let passwordHash = undefined;
  if (password && password.length >= 6) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      ...(fullName && { fullName: fullName.trim() }),
      ...(email && { email: email.toLowerCase().trim(), isEmailVerified: true }),
      ...(phone && { phone: phone.replace(/\D/g, '') }),
      ...(role && { role }),
      ...(passwordHash && { passwordHash }),
      ...(profilePhoto !== undefined && { profilePhoto }),
      ...(bloodGroup !== undefined && { bloodGroup }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(pincode !== undefined && { pincode }),
      ...(emergencyContactName !== undefined && { emergencyContactName }),
      ...(emergencyContactPhone !== undefined && { emergencyContactPhone }),
      ...(medicalNotes !== undefined && { medicalNotes }),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      profilePhoto: true,
      bloodGroup: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      medicalNotes: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      safetyStatus: true,
    },
  });

  return res.json({
    message: `User details updated successfully for ${updatedUser.fullName}`,
    user: updatedUser,
  });
});

/**
 * Toggle User Account Block / Unblock Status by SuperAdmin
 */
export const toggleUserBlock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const targetUserId = parseInt(id, 10);

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    return res.status(404).json({ error: 'User account not found' });
  }

  const isBlocked = targetUser.safetyStatus === 'BLOCKED';
  const newSafetyStatus = isBlocked ? 'SAFE' : 'BLOCKED';

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { safetyStatus: newSafetyStatus },
    select: { id: true, fullName: true, safetyStatus: true },
  });

  return res.json({
    message: `User ${updated.fullName} is now ${newSafetyStatus === 'BLOCKED' ? 'BLOCKED' : 'UNBLOCKED'}`,
    user: updated,
  });
});

/**
 * Get User Details by ID for Admin User Detail Page
 */
export const getUserByIdAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const targetUserId = parseInt(id, 10);

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      trustedContacts: { orderBy: { priorityOrder: 'asc' } },
      paymentHistories: {
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      },
      sosSessions: {
        orderBy: { startedAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User account not found' });
  }

  const allPlans = await prisma.plan.findMany({ 
    where: { isActive: true },
    orderBy: { basePrice: 'asc' } 
  });

  return res.json({ user, allPlans });
});

/**
 * Grant Free Custom Subscription Plan / Renewal by SuperAdmin (Zero Cost)
 */
export const grantUserFreeSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { planId, durationDays, customStartDate, customExpiryDate, planName } = req.body;
  const targetUserId = parseInt(id, 10);

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    return res.status(404).json({ error: 'User account not found' });
  }

  let chosenPlan = null;
  if (planId) {
    chosenPlan = await prisma.plan.findUnique({ where: { id: parseInt(planId, 10) } });
  }

  const daysToGrant = chosenPlan ? chosenPlan.durationDays : (parseInt(durationDays, 10) || 365);
  const nameToUse = chosenPlan ? chosenPlan.name : (planName || 'Custom Free Admin Plan');

  let startDate = customStartDate ? new Date(customStartDate) : new Date();
  let expiryDate = customExpiryDate ? new Date(customExpiryDate) : new Date(startDate.getTime() + daysToGrant * 24 * 60 * 60 * 1000);

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      subscriptionStatus: 'ACTIVE',
      subscriptionExpiresAt: expiryDate,
      ...(chosenPlan && { currentPlanId: chosenPlan.id }),
    },
    select: {
      id: true,
      fullName: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
    },
  });

  // Record free grant in payment history for audit logging with 0 amount
  try {
    await prisma.paymentHistory.create({
      data: {
        userId: targetUserId,
        planId: chosenPlan ? chosenPlan.id : null,
        txnid: `ADMIN_FREE_GRANT_${Date.now()}_${targetUserId}`,
        amount: 0.0,
        baseAmount: 0.0,
        gstAmount: 0.0,
        gstPercentage: 0.0,
        status: 'SUCCESS',
        paymentMode: 'ADMIN_FREE_GRANT',
      },
    });
  } catch (e) {}

  return res.json({
    message: `Plan "${nameToUse}" assigned/renewed for ${updatedUser.fullName} (Free Admin Grant - ₹0) valid until ${expiryDate.toLocaleDateString('en-IN')}`,
    user: updatedUser,
  });
});

/**
 * Toggle Subscription Plan Active Status
 */
export const togglePlanActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const targetPlanId = parseInt(id, 10);

  const targetPlan = await prisma.plan.findUnique({ where: { id: targetPlanId } });
  if (!targetPlan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const updated = await prisma.plan.update({
    where: { id: targetPlanId },
    data: { isActive: !targetPlan.isActive },
  });

  return res.json({
    message: `Plan "${updated.name}" is now ${updated.isActive ? 'ENABLED' : 'DISABLED'}`,
    plan: updated,
  });
});

/**
 * Resolve Active SOS Session by SuperAdmin
 */
export const adminResolveSos = asyncHandler(async (req, res) => {
  const { sosSessionId, note } = req.body;
  const targetId = parseInt(sosSessionId, 10);

  const session = await prisma.sosSession.update({
    where: { id: targetId },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolutionNote: note || 'Resolved by SuperAdmin Command',
    },
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          profilePhoto: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          trustedContacts: true,
        },
      },
      locations: {
        orderBy: { recordedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (session.userId) {
    await prisma.user.update({
      where: { id: session.userId },
      data: { safetyStatus: 'SAFE' },
    }).catch(() => {});
  }

  const latestLocation = session.locations?.[0];
  const latitude = latestLocation?.latitude || session.latitude || 18.5204;
  const longitude = latestLocation?.longitude || session.longitude || 73.8567;
  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const adminEmail = process.env.ADMIN_EMAIL || 'abhijeetambhore4@gmail.com';

  // Dispatch Safe Confirmation Emails to User, Admin & Guardians
  const recipientEmails = new Set();
  if (session.user?.email) recipientEmails.add(session.user.email);
  if (adminEmail) recipientEmails.add(adminEmail);
  if (session.user?.trustedContacts && Array.isArray(session.user.trustedContacts)) {
    session.user.trustedContacts.forEach((c) => {
      if (c.email) recipientEmails.add(c.email);
    });
  }

  for (const email of recipientEmails) {
    sendSosSafeAlert({
      recipientEmail: email,
      userName: session.user?.fullName || 'Sakhi Member',
      userPhone: session.user?.phone || 'N/A',
      userPhoto: session.user?.profilePhoto || null,
      googleMapsUrl,
      latitude,
      longitude,
      resolvedAt: session.resolvedAt,
    });
  }

  // Broadcast Alarm Stop Event via Socket.io
  const io = getIO();
  if (io) {
    io.emit('SOS_ALARM_STOP', {
      sosId: targetId,
      victimName: session.user?.fullName || 'Sakhi Member',
    });
  }

  return res.status(200).json({
    message: `Emergency SOS Incident #${targetId} resolved successfully by Command`,
    session,
  });
});

/**
 * Delete Trusted Contact by Admin
 */
export const deleteContactAdmin = asyncHandler(async (req, res) => {
  const { contactId } = req.params;

  const targetContactId = parseInt(contactId, 10);
  const existing = await prisma.trustedContact.findUnique({ where: { id: targetContactId } });
  if (!existing) {
    return res.status(404).json({ error: 'Trusted contact not found' });
  }

  await prisma.trustedContact.delete({ where: { id: targetContactId } });

  res.status(200).json({ message: 'Trusted contact removed successfully' });
});

/**
 * Manage Subscription Plans (Get All Plans)
 */
export const getPlans = asyncHandler(async (req, res) => {
  let plans = await prisma.plan.findMany({ orderBy: { basePrice: 'asc' } });

  // If no plans exist, create default 24 INR + GST plan
  if (plans.length === 0) {
    const defaultFeatures = [
      'Instant 3-Second Hold Emergency SOS',
      '5 Guardian Emergency Alerts (SMS & Push)',
      'Encrypted Real-Time Live GPS Map Sharing',
      'High-Decibel Siren Alarm & Siren Control',
      'Direct 112 & 1091 Helpline Access',
      '24/7 Active Safety Command Support'
    ];
    const defaultPlan = await prisma.plan.create({
      data: {
        name: 'Sakhi Suraksha 365 Yearly Protection Plan',
        description: 'Complete 365-Day 24/7 Unlimited SOS Emergency Broadcast, Live GPS Map Sharing, 5 Trusted Contacts Network, and Command Dispatch',
        basePrice: 24.0,
        gstPercentage: 18.0,
        totalPrice: 28.32,
        durationDays: 365,
        features: JSON.stringify(defaultFeatures),
        isActive: true,
      },
    });
    plans = [defaultPlan];
  }

  const formattedPlans = plans.map((p) => {
    let parsedFeatures = [];
    if (p.features) {
      try {
        parsedFeatures = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
      } catch (e) {
        parsedFeatures = p.features.split('\n').map((f) => f.trim()).filter(Boolean);
      }
    }
    return {
      ...p,
      features: Array.isArray(parsedFeatures) ? parsedFeatures : []
    };
  });

  return res.json({ plans: formattedPlans });
});

/**
 * Create or Update Subscription Plan
 */
export const createOrUpdatePlan = asyncHandler(async (req, res) => {
  const { id, name, description, basePrice, gstPercentage, durationDays, features, isActive } = req.body;

  if (!name || basePrice === undefined) {
    return res.status(400).json({ error: 'Plan name and basePrice are required' });
  }

  const base = parseFloat(basePrice) || 0;
  const gst = base === 0 ? 0 : (gstPercentage !== undefined ? parseFloat(gstPercentage) : 18.0);
  const total = base === 0 ? 0 : parseFloat((base + (base * gst) / 100).toFixed(2));
  const duration = parseInt(durationDays, 10) || 30;

  let featuresString = null;
  if (Array.isArray(features)) {
    featuresString = JSON.stringify(features.map((f) => (typeof f === 'string' ? f.trim() : f)).filter(Boolean));
  } else if (typeof features === 'string') {
    featuresString = features;
  }

  let plan;
  if (id) {
    const targetPlanId = typeof id === 'number' ? id : parseInt(id, 10);
    plan = await prisma.plan.update({
      where: { id: targetPlanId },
      data: {
        name,
        description,
        basePrice: base,
        gstPercentage: gst,
        totalPrice: total,
        durationDays: duration,
        features: featuresString,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
  } else {
    plan = await prisma.plan.create({
      data: {
        name,
        description,
        basePrice: base,
        gstPercentage: gst,
        totalPrice: total,
        durationDays: duration,
        features: featuresString,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
  }

  let parsedFeatures = [];
  if (plan.features) {
    try {
      parsedFeatures = JSON.parse(plan.features);
    } catch (e) {
      parsedFeatures = [];
    }
  }

  return res.json({
    message: 'Subscription plan saved successfully',
    plan: { ...plan, features: parsedFeatures }
  });
});

/**
 * Get Dynamic System GST Settings
 */
export const getGstSettings = asyncHandler(async (req, res) => {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'GST_PERCENTAGE' } });
  const gstPercentage = setting ? parseFloat(setting.value) : 18.0;

  return res.json({ gstPercentage });
});

/**
 * Update Dynamic GST Percentage Settings
 */
export const updateGstSettings = asyncHandler(async (req, res) => {
  const { gstPercentage } = req.body;

  if (gstPercentage === undefined || isNaN(parseFloat(gstPercentage))) {
    return res.status(400).json({ error: 'Valid gstPercentage number is required' });
  }

  const gstValue = parseFloat(gstPercentage).toString();

  const setting = await prisma.systemSetting.upsert({
    where: { key: 'GST_PERCENTAGE' },
    update: { value: gstValue },
    create: { key: 'GST_PERCENTAGE', value: gstValue },
  });

  return res.json({
    message: 'Global GST percentage updated successfully',
    gstPercentage: parseFloat(setting.value),
  });
});

/**
 * Get Complete Payment History Transactions & Reports for SuperAdmin
 */
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await prisma.paymentHistory.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      plan: true,
    },
  });

  const totals = payments.reduce(
    (acc, item) => {
      if (item.status === 'SUCCESS') {
        acc.totalRevenue += item.amount;
        acc.totalBaseAmount += item.baseAmount;
        acc.totalGstCollected += item.gstAmount;
        acc.successCount += 1;
      } else if (item.status === 'FAILED') {
        acc.failedCount += 1;
      } else {
        acc.pendingCount += 1;
      }
      return acc;
    },
    { totalRevenue: 0, totalBaseAmount: 0, totalGstCollected: 0, successCount: 0, failedCount: 0, pendingCount: 0 }
  );

  return res.json({
    summary: totals,
    payments,
  });
});

/**
 * Super Admin Create User Directly
 */
export const createUserByAdmin = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phone,
    password,
    role,
    bloodGroup,
    city,
    address,
    emergencyContactName,
    emergencyContactPhone,
    childIdentifier,
    grantFreePlan,
    planDurationDays,
  } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const cleanFullName = fullName.trim();

  const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  let assignedRole = 'USER';
  if (role === 'SUPER_ADMIN') assignedRole = 'SUPER_ADMIN';
  else if (role === 'ORGANIZATION') assignedRole = 'ORGANIZATION';
  else if (role === 'PARENT') assignedRole = 'PARENT';
  else if (role === 'USER') assignedRole = 'USER';

  const passwordHash = await bcrypt.hash(password, 10);
  const isFreePlanGranted = assignedRole === 'ORGANIZATION' || assignedRole === 'SUPER_ADMIN' || Boolean(grantFreePlan);
  const daysToGrant = Number(planDurationDays) || 365;
  const expiryDate = isFreePlanGranted ? new Date(Date.now() + daysToGrant * 24 * 60 * 60 * 1000) : null;

  const newUser = await prisma.user.create({
    data: {
      fullName: cleanFullName,
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash,
      role: assignedRole,
      city: city || 'Pune',
      address: address || null,
      bloodGroup: bloodGroup || 'O+',
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.replace(/\D/g, '') : null,
      isEmailVerified: true,
      subscriptionStatus: isFreePlanGranted ? 'ACTIVE' : 'INACTIVE',
      subscriptionExpiresAt: expiryDate,
      onboardingStep: 7,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      bloodGroup: true,
      subscriptionStatus: true,
      createdAt: true,
    },
  });

  // Role-specific linking logic
  if (assignedRole === 'PARENT' && childIdentifier && childIdentifier.trim()) {
    const cleanChildId = childIdentifier.trim().toLowerCase();
    const cleanChildPhone = childIdentifier.replace(/\D/g, '');

    const childUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanChildId },
          cleanChildPhone ? { phone: cleanChildPhone } : undefined,
        ].filter(Boolean),
      },
    });

    if (childUser) {
      try {
        await prisma.parentChildLink.create({
          data: {
            parentId: newUser.id,
            childId: childUser.id,
            relationship: 'Parent',
            status: 'ACTIVE',
          },
        });
      } catch (e) {
        console.log('[Admin Create Parent Link Notice]:', e.message);
      }
    }
  }

  if (assignedRole === 'USER' && emergencyContactName && emergencyContactPhone && emergencyContactName !== 'N/A') {
    try {
      await prisma.trustedContact.create({
        data: {
          userId: newUser.id,
          name: emergencyContactName.trim(),
          relationship: 'Guardian',
          phone: emergencyContactPhone.replace(/\D/g, ''),
          isVerified: true,
          priorityOrder: 1,
        },
      });
    } catch (e) {}
  }

  return res.status(201).json({
    message: `${assignedRole === 'ORGANIZATION' ? 'Organization HQ' : assignedRole === 'PARENT' ? 'Parent Guardian' : assignedRole} account created successfully for ${newUser.fullName}!`,
    user: newUser,
  });
});

/**
 * Update Super Admin Profile Details
 */
export const updateSuperAdminProfile = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;
  const adminId = req.user.id;

  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;
  if (password && password.length >= 6) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  const updatedAdmin = await prisma.user.update({
    where: { id: adminId },
    data: updateData,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      profilePhoto: true,
    },
  });

  return res.json({
    message: 'Super Admin profile updated successfully',
    user: updatedAdmin,
  });
});

/**
 * Public Contact Us Form Submission
 */
export const submitContactEnquiry = asyncHandler(async (req, res) => {
  const { fullName, email, phone, subject, message } = req.body;

  if (!fullName || !email || !message) {
    return res.status(400).json({ error: 'Full Name, Email, and Message are required fields.' });
  }

  const enquiry = await prisma.contactEnquiry.create({
    data: {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      subject: subject ? subject.trim() : 'General Support Inquiry',
      message: message.trim(),
      status: 'PENDING',
    },
  });

  return res.status(201).json({
    message: '🎉 Thank you! Your message has been received by our 24/7 Support Team. We will contact you shortly.',
    enquiry,
  });
});

/**
 * Get All Contact Enquiries for SuperAdmin Support Tab
 */
export const getContactEnquiries = asyncHandler(async (req, res) => {
  const enquiries = await prisma.contactEnquiry.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ enquiries });
});

/**
 * Resolve Contact Enquiry by SuperAdmin
 */
export const resolveContactEnquiry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const targetId = parseInt(id, 10);

  const updated = await prisma.contactEnquiry.update({
    where: { id: targetId },
    data: {
      status: 'RESOLVED',
      resolutionNote: note || 'Resolved by SuperAdmin Support Team',
      resolvedAt: new Date(),
    },
  });

  return res.json({
    message: `Contact Enquiry #${updated.id} marked as RESOLVED`,
    enquiry: updated,
  });
});

/**
 * Add Trusted Contact for a User by SuperAdmin
 */
export const addContactAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { name, relationship, phone, email } = req.body;

  if (!name || !relationship || !phone) {
    return res.status(400).json({ error: 'Name, relationship, and phone are required' });
  }

  const targetUserId = parseInt(userId, 10);
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    return res.status(404).json({ error: 'User account not found' });
  }

  const count = await prisma.trustedContact.count({ where: { userId: targetUserId } });
  if (count >= 5) {
    return res.status(400).json({ error: 'Maximum limit of 5 trusted contacts reached for this user' });
  }

  const contact = await prisma.trustedContact.create({
    data: {
      userId: targetUserId,
      name: name.trim(),
      relationship,
      phone: phone.replace(/\D/g, ''),
      email: email ? email.trim() : '',
      priorityOrder: count + 1,
    },
  });

  if (!targetUser.emergencyContactName || count === 0) {
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        emergencyContactName: name.trim(),
        emergencyContactPhone: phone.replace(/\D/g, ''),
      },
    });
  }

  res.status(201).json({ message: 'Trusted contact added successfully', contact });
});

/**
 * Update Trusted Contact by SuperAdmin
 */
export const updateContactAdmin = asyncHandler(async (req, res) => {
  const { contactId } = req.params;
  const { name, relationship, phone, email } = req.body;

  const targetContactId = parseInt(contactId, 10);
  const existing = await prisma.trustedContact.findUnique({ where: { id: targetContactId } });
  if (!existing) {
    return res.status(404).json({ error: 'Trusted contact not found' });
  }

  const updated = await prisma.trustedContact.update({
    where: { id: targetContactId },
    data: {
      ...(name && { name: name.trim() }),
      ...(relationship && { relationship }),
      ...(phone && { phone: phone.replace(/\D/g, '') }),
      ...(email !== undefined && { email: email ? email.trim() : '' }),
    },
  });

  res.status(200).json({ message: 'Trusted contact updated successfully', contact: updated });
});