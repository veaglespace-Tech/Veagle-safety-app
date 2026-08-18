import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Get Organization Overview & Live Safety Monitor Data
 */
export const getOrganizationOverview = asyncHandler(async (req, res) => {
  const orgId = req.user.id;

  // Fetch all members linked to this Organization
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: {
      user: {
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
      },
    },
  });

  const memberList = members.map((m) => {
    const u = m.user;
    const activeSos = u.sosSessions && u.sosSessions.length > 0 ? u.sosSessions[0] : null;
    const activeJourney = u.journeys && u.journeys.length > 0 ? u.journeys[0] : null;
    const latestLocation = activeSos?.locations && activeSos.locations.length > 0 ? activeSos.locations[0] : null;

    return {
      membershipId: m.id,
      memberCode: m.memberCode,
      department: m.department,
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
 * Add / Invite Member to Organization by Phone or Email
 */
export const addMember = asyncHandler(async (req, res) => {
  const orgId = req.user.id;
  const { identifier, memberCode, department } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: 'Please enter member phone number or email address.' });
  }

  // Find user by email or phone
  const targetUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.trim().toLowerCase() },
        { phone: identifier.trim() },
      ],
    },
  });

  if (!targetUser) {
    return res.status(404).json({ error: 'No user account found with this email or mobile number.' });
  }

  if (targetUser.id === orgId) {
    return res.status(400).json({ error: 'You cannot add your own Organization account as a member.' });
  }

  // Check if already linked
  const existing = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId: targetUser.id,
      },
    },
  });

  if (existing) {
    return res.status(400).json({ error: 'This member is already registered in your organization.' });
  }

  const newMember = await prisma.organizationMember.create({
    data: {
      organizationId: orgId,
      userId: targetUser.id,
      memberCode: memberCode?.trim() || null,
      department: department?.trim() || null,
      status: 'ACTIVE',
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          safetyStatus: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: `${targetUser.fullName} added successfully to Organization Directory!`,
    member: newMember,
  });
});

/**
 * Remove Member from Organization
 */
export const removeMember = asyncHandler(async (req, res) => {
  const orgId = req.user.id;
  const { membershipId } = req.params;

  const membership = await prisma.organizationMember.findFirst({
    where: {
      id: Number(membershipId),
      organizationId: orgId,
    },
  });

  if (!membership) {
    return res.status(404).json({ error: 'Organization member record not found.' });
  }

  await prisma.organizationMember.delete({
    where: { id: membership.id },
  });

  res.status(200).json({
    success: true,
    message: 'Member removed from organization successfully.',
  });
});
