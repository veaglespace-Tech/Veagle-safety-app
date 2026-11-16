import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendSosEmergencyAlert } from '../services/mailer.js';
import { getIO } from '../socket.js';
import { sendEmergencyPushToEmails } from './pushController.js';
import { sendEmergencySirenPush } from '../services/fcmService.js';
import { config } from '../config/index.js';

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
          profilePhoto: true,
          bloodGroup: true,
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

  const allChildIds = links.filter((l) => Boolean(l.child)).map((l) => l.child.id);

  // Fetch recent SOS alerts for linked children
  const recentAlerts = allChildIds.length > 0
    ? await prisma.sosSession.findMany({
        where: { userId: { in: allChildIds } },
        orderBy: { startedAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: { id: true, fullName: true, phone: true },
          },
          locations: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
          },
        },
      })
    : [];

  // Fetch recent journeys for linked children
  const recentJourneys = allChildIds.length > 0
    ? await prisma.journey.findMany({
        where: { userId: { in: allChildIds } },
        orderBy: { startedAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: { id: true, fullName: true, phone: true },
          },
        },
      })
    : [];

  // Fetch latest location fallback for children who do not have an active SOS
  const childrenList = await Promise.all(
    links
      .filter((link) => Boolean(link.child))
      .map(async (link) => {
        const c = link.child;
        const activeSos = c.sosSessions && c.sosSessions.length > 0 ? c.sosSessions[0] : null;
        const activeJourney = c.journeys && c.journeys.length > 0 ? c.journeys[0] : null;
        const latestLocation = activeSos?.locations && activeSos.locations.length > 0 ? activeSos.locations[0] : null;

        let lastKnownLocation = latestLocation;
        if (!lastKnownLocation) {
          // Check last recorded location from previous SOS
          const pastSosLocation = await prisma.sosLocation.findFirst({
            where: { sosSession: { userId: c.id } },
            orderBy: { recordedAt: 'desc' },
          });
          if (pastSosLocation) {
            lastKnownLocation = pastSosLocation;
          } else {
            // Check past journey location
            const pastJourneyLoc = await prisma.journeyLocation.findFirst({
              where: { journey: { userId: c.id } },
              orderBy: { recordedAt: 'desc' },
            });
            if (pastJourneyLoc) {
              lastKnownLocation = pastJourneyLoc;
            }
          }
        }

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
            profilePhoto: c.profilePhoto,
            bloodGroup: c.bloodGroup,
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
          lastKnownLocation,
        };
      })
  );

  const totalChildren = childrenList.length;
  const activeSosCount = childrenList.filter((c) => c.activeSos || c.child.safetyStatus === 'SOS_ACTIVE').length;
  const inTripCount = childrenList.filter((c) => c.activeJourney || c.child.safetyStatus === 'JOURNEY_ACTIVE').length;
  const safeCount = childrenList.filter((c) => !c.activeSos && !c.activeJourney && c.child.safetyStatus === 'SAFE').length;

  res.status(200).json({
    success: true,
    stats: {
      totalChildren,
      activeSosCount,
      inTripCount,
      safeCount,
    },
    children: childrenList,
    recentAlerts,
    recentJourneys,
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

/**
 * Send Safety Check-in Ping to Child
 */
export const pingChildCheckin = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { childId } = req.body;

  if (!childId) {
    return res.status(400).json({ error: 'Child ID is required' });
  }

  const link = await prisma.parentChildLink.findFirst({
    where: { parentId, childId: Number(childId) },
    include: { parent: true, child: true },
  });

  if (!link) {
    return res.status(404).json({ error: 'Linked child record not found.' });
  }

  try {
    const { getIO } = await import('../socket.js');
    const io = getIO();
    if (io) {
      const parentName = link.parent.fullName || 'Parent';
      const cleanPhone = link.child.phone ? link.child.phone.replace(/\D/g, '') : '';
      const payload = {
        title: 'Safety Check-in Request',
        message: `${parentName} requested a quick safety check-in. Please tap to confirm you are safe.`,
        parentId: link.parent.id,
        parentName,
        childId: link.child.id,
        timestamp: new Date().toISOString(),
      };
      if (link.child.email) io.to(`user:${link.child.email.trim().toLowerCase()}`).emit('PARENT_CHECKIN_PING', payload);
      if (cleanPhone) io.to(`user:${cleanPhone}`).emit('PARENT_CHECKIN_PING', payload);
      io.to(`user:${link.child.id}`).emit('PARENT_CHECKIN_PING', payload);
    }
  } catch (socketErr) {
    console.warn('[Parent Ping Socket Notice]:', socketErr.message);
  }

  res.status(200).json({
    success: true,
    message: `Safety check-in ping sent to ${link.child.fullName}!`,
  });
});

