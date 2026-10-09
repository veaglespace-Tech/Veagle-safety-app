import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Get Parent Portal Overview & Linked Children Safety Status
 */
export const getParentOverview = asyncHandler(async (req, res) => {
  const parentId = req.user.id;

  // 1. Fetch parent user details to match email & phone
  const parentUser = await prisma.user.findUnique({ where: { id: parentId } });

  if (parentUser) {
    const parentEmailClean = parentUser.email ? parentUser.email.trim().toLowerCase() : '';
    const parentPhoneClean = parentUser.phone ? parentUser.phone.replace(/\D/g, '') : '';
    const phoneLast10 = parentPhoneClean.length >= 10 ? parentPhoneClean.slice(-10) : parentPhoneClean;

    const userConditions = [];
    if (parentEmailClean) {
      userConditions.push({ parentEmail: parentEmailClean });
    }
    if (phoneLast10 && phoneLast10.length >= 6) {
      userConditions.push({ emergencyContactPhone: { contains: phoneLast10 } });
    }

    // Find children who listed this parent's email or phone in their user record
    const autoMatchingChildren = userConditions.length > 0
      ? await prisma.user.findMany({
          where: {
            id: { not: parentId },
            role: { not: 'SUPER_ADMIN' },
            OR: userConditions,
          },
        })
      : [];

    const contactConditions = [];
    if (parentEmailClean) {
      contactConditions.push({ email: parentEmailClean });
    }
    if (phoneLast10 && phoneLast10.length >= 6) {
      contactConditions.push({ phone: { contains: phoneLast10 } });
    }

    // Find children who listed this parent's email/phone in TrustedContact records
    const matchingContacts = contactConditions.length > 0
      ? await prisma.trustedContact.findMany({
          where: {
            OR: contactConditions,
          },
          select: { userId: true },
        })
      : [];

    const contactUserIds = matchingContacts.map((tc) => tc.userId);

    const allMatchingChildIds = Array.from(
      new Set([
        ...autoMatchingChildren.map((c) => c.id),
        ...contactUserIds.filter((id) => id !== parentId),
      ])
    );

    // Auto-create active ParentChildLink records for all discovered children
    for (const childId of allMatchingChildIds) {
      try {
        await prisma.parentChildLink.upsert({
          where: {
            parentId_childId: {
              parentId,
              childId,
            },
          },
          update: { status: 'ACTIVE' },
          create: {
            parentId,
            childId,
            relationship: 'Child',
            status: 'ACTIVE',
          },
        });
      } catch (e) {
        console.log('[Auto Parent-Child Link] Notice:', e.message);
      }
    }
  }

  // 2. Fetch all linked children with live SOS and active journey status
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
                take: 500,
              },
            },
            take: 1,
          },
          journeys: {
            where: { status: { in: ['IN_PROGRESS', 'OVERDUE'] } },
            select: {
              id: true,
              originName: true,
              destinationName: true,
              expectedArrival: true,
              shareToken: true,
              status: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  const childrenList = links
    .filter((link) => Boolean(link.child))
    .map((link) => {
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
              locations: activeSos.locations || [],
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

  const cleanEmail = identifier.trim().toLowerCase();
  const cleanPhone = identifier.replace(/\D/g, '');
  const phoneLast10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

  // Find child by email or phone
  const childUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: cleanEmail },
        phoneLast10 ? { phone: { contains: phoneLast10 } } : undefined,
      ].filter(Boolean),
    },
  });

  if (!childUser) {
    return res.status(404).json({ error: 'No user account found with this email or mobile number.' });
  }

  if (childUser.id === parentId) {
    return res.status(400).json({ error: 'You cannot link your own account as a child.' });
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
      relationship: relationship?.trim() || 'Child',
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
