import { prisma } from '../config/prisma.js';

export const startCheckin = async (req, res) => {
  try {
    const { intervalMins } = req.body;
    const mins = Number(intervalMins) || 15;
    const triggerAt = new Date(Date.now() + mins * 60 * 1000);

    const checkin = await prisma.safetyCheckin.create({
      data: {
        userId: req.user?.id,
        intervalMins: mins,
        triggerAt,
      },
    });

    return res.status(201).json({ message: 'Safety check-in timer started', checkin });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to start safety check-in timer' });
  }
};

export const confirmCheckinSafe = async (req, res) => {
  try {
    const { checkinId } = req.body;

    const checkin = await prisma.safetyCheckin.update({
      where: { id: checkinId },
      data: { status: 'CONFIRMED_SAFE' },
    });

    return res.json({ message: 'Safety check-in confirmed', checkin });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to confirm safety check-in' });
  }
};

export const getActiveCheckin = async (req, res) => {
  try {
    const checkin = await prisma.safetyCheckin.findFirst({
      where: { userId: req.user?.id, status: 'PENDING' },
      orderBy: { triggerAt: 'asc' },
    });

    return res.json({ checkin });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch active safety check-in' });
  }
};
