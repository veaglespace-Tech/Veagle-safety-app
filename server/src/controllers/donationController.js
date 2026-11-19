import { prisma } from '../config/prisma.js';
import { config } from '../config/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getRazorpayClient, verifyRazorpaySignature, resolveRazorpayCredentials } from '../utils/razorpay.js';

export const initiateDonation = asyncHandler(async (req, res) => {
  const { name, email, phone, amount } = req.body;

  if (!name || !email || !phone || !amount) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Invalid donation amount' });
  }

  const txnid = `DONATION_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const productinfo = 'Donation for Women Safety Support';

  // Razorpay amount in paise
  const amountInPaise = Math.round(parsedAmount * 100);
  const { keyId: activeKeyId } = resolveRazorpayCredentials();

  let razorpayOrder;
  try {
    razorpayOrder = await getRazorpayClient().orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: txnid,
      notes: {
        name,
        email,
        phone,
        purpose: productinfo,
      },
    });
  } catch (rzpErr) {
    console.error('[Donation Order Creation Error]:', rzpErr);
    return res.status(400).json({
      error: rzpErr?.error?.description || rzpErr?.message || 'Payment gateway initialization failed. Please try again.',
    });
  }

  // Save pending donation
  await prisma.donation.create({
    data: {
      name,
      email,
      phone,
      amount: parsedAmount,
      status: 'PENDING',
      txnid,
      hash: razorpayOrder.id, // Store Razorpay order ID
    },
  });

  return res.json({
    message: 'Donation order created',
    paymentData: {
      orderId: razorpayOrder.id,
      keyId: activeKeyId,
      txnid,
      amount: amountInPaise,
      amountDisplay: parsedAmount.toFixed(2),
      currency: 'INR',
      productinfo,
      name,
      email,
      phone,
    },
  });
});

export const verifyDonationPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    txnid,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing Razorpay payment parameters' });
  }

  // Verify signature
  const isValid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    if (txnid) {
      await prisma.donation.updateMany({ where: { txnid }, data: { status: 'FAILED' } }).catch(() => {});
    }
    return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
  }

  // Find and update donation record
  const donationRecord = txnid
    ? await prisma.donation.findUnique({ where: { txnid } })
    : await prisma.donation.findFirst({ where: { hash: razorpay_order_id } });

  if (donationRecord) {
    await prisma.donation.update({
      where: { id: donationRecord.id },
      data: {
        status: 'SUCCESS',
        payuMoneyId: razorpay_payment_id,
        paymentMode: 'ONLINE',
      },
    });
  }

  return res.json({
    success: true,
    message: 'Donation completed successfully! Thank you for your contribution.',
    txnid: txnid || razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    status: 'SUCCESS',
  });
});

export const handleDonationFailure = asyncHandler(async (req, res) => {
  const { txnid, razorpay_order_id } = req.body;

  if (txnid) {
    await prisma.donation.updateMany({ where: { txnid }, data: { status: 'FAILED' } }).catch(() => {});
  } else if (razorpay_order_id) {
    await prisma.donation.updateMany({ where: { hash: razorpay_order_id }, data: { status: 'FAILED' } }).catch(() => {});
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
