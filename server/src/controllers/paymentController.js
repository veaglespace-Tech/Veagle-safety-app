import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { config } from '../config/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { generatePayUHash, verifyPayUResponseHash } from '../utils/payu.js';

/**
 * Initiate PayU Payment for User Subscription
 */
export const initiatePayUPayment = asyncHandler(async (req, res) => {
  const { planId, registrationToken, pendingToken } = req.body;
  const tokenFromHeader = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
  const regTokenToUse = registrationToken || pendingToken || tokenFromHeader;

  let user = null;
  let decodedRegistration = null;

  if (req.user?.id) {
    user = await prisma.user.findUnique({ where: { id: req.user.id } });
  }

  if (!user && regTokenToUse) {
    try {
      decodedRegistration = jwt.verify(regTokenToUse, config.jwt.secret);
      if (decodedRegistration.fullName || decodedRegistration.email) {
        user = {
          fullName: decodedRegistration.fullName || 'Sakhi Member',
          email: decodedRegistration.email,
          phone: decodedRegistration.phone || '+91 98765 43210',
          isPendingRegistration: true,
        };
      }
    } catch (e) {
      console.warn('[Payment Notice] Pending token verify notice:', e.message);
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'User registration session or authentication required' });
  }

  // Fetch target plan or fetch default 24 INR plan
  let plan = null;
  if (planId) {
    plan = await prisma.plan.findUnique({ where: { id: planId } });
  }

  if (!plan) {
    plan = await prisma.plan.findFirst({ where: { isActive: true } });
  }

  const baseAmount = plan ? plan.basePrice : 24.0;
  let gstPercentage = plan ? plan.gstPercentage : 18.0;

  if (baseAmount === 0) {
    gstPercentage = 0;
  } else {
    const gstSetting = await prisma.systemSetting.findUnique({ where: { key: 'GST_PERCENTAGE' } });
    if (gstSetting) {
      gstPercentage = parseFloat(gstSetting.value) || 18.0;
    }
  }

  const gstAmount = baseAmount === 0 ? 0 : parseFloat(((baseAmount * gstPercentage) / 100).toFixed(2));
  const totalAmount = baseAmount === 0 ? 0 : parseFloat((baseAmount + gstAmount).toFixed(2));

  // IF PLAN IS 100% FREE (0 INR): Activate subscription directly without PayU!
  if (baseAmount === 0 || totalAmount === 0) {
    const durationDays = plan?.durationDays || 7;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const freeTxnId = `FREE_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    let activeUser = null;

    if (req.user?.id) {
      activeUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: expiresAt,
        },
      });
    } else if (decodedRegistration && decodedRegistration.email) {
      activeUser = await prisma.user.findUnique({ where: { email: decodedRegistration.email } });
      if (!activeUser) {
        activeUser = await prisma.user.create({
          data: {
            fullName: decodedRegistration.fullName,
            email: decodedRegistration.email,
            phone: decodedRegistration.phone,
            passwordHash: decodedRegistration.passwordHash,
            role: decodedRegistration.role || 'USER',
            profilePhoto: decodedRegistration.profilePhoto || 'https://ik.imagekit.io/m5ei0wbuw/avatar-woman-1.png',
            bloodGroup: decodedRegistration.bloodGroup || 'O+',
            address: decodedRegistration.address || 'Not Specified',
            city: decodedRegistration.city || 'Pune',
            state: decodedRegistration.state || 'Maharashtra',
            country: decodedRegistration.country || 'India',
            pincode: decodedRegistration.pincode || '411001',
            emergencyContactName: decodedRegistration.emergencyContactName || null,
            emergencyContactPhone: decodedRegistration.emergencyContactPhone || null,
            parentEmail: decodedRegistration.parentEmail || null,
            isEmailVerified: true,
            subscriptionStatus: 'ACTIVE',
            subscriptionExpiresAt: expiresAt,
          },
        });

        if (decodedRegistration.emergencyContactName && decodedRegistration.emergencyContactPhone) {
          try {
            await prisma.trustedContact.create({
              data: {
                userId: activeUser.id,
                name: decodedRegistration.emergencyContactName,
                relationship: 'Primary Guardian / Emergency Contact',
                phone: decodedRegistration.emergencyContactPhone,
                email: decodedRegistration.email,
                isVerified: true,
                priorityOrder: 1,
              },
            });
          } catch (e) {
            console.log('[Register Notice] Primary contact creation skipped:', e.message);
          }
        }
      } else {
        activeUser = await prisma.user.update({
          where: { id: activeUser.id },
          data: {
            subscriptionStatus: 'ACTIVE',
            subscriptionExpiresAt: expiresAt,
          },
        });
      }
    }

    if (activeUser) {
      await prisma.paymentHistory.create({
        data: {
          userId: activeUser.id,
          planId: plan ? plan.id : null,
          txnid: freeTxnId,
          amount: 0,
          baseAmount: 0,
          gstAmount: 0,
          gstPercentage: 0,
          status: 'SUCCESS',
          paymentMode: 'FREE_TRIAL',
        },
      });

      const sessionToken = jwt.sign(
        { id: activeUser.id, userId: activeUser.id, role: activeUser.role, email: activeUser.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return res.json({
        success: true,
        isFree: true,
        message: 'Free Trial Plan activated successfully!',
        token: sessionToken,
        user: {
          id: activeUser.id,
          fullName: activeUser.fullName,
          email: activeUser.email,
          phone: activeUser.phone,
          role: activeUser.role,
          subscriptionStatus: activeUser.subscriptionStatus,
        },
        txnid: freeTxnId,
      });
    }
  }

  const txnid = `VEAGLE_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const productinfo = plan ? plan.name : 'Sakhi Suraksha 365 Yearly Protection Plan';
  const firstname = user.fullName.split(' ')[0] || user.fullName;
  const email = user.email;

  const hash = generatePayUHash({
    txnid,
    amount: totalAmount,
    productinfo,
    firstname,
    email,
  });

  // Save pending transaction record (if user exists in DB, attach userId)
  let dbUser = user.id ? user : (email ? await prisma.user.findUnique({ where: { email } }) : null);
  if (dbUser && dbUser.id) {
    try {
      await prisma.paymentHistory.create({
        data: {
          userId: dbUser.id,
          planId: plan ? plan.id : null,
          txnid,
          amount: totalAmount,
          baseAmount,
          gstAmount,
          gstPercentage,
          status: 'PENDING',
          hash,
        },
      });
    } catch (payHistErr) {
      console.warn('[Payment Notice] Pending payment history log notice:', payHistErr.message);
    }
  }

  const surl = `${config.payu.serverBaseUrl}/api/payment/payu-success`;
  const furl = `${config.payu.serverBaseUrl}/api/payment/payu-failure`;

  return res.json({
    message: 'Payment transaction initiated',
    paymentData: {
      actionUrl: config.payu.baseUrl,
      key: config.payu.key,
      txnid,
      amount: totalAmount,
      baseAmount,
      gstAmount,
      gstPercentage,
      productinfo,
      firstname,
      email,
      phone: user.phone,
      surl,
      furl,
      hash,
    },
  });
});