/**
 * Parent triggers SOS on behalf of a linked child
 * Use case: Child is in emergency but cannot trigger SOS themselves
 */
export const triggerChildSos = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { childId } = req.body;

  if (!childId) {
    return res.status(400).json({ error: 'childId is required.' });
  }

  // 1. Verify active parent-child link
  const link = await prisma.parentChildLink.findFirst({
    where: {
      parentId,
      childId: Number(childId),
      status: 'ACTIVE',
    },
    include: {
      parent: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      child: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          profilePhoto: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          parentEmail: true,
          subscriptionStatus: true,
          subscriptionExpiresAt: true,
          organization: { select: { email: true, phone: true } },
        },
      },
    },
  });

  if (!link) {
    return res.status(403).json({ error: 'No active parent-child link found. You can only trigger SOS for your linked children.' });
  }

  const child = link.child;

  // 2. Check child's subscription status
  const isChildSubscribed =
    child.subscriptionStatus === 'ACTIVE' &&
    (!child.subscriptionExpiresAt || new Date(child.subscriptionExpiresAt) > new Date());

  if (!isChildSubscribed) {
    return res.status(403).json({
      error: `${child.fullName}'s subscription is not active. SOS cannot be triggered on their behalf.`,
    });
  }

  // 3. Check if child already has an active SOS session
  const existingSession = await prisma.sosSession.findFirst({
    where: { userId: child.id, status: 'ACTIVE' },
  });

  if (existingSession) {
    return res.status(409).json({
      error: `${child.fullName} already has an active SOS session in progress.`,
      sosSessionId: existingSession.id,
      shareToken: existingSession.shareToken,
    });
  }

  // 4. Create SOS session on behalf of child (userId = child's ID)
  const session = await prisma.sosSession.create({
    data: {
      userId: child.id,
      isSilent: false,
      resolutionNote: `SOS triggered by parent: ${link.parent.fullName} (ID: ${parentId}) on behalf of child.`,
    },
  });

  // 5. Save default initial location (child location unknown at parent-trigger time)
  const latitude = 18.5204;
  const longitude = 73.8567;
  await prisma.sosLocation.create({
    data: {
      sosSessionId: session.id,
      latitude,
      longitude,
      accuracy: 1000, // Low accuracy — placeholder until child device updates
    },
  });

  // 6. Update child's safetyStatus to SOS_ACTIVE
  await prisma.user.update({
    where: { id: child.id },
    data: { safetyStatus: 'SOS_ACTIVE' },
  });

  // 7. Collect all contacts for the child
  const contacts = await prisma.trustedContact.findMany({
    where: { userId: child.id },
  });

  const parentLinks = await prisma.parentChildLink.findMany({
    where: { childId: child.id, status: 'ACTIVE' },
    include: { parent: true },
  }).catch(() => []);

  const clientBaseUrl = process.env.CLIENT_URL || config.payu?.clientUrl || 'http://localhost:3000';
  const trackingUrl = `${clientBaseUrl}/live-track/${session.shareToken}`;
  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  // 8. Build recipient email lists
  const primaryEmails = new Set();
  parentLinks.forEach((pl) => {
    if (pl.parent?.email) primaryEmails.add(pl.parent.email.trim().toLowerCase());
  });
  if (child.parentEmail) primaryEmails.add(child.parentEmail.trim().toLowerCase());
  contacts.forEach((c) => {
    if (c.email) primaryEmails.add(c.email.trim().toLowerCase());
  });
  if (child.email) primaryEmails.add(child.email.trim().toLowerCase());
  // Also notify the triggering parent explicitly
  if (link.parent?.email) primaryEmails.add(link.parent.email.trim().toLowerCase());

  const ccEmails = new Set();
  if (child.organization?.email) ccEmails.add(child.organization.email.trim().toLowerCase());

  const superAdmins = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN' },
    select: { email: true },
  }).catch(() => []);
  superAdmins.forEach((a) => { if (a.email) ccEmails.add(a.email.trim().toLowerCase()); });

  const defaultAdminEmail = process.env.ADMIN_EMAIL || 'abhijeetambhore4@gmail.com';
  if (defaultAdminEmail) ccEmails.add(defaultAdminEmail.trim().toLowerCase());

  const ccList = Array.from(ccEmails);
  const toList = Array.from(primaryEmails);
  const primaryRecipients = toList.length > 0 ? toList : (ccList.length > 0 ? [ccList[0]] : []);

  // 9. Send emergency emails
  await Promise.all(
    primaryRecipients.map(async (email) => {
      try {
        await sendSosEmergencyAlert({
          recipientEmail: email,
          recipientName: 'Safety Guardian',
          userName: child.fullName || 'Sakhi User',
          userPhone: child.phone || 'N/A',
          userEmail: child.email || 'N/A',
          userPhoto: child.profilePhoto || null,
          trackingUrl,
          googleMapsUrl,
          latitude,
          longitude,
          sosId: session.id,
          cc: ccList.filter((c) => c !== email),
          // Note in email that parent triggered this
          extraNote: `⚠️ This SOS was triggered by ${link.parent.fullName} (Parent) on behalf of ${child.fullName}.`,
        });

        await prisma.sosAlert.create({
          data: {
            sosSessionId: session.id,
            channel: 'EMAIL',
            recipient: email,
            status: 'SENT',
          },
        }).catch(() => {});
      } catch (emailErr) {
        console.error(`[Parent-Triggered SOS Email Error] Failed for ${email}:`, emailErr.message);
      }
    })
  );

  // 10. Build WhatsApp alert links
  const baseMessageText = `🚨 SAKHI EMERGENCY SOS ALERT!\n\n⚠️ Triggered by Parent: ${link.parent.fullName}\nVictim: ${child.fullName}\nPhone: ${child.phone || ''}\n\n📍 GPS Coordinates:\nLat: ${latitude}, Lng: ${longitude}\n\n👉 Live Location Map:\n${trackingUrl}\n\n🌐 Google Maps:\n${googleMapsUrl}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(baseMessageText)}`;

  const allAlertRecipients = [];
  parentLinks.forEach((pl) => {
    if (pl.parent?.phone) {
      allAlertRecipients.push({ name: pl.parent.fullName || 'Parent', phone: pl.parent.phone, isParent: true });
    }
  });
  if (child.emergencyContactPhone) {
    allAlertRecipients.push({ name: child.emergencyContactName || 'Emergency Contact', phone: child.emergencyContactPhone, isParent: true });
  }
  contacts.forEach((c) => {
    allAlertRecipients.push({ name: c.name, phone: c.phone, isParent: false });
  });

  const whatsappAlerts = allAlertRecipients.map((contact) => {
    const cleanPhone = (contact.phone || '').replace(/\D/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(baseMessageText)}`;
    return { contactName: contact.name, phone: contact.phone, isParent: contact.isParent, whatsappUrl };
  });

  // 11. Socket broadcast — same as normal SOS flow
  const io = getIO();
  if (io) {
    const sosAlarmPayload = {
      sosId: session.id,
      victimId: child.id,
      victimName: child.fullName || 'Sakhi Suraksha User',
      victimPhone: child.phone || '',
      victimEmail: child.email || '',
      victimPhoto: child.profilePhoto || null,
      shareToken: session.shareToken,
      trackingUrl,
      googleMapsUrl,
      latitude,
      longitude,
      isSilent: false,
      triggeredByParent: true,
      parentName: link.parent.fullName,
      contacts: contacts.map((c) => ({ name: c.name, phone: c.phone, email: c.email })),
      whatsappAlerts,
      whatsappShareUrl,
      timestamp: new Date().toISOString(),
    };

    const targetRooms = new Set();
    targetRooms.add('admin-ops');

    parentLinks.forEach((pl) => {
      if (pl.parent?.email) targetRooms.add(`user:${pl.parent.email.trim().toLowerCase()}`);
      if (pl.parent?.phone) {
        const cp = pl.parent.phone.replace(/\D/g, '');
        if (cp) {
          targetRooms.add(`user:${cp}`);
          if (cp.length >= 10) targetRooms.add(`user:${cp.slice(-10)}`);
        }
      }
    });

    const allAdmins = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
      select: { email: true, phone: true },
    }).catch(() => []);
    allAdmins.forEach((adm) => {
      if (adm.email) targetRooms.add(`user:${adm.email.trim().toLowerCase()}`);
      if (adm.phone) {
        const cp = adm.phone.replace(/\D/g, '');
        if (cp) {
          targetRooms.add(`user:${cp}`);
          if (cp.length >= 10) targetRooms.add(`user:${cp.slice(-10)}`);
        }
      }
    });

    if (child.parentEmail) targetRooms.add(`user:${child.parentEmail.trim().toLowerCase()}`);
    if (child.emergencyContactPhone) {
      const cp = child.emergencyContactPhone.replace(/\D/g, '');
      if (cp) {
        targetRooms.add(`user:${cp}`);
        if (cp.length >= 10) targetRooms.add(`user:${cp.slice(-10)}`);
      }
    }
    contacts.forEach((c) => {
      if (c.email) targetRooms.add(`user:${c.email.trim().toLowerCase()}`);
      if (c.phone) {
        const cp = c.phone.replace(/\D/g, '');
        if (cp) {
          targetRooms.add(`user:${cp}`);
          if (cp.length >= 10) targetRooms.add(`user:${cp.slice(-10)}`);
        }
      }
    });

    targetRooms.forEach((room) => io.to(room).emit('SOS_ALARM_BROADCAST', sosAlarmPayload));
    io.to('admin-ops').emit('SOS_ALARM_BROADCAST', sosAlarmPayload);
  }

  // 12. Web Push
  await sendEmergencyPushToEmails({
    emails: Array.from(primaryEmails),
    victimName: child.fullName || 'Sakhi Suraksha User',
    trackingUrl,
    latitude,
    longitude,
  });

  // 13. FCM Push (siren to parents, admins, guardians)
  try {
    const recipientUserIds = new Set();

    const fcmAdmins = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
      select: { id: true },
    }).catch(() => []);
    fcmAdmins.forEach((a) => recipientUserIds.add(a.id));

    parentLinks.forEach((pl) => { if (pl.parentId) recipientUserIds.add(pl.parentId); });

    if (child.emergencyContactPhone) {
      const ecp10 = child.emergencyContactPhone.replace(/\D/g, '').slice(-10);
      if (ecp10.length >= 10) {
        const matched = await prisma.user.findMany({
          where: { OR: [{ phone: { contains: ecp10 } }, { phone: ecp10 }] },
          select: { id: true },
        }).catch(() => []);
        matched.forEach((p) => recipientUserIds.add(p.id));
      }
    }

    if (child.parentEmail) {
      const matched = await prisma.user.findMany({
        where: { email: child.parentEmail.trim().toLowerCase() },
        select: { id: true },
      }).catch(() => []);
      matched.forEach((p) => recipientUserIds.add(p.id));
    }

    // Never send siren to child themselves
    recipientUserIds.delete(child.id);
    recipientUserIds.delete(String(child.id));

    if (recipientUserIds.size > 0) {
      const deviceTokenRecords = await prisma.deviceToken.findMany({
        where: { userId: { in: Array.from(recipientUserIds) } },
        select: { token: true },
      });

      const childDeviceTokens = await prisma.deviceToken.findMany({
        where: { userId: child.id },
        select: { token: true },
      }).catch(() => []);
      const childTokenSet = new Set(childDeviceTokens.map((t) => t.token));

      const fcmTokens = Array.from(new Set(deviceTokenRecords.map((t) => t.token))).filter(
        (t) => !childTokenSet.has(t)
      );

      if (fcmTokens.length > 0) {
        sendEmergencySirenPush({
          tokens: fcmTokens,
          victimId: child.id,
          victimName: child.fullName || 'Sakhi Suraksha User',
          sosId: session.id,
          trackingUrl,
          latitude,
          longitude,
        }).catch((err) => console.error('[FCM Parent-Trigger] Push error:', err.message));
      }
    }
  } catch (pushErr) {
    console.warn('[FCM Parent-Trigger] Device token collection failed:', pushErr.message);
  }

  return res.status(201).json({
    success: true,
    message: `Emergency SOS triggered for ${child.fullName}! All emergency contacts have been alerted.`,
    sosSession: {
      id: session.id,
      shareToken: session.shareToken,
      startedAt: session.startedAt,
      trackingUrl,
      googleMapsUrl,
      whatsappAlerts,
      whatsappShareUrl,
      triggeredByParent: true,
    },
  });
});
