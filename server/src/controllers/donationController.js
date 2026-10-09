import { prisma } from '../config/prisma.js';
import { config } from '../config/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { generatePayUHash, verifyPayUResponseHash } from '../utils/payu.js';

export const initiateDonation = asyncHandler(async (req, res) => {
  const { name, email, phone, amount } = req.body;

  if (!name || !email || !phone || !amount) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const txnid = `DONATION_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const productinfo = 'Donation for Women Safety Support';
  
  const hash = generatePayUHash({
    txnid,
    amount: amount,
    productinfo,
    firstname: name,
    email,
  });

  // Save pending donation
  await prisma.donation.create({
    data: {
      name,
      email,
      phone,
      amount: parseFloat(amount),
      status: 'PENDING',
      txnid,
      hash
    }
  });

  const surl = `${config.payu.serverBaseUrl}/api/donations/payu-success`;
  const furl = `${config.payu.serverBaseUrl}/api/donations/payu-failure`;

  return res.json({
    message: 'Donation transaction initiated',
    paymentData: {
      actionUrl: config.payu.baseUrl,
      key: config.payu.key,
      txnid,
      amount: parseFloat(amount).toFixed(2),
      productinfo,
      firstname: name,
      email,
      phone,
      surl,
      furl,
      hash,
    },
  });
});

export const handleDonationSuccess = asyncHandler(async (req, res) => {
  const payuResponse = Object.keys(req.body).length > 0 ? req.body : req.query;
  const { txnid, mihpayid, mode, status } = payuResponse;

  if (!txnid) {
    const fallbackUrl = `${config.payu.clientUrl}/donate`;
    if (req.headers['content-type']?.includes('application/x-www-form-urlencoded') || req.method === 'GET') {
      return res.redirect(fallbackUrl);
    }
    return res.status(400).json({ success: false, message: 'Invalid payment callback data' });
  }

  const verification = verifyPayUResponseHash(payuResponse);
  const donationRecord = await prisma.donation.findUnique({ where: { txnid } });

  if (status === 'success' || verification.isValid) {
    if (donationRecord) {
      await prisma.donation.update({
        where: { id: donationRecord.id },
        data: {
          status: 'SUCCESS',
          payuMoneyId: mihpayid || payuResponse.payuMoneyId || null,
          paymentMode: mode || payuResponse.mode || 'ONLINE',
        },
      });
    }

    const clientRedirectUrl = `${config.payu.clientUrl}/donate/success?status=success&txnid=${txnid}`;
    if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
      return res.redirect(clientRedirectUrl);
    }

    return res.json({
      success: true,
      message: 'Donation completed successfully!',
      txnid,
      status: 'SUCCESS',
    });
  } else {
    if (donationRecord) {
      await prisma.donation.update({
        where: { id: donationRecord.id },
        data: { status: 'FAILED' },
      });
    }

    const clientRedirectUrl = `${config.payu.clientUrl}/donate/success?status=failed&txnid=${txnid}`;
    if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
      return res.redirect(clientRedirectUrl);
    }

    return res.status(400).json({
      success: false,
      message: 'Payment hash verification failed or transaction declined',
    });
  }
});

export const handleDonationFailure = asyncHandler(async (req, res) => {
  const payuResponse = Object.keys(req.body).length > 0 ? req.body : req.query;
  const { txnid } = payuResponse;

  if (!txnid) {
    const fallbackUrl = `${config.payu.clientUrl}/donate`;
    if (req.headers['content-type']?.includes('application/x-www-form-urlencoded') || req.method === 'GET') {
      return res.redirect(fallbackUrl);
    }
    return res.status(400).json({ success: false, message: 'Invalid payment callback data' });
  }

  if (txnid) {
    await prisma.donation.updateMany({
      where: { txnid },
      data: { status: 'FAILED' },
    });
  }

  const clientRedirectUrl = `${config.payu.clientUrl}/donate/success?status=failed&txnid=${txnid || ''}`;
  if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
    return res.redirect(clientRedirectUrl);
  }

  return res.status(400).json({
    success: false,
    message: 'Donation failed or cancelled',
  });
});

export const getAllDonations = asyncHandler(async (req, res) => {
  const donations = await prisma.donation.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ success: true, donations });
});
