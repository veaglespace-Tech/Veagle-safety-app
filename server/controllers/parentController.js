import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Get Parent Portal Overview & Linked Children Safety Status
 */
export const getParentOverview = asyncHandler(async (req, res) => {
  const parentId = req.user.id;

  // Fetch all children linked to this Parent
  const links = await prisma.parentChildLink.findMany({
    where: { parentId },
    include: {
      child: {
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

  const childrenList = links.map((link) => {
    const c = link.child;
    const activeSos = c.sosSessions && c.sosSessions.length > 0 ? c.sosSessions[0] : null;
    const activeJourney = c.journeys && c.journeys.length > 0 ? c.journeys[0] : null;
    const latestLocation = activeSos?.locations && activeSos.locations.length > 0 ? activeSos.locations[0] : null;

    return {
      linkId: link.id,
      relationship: link.relationship,
      status: link.status,
      createdAt: link.createdAt,
      child: {
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        phone: c.phone,
        safetyStatus: c.safetyStatus,
        subscriptionStatus: c.subscriptionStatus,
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

  const totalChildren = childrenList.length;
  const activeSosCount = childrenList.filter((c) => c.activeSos || c.child.safetyStatus === 'SOS_ACTIVE').length;
  const inTripCount = childrenList.filter((c) => c.activeJourney || c.child.safetyStatus === 'JOURNEY_ACTIVE').length;

  res.status(200).json({
    success: true,
    stats: {
      totalChildren,
      activeSosCount,
      inTripCount,
    },
    children: childrenList,
  });
});

/**
 * Link Child to Parent Account by Child Phone or Email
 */
export const linkChild = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { identifier, relationship } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: 'Please enter child mobile number or email address.' });
  }

  // Find child by email or phone
  const childUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.trim().toLowerCase() },
        { phone: identifier.trim() },
      ],
    },
  });

  if (!childUser) {
    return res.status(404).json({ error: 'No account found with this email or mobile number.' });
  }

  if (childUser.id === parentId) {
    return res.status(400).json({ error: 'You cannot link your own Parent account as a child.' });
  }

  // Check if already linked
  const existing = await prisma.parentChildLink.findUnique({
    where: {
      parentId_childId: {
        parentId,
        childId: childUser.id,
      },
    },
  });

  if (existing) {
    return res.status(400).json({ error: 'This child is already linked to your Parent account.' });
  }

  const newLink = await prisma.parentChildLink.create({
    data: {
      parentId,
      childId: childUser.id,
      relationship: relationship?.trim() || 'Parent',
      status: 'ACTIVE',
    },
    include: {
      child: {
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
    message: `${childUser.fullName} has been successfully linked to your Parent Safety Portal!`,
    link: newLink,
  });
});

/**
 * Unlink Child from Parent Account
 */
export const unlinkChild = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { linkId } = req.params;

  const link = await prisma.parentChildLink.findFirst({
    where: {
      id: Number(linkId),
      parentId,
    },
  });

  if (!link) {
    return res.status(404).json({ error: 'Child link record not found.' });
  }

  await prisma.parentChildLink.delete({
    where: { id: link.id },
  });

  res.status(200).json({
    success: true,
    message: 'Child unlinked from Parent Portal successfully.',
  });
});
