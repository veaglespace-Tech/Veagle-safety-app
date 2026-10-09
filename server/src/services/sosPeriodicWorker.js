import { prisma } from '../config/prisma.js';
import { config } from '../config/index.js';
import { sendSos5MinLocationUpdate } from './mailer.js';
import { getIO } from '../socket.js';
import { collectEmergencyRecipients } from '../utils/recipientHelper.js';

// Use a global symbol to prevent duplicate workers across nodemon hot-reloads
// (each nodemon restart is a new module scope, but globalThis persists in the same process)
const WORKER_KEY = Symbol.for('__SOS_PERIODIC_WORKER__');
const LAST_SENT_KEY = Symbol.for('__SOS_LAST_SENT_MAP__');

// Minimum interval between emails per session (5 minutes in ms)
const PERIODIC_INTERVAL_MS = 5 * 60 * 1000;
// How often to check (every 30 seconds — lightweight poll)
const CHECK_INTERVAL_MS = 30 * 1000;

/**
 * Start the 5-Minute Recurring Periodic GPS Location Worker.
 * Uses globalThis to ensure only ONE interval runs at a time,
 * even if this module is re-imported due to nodemon restarts.
 * Uses a per-session lastSentAt map to enforce the 5-min minimum gap.
 */
export const startSosPeriodicWorker = () => {
  // If an interval already exists on globalThis, do NOT create another one
  if (globalThis[WORKER_KEY]) {
    console.log('⏰ [SOS Periodic Worker] Already running — skipping duplicate start.');
    return;
  }

  // Initialize the lastSentAt tracker map (persists across module reloads in same process)
  if (!globalThis[LAST_SENT_KEY]) {
    globalThis[LAST_SENT_KEY] = new Map();
  }

  console.log('⏰ [SOS Periodic Worker] Starting GPS Alert Worker (checks every 30s, emails every 5 min per session)...');

  globalThis[WORKER_KEY] = setInterval(async () => {
    try {
      const now = Date.now();
      const lastSentMap = globalThis[LAST_SENT_KEY];

      // 1. Fetch all currently ACTIVE SOS Sessions
      const activeSessions = await prisma.sosSession.findMany({
        where: { status: 'ACTIVE' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              profilePhoto: true,
              parentEmail: true,
              emergencyContactName: true,
              trustedContacts: true,
            },
          },
          locations: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
          },
        },
      });

      if (activeSessions.length === 0) return;

      const clientBaseUrl = process.env.CLIENT_URL || config.payu?.clientUrl || 'http://localhost:3000';

      for (const session of activeSessions) {
        const sessionKey = `session_${session.id}`;
        const lastSent = lastSentMap.get(sessionKey) || 0;
        const timeSinceLast = now - lastSent;

        // Enforce strict 5-minute gap between emails for each session
        if (timeSinceLast < PERIODIC_INTERVAL_MS) {
          const remainingSecs = Math.ceil((PERIODIC_INTERVAL_MS - timeSinceLast) / 1000);
          console.log(`⏳ [SOS Periodic Worker] Session #${session.id}: next email in ${remainingSecs}s — skipping.`);
          continue;
        }

        // Mark this session as sent NOW (before sending, to prevent race conditions)
        lastSentMap.set(sessionKey, now);
        console.log(`📡 [SOS Periodic Worker] Dispatching 5-min location update for session #${session.id}...`);

        const victim = session.user;
        const latestLocation = session.locations?.[0];

        const latitude = latestLocation?.latitude || session.latitude || 18.5204;
        const longitude = latestLocation?.longitude || session.longitude || 73.8567;
        const trackingUrl = `${clientBaseUrl}/live-track/${session.shareToken}`;
        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        // Collect all target recipient emails (Victim + Admin + Parent + Guardians)
        const recipientEmails = collectEmergencyRecipients(victim);

        // Send 5-minute periodic email alert concurrently to each recipient
        await Promise.all(
          recipientEmails.map(async (recipientEmail) => {
            try {
              const sent = await sendSos5MinLocationUpdate({
                recipientEmail,
                victimName: victim?.fullName || 'Sakhi Member',
                victimPhone: victim?.phone || 'N/A',
                victimEmail: victim?.email || 'N/A',
                victimPhoto: victim?.profilePhoto || null,
                trackingUrl,
                googleMapsUrl,
                latitude,
                longitude,
                sosId: session.id,
                startedAt: session.startedAt,
              });

              // Log in SosAlert ledger table
              await prisma.sosAlert.create({
                data: {
                  sosSessionId: session.id,
                  channel: 'EMAIL_5MIN_PERIODIC',
                  recipient: recipientEmail,
                  status: sent ? 'SENT' : 'FAILED',
                },
              }).catch(() => {});
            } catch (err) {
              console.error(`[SOS Periodic Worker Error] Email failed for ${recipientEmail}:`, err.message);
            }
          })
        );

        // Emit Socket.io periodic update event
        const io = getIO();
        if (io) {
          io.emit('SOS_PERIODIC_5MIN_UPDATE', {
            sosId: session.id,
            victimName: victim?.fullName || 'Sakhi Member',
            victimPhone: victim?.phone || 'N/A',
            latitude,
            longitude,
            trackingUrl,
            googleMapsUrl,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // 2. Fetch all IN_PROGRESS Journeys that have passed their expected arrival time
      const overdueJourneys = await prisma.journey.findMany({
        where: {
          status: 'IN_PROGRESS',
          expectedArrival: { lte: new Date() },
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              profilePhoto: true,
              parentEmail: true,
              emergencyContactPhone: true,
              trustedContacts: true,
            },
          },
        },
      });

      for (const journey of overdueJourneys) {
        console.log(`🚨 [SOS Worker] Journey #${journey.id} for ${journey.user.fullName} is OVERDUE! Escalating emergency alert...`);

        // Mark journey as OVERDUE
        await prisma.journey.update({
          where: { id: journey.id },
          data: { status: 'OVERDUE' },
        });

        // Mark user safety status as SOS_ACTIVE
        await prisma.user.update({
          where: { id: journey.userId },
          data: { safetyStatus: 'SOS_ACTIVE' },
        });

        // Create or get active SOS Session for emergency escalation
        let session = await prisma.sosSession.findFirst({
          where: { userId: journey.userId, status: 'ACTIVE' },
        });

        if (!session) {
          session = await prisma.sosSession.create({
            data: {
              userId: journey.userId,
              status: 'ACTIVE',
              isSilent: false,
              shareToken: journey.shareToken,
            },
          });
        }

        const latitude = journey.destLat || 18.5204;
        const longitude = journey.destLng || 73.8567;
        const trackingUrl = `${clientBaseUrl}/live-track/${journey.shareToken}`;
        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        const sosAlarmPayload = {
          sosId: session.id,
          journeyId: journey.id,
          isOverdueJourney: true,
          victimId: journey.user.id,
          victimName: journey.user.fullName || 'Sakhi Suraksha User',
          victimPhone: journey.user.phone || '',
          victimEmail: journey.user.email || '',
          victimPhoto: journey.user.profilePhoto || null,
          shareToken: journey.shareToken,
          trackingUrl,
          googleMapsUrl,
          latitude,
          longitude,
          destinationName: journey.destinationName,
          expectedArrival: journey.expectedArrival,
          timestamp: new Date().toISOString(),
        };

        // Broadcast real-time siren alert to all connected parents, guardians & sockets
        const io = getIO();
        if (io) {
          io.emit('SOS_ALARM_BROADCAST', sosAlarmPayload);
        }
      }

      // Cleanup stale entries from lastSentMap (sessions older than 24h)
      for (const [key, sentAt] of lastSentMap.entries()) {
        if (now - sentAt > 24 * 60 * 60 * 1000) {
          lastSentMap.delete(key);
        }
      }
    } catch (err) {
      console.error('❌ [SOS Periodic Worker Error]:', err.message);
    }
  }, CHECK_INTERVAL_MS);
};

export const stopSosPeriodicWorker = () => {
  if (globalThis[WORKER_KEY]) {
    clearInterval(globalThis[WORKER_KEY]);
    globalThis[WORKER_KEY] = null;
    console.log('🛑 [SOS Periodic Worker] Stopped.');
  }
};