/**
 * PayU Success Callback Handler
 */
export const handlePayUSuccess = asyncHandler(async (req, res) => {
  const payuResponse = req.body;
  const { txnid, mihpayid, mode, status, registrationToken } = payuResponse;

  const verification = verifyPayUResponseHash(payuResponse);

  let paymentRecord = await prisma.paymentHistory.findUnique({ where: { txnid } });

  let user = null;
  let decodedRegistration = null;

  if (registrationToken) {
    try {
      decodedRegistration = jwt.verify(registrationToken, config.jwt.secret);
    } catch (e) {
      console.error('Registration token verification error:', e.message);
    }
  }

  if (status === 'success' || verification.isValid) {
    let durationDays = 365;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // If user is not yet in DB, create user entry now upon successful payment completion!
    if (decodedRegistration && decodedRegistration.email) {
      user = await prisma.user.findUnique({ where: { email: decodedRegistration.email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            fullName: decodedRegistration.fullName,
            email: decodedRegistration.email,
            phone: decodedRegistration.phone,
            passwordHash: decodedRegistration.passwordHash,
            role: decodedRegistration.role || 'USER',
            profilePhoto: decodedRegistration.profilePhoto || 'https://ik.imagekit.io/m5ei0wbuw/avatar-woman-1.png',
            bloodGroup: decodedRegistration.bloodGroup || 'O+',
            address: decodedRegistration.address || 'Not Specified',
            city: decodedRegistration.city || 'Pune',
            state: decodedRegistration.state || 'Maharashtra',
            country: decodedRegistration.country || 'India',
            pincode: decodedRegistration.pincode || '411001',
            emergencyContactName: decodedRegistration.emergencyContactName || null,
            emergencyContactPhone: decodedRegistration.emergencyContactPhone || null,
            parentEmail: decodedRegistration.parentEmail || null,
            medicalNotes: decodedRegistration.medicalNotes || null,
            isEmailVerified: true,
            subscriptionStatus: 'ACTIVE',
            subscriptionExpiresAt: expiresAt,
          },
        });

        if (decodedRegistration.emergencyContactName && decodedRegistration.emergencyContactPhone) {
          try {
            await prisma.trustedContact.create({
              data: {
                userId: user.id,
                name: decodedRegistration.emergencyContactName,
                relationship: 'Primary Guardian / Emergency Contact',
                phone: decodedRegistration.emergencyContactPhone,
                email: decodedRegistration.email,
                isVerified: true,
                priorityOrder: 1,
              },
            });
          } catch (e) {
            console.log('[Register Notice] Primary contact creation skipped:', e.message);
          }
        }
      }
    }

    if (!user && paymentRecord) {
      user = await prisma.user.findUnique({ where: { id: paymentRecord.userId } });
    }

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: expiresAt,
        },
      });
    }

    if (paymentRecord) {
      await prisma.paymentHistory.update({
        where: { id: paymentRecord.id },
        data: {
          status: 'SUCCESS',
          payuMoneyId: mihpayid || payuResponse.payuMoneyId || null,
          paymentMode: mode || payuResponse.mode || 'ONLINE',
        },
      });
    } else if (user) {
      paymentRecord = await prisma.paymentHistory.create({
        data: {
          userId: user.id,
          txnid,
          amount: parseFloat(payuResponse.amount || 28.32),
          baseAmount: 24.0,
          gstAmount: 4.32,
          gstPercentage: 18.0,
          status: 'SUCCESS',
          payuMoneyId: mihpayid || payuResponse.payuMoneyId || null,
          paymentMode: mode || payuResponse.mode || 'ONLINE',
        },
      });
    }

    const sessionToken = user
      ? jwt.sign(
          { id: user.id, userId: user.id, role: user.role, email: user.email },
          config.jwt.secret,
          { expiresIn: config.jwt.expiresIn }
        )
      : null;

    const clientRedirectUrl = `${config.payu.clientUrl}/payment/success?status=success&txnid=${txnid}`;
    if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
      return res.redirect(clientRedirectUrl);
    }

    return res.json({
      success: true,
      message: 'Payment completed and user account activated successfully!',
      token: sessionToken,
      user: user
        ? {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            subscriptionStatus: user.subscriptionStatus,
          }
        : null,
      txnid,
      status: 'SUCCESS',
    });
  } else {
    await prisma.paymentHistory.update({
      where: { id: paymentRecord.id },
      data: { status: 'FAILED' },
    });

    const clientRedirectUrl = `${config.payu.clientUrl}/payment/success?status=failed&txnid=${txnid}`;
    if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
      return res.redirect(clientRedirectUrl);
    }

    return res.status(400).json({
      success: false,
      message: 'Payment hash verification failed or transaction declined',
    });
  }
});

/**
 * PayU Failure Callback Handler
 */
export const handlePayUFailure = asyncHandler(async (req, res) => {
  const { txnid } = req.body;

  if (txnid) {
    await prisma.paymentHistory.updateMany({
      where: { txnid },
      data: { status: 'FAILED' },
    });
  }

  const clientRedirectUrl = `${config.payu.clientUrl}/payment-status?status=failed&txnid=${txnid || ''}`;
  if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
    return res.redirect(clientRedirectUrl);
  }

  return res.status(400).json({
    success: false,
    message: 'Payment failed or cancelled by user',
  });
});

/**
 * Get User Payment History
 */
export const getUserPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  const history = await prisma.paymentHistory.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ history });
});
