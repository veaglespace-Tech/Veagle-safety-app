import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import crypto from 'crypto';

/**
 * Get Organization Overview & Live Safety Monitor Data
 */
export const getOrganizationOverview = asyncHandler(async (req, res) => {
  const orgId = req.user.id;

  // Fetch all users linked to this Organization
  const users = await prisma.user.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      safetyStatus: true,
      subscriptionStatus: true,
      sosSessions: {
        where: { status: 'ACTIVE' },
        include: {
          locations: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
          },
        },
        take: 1,
      },
      journeys: {
        where: { status: 'IN_PROGRESS' },
        select: {
          id: true,
          originName: true,
          destinationName: true,
          expectedArrival: true,
          status: true,
        },
        take: 1,
      },
    },
  });

  const memberList = users.map((u) => {
    const activeSos = u.sosSessions && u.sosSessions.length > 0 ? u.sosSessions[0] : null;
    const activeJourney = u.journeys && u.journeys.length > 0 ? u.journeys[0] : null;
    const latestLocation = activeSos?.locations && activeSos.locations.length > 0 ? activeSos.locations[0] : null;

    return {
      userId: u.id,
      user: {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        safetyStatus: u.safetyStatus,
        subscriptionStatus: u.subscriptionStatus,
      },
      activeSos: activeSos
        ? {
            id: activeSos.id,
            startedAt: activeSos.startedAt,
            shareToken: activeSos.shareToken,
            latestLocation,
          }
        : null,
      activeJourney,
    };
  });

  const totalMembers = memberList.length;
  const activeSosCount = memberList.filter((m) => m.activeSos || m.user.safetyStatus === 'SOS_ACTIVE').length;
  const inTripCount = memberList.filter((m) => m.activeJourney || m.user.safetyStatus === 'JOURNEY_ACTIVE').length;
  const safeCount = totalMembers - activeSosCount - inTripCount;

  res.status(200).json({
    success: true,
    stats: {
      totalMembers,
      activeSosCount,
      inTripCount,
      safeCount,
    },
    members: memberList,
  });
});

/**
 * Get Organization Settings (Referral Code)
 */
export const getOrganizationSettings = asyncHandler(async (req, res) => {
  const orgId = req.user.id;
  
  let orgUser = await prisma.user.findUnique({
    where: { id: orgId },
    select: { orgReferralCode: true }
  });

  // Auto-generate referral code if it doesn't exist
  if (!orgUser.orgReferralCode) {
    const newCode = `ORG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    orgUser = await prisma.user.update({
      where: { id: orgId },
      data: { orgReferralCode: newCode },
      select: { orgReferralCode: true }
    });
  }

  res.status(200).json({
    success: true,
    orgReferralCode: orgUser.orgReferralCode
  });
});

/**
 * Remove Member from Organization (Unlink)
 */
export const removeMember = asyncHandler(async (req, res) => {
  const orgId = req.user.id;
  const { userId } = req.params;

  const targetUser = await prisma.user.findFirst({
    where: {
      id: Number(userId),
      organizationId: orgId,
    },
  });

  if (!targetUser) {
    return res.status(404).json({ error: 'Organization member record not found.' });
  }

  await prisma.user.update({
    where: { id: targetUser.id },
    data: { organizationId: null }
  });

  res.status(200).json({
    success: true,
    message: 'Member removed from organization successfully.',
  });
});
