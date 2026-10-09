import { prisma } from '../config/prisma.js';
import crypto from 'crypto';

export const startJourney = async (req, res) => {
  try {
    const { destinationName, originLat, originLng, destLat, destLng, minutesToArrive } = req.body;

    const expectedArrival = new Date(Date.now() + Number(minutesToArrive) * 60 * 1000);
    const shareToken = crypto.randomBytes(16).toString('hex');

    const journey = await prisma.journey.create({
      data: {
        userId: req.user?.id,
        originName: 'Current GPS Location',
        destinationName,
        originLat,
        originLng,
        destLat,
        destLng,
        expectedArrival,
        shareToken,
      },
    });

    await prisma.user.update({
      where: { id: req.user?.id },
      data: { safetyStatus: 'JOURNEY_ACTIVE' },
    });

    return res.status(201).json({ message: 'Protected journey started', journey });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to start journey' });
  }
};

export const completeJourney = async (req, res) => {
  try {
    const { journeyId } = req.body;

    // IDOR FIX: Verify journey belongs to the user and is active
    const existingJourney = await prisma.journey.findFirst({
      where: { id: journeyId, userId: req.user?.id }
    });

    if (!existingJourney) {
      return res.status(404).json({ error: 'Journey not found or unauthorized' });
    }

    const journey = await prisma.journey.update({
      where: { id: journeyId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: journey.userId },
      data: { safetyStatus: 'SAFE' },
    });

    return res.json({ message: 'Journey completed safely', journey });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to complete journey' });
  }
};

export const getActiveJourney = async (req, res) => {
  try {
    const journey = await prisma.journey.findFirst({
      where: { userId: req.user?.id, status: 'IN_PROGRESS' },
    });

    return res.json({ journey });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch active journey' });
  }
};
