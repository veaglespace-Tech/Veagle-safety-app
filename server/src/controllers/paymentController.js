import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { config } from '../config/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getRazorpayClient, verifyRazorpaySignature, resolveRazorpayCredentials } from '../utils/razorpay.js';
import { syncParentProfileAndLink } from '../services/parentService.js';
import { sendWelcomeEmail } from '../services/mailer.js';

if (!global.pendingRegistrations) {
  global.pendingRegistrations = new Map();
}

/**
 * Create Razorpay Order for Subscription Payment
 */
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { planId, registrationToken, pendingToken, couponCode } = req.body;
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
          phone: decodedRegistration.phone || '9999999999',
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

  // Fetch target plan
  let plan = null;
  if (planId) {
    plan = await prisma.plan.findUnique({ where: { id: planId } });
  }
  if (!plan) {
    plan = await prisma.plan.findFirst({ where: { isActive: true } });
  }

  const gstSetting = await prisma.systemSetting.findUnique({ where: { key: 'GST_PERCENTAGE' } });
  const globalGst = gstSetting && !isNaN(parseFloat(gstSetting.value)) ? parseFloat(gstSetting.value) : 18.0;

  const baseAmount = plan ? plan.basePrice : 24.0;
  let gstPercentage = baseAmount === 0 ? 0 : (gstSetting && !isNaN(parseFloat(gstSetting.value)))
    ? parseFloat(gstSetting.value)
    : (plan?.gstPercentage !== undefined && !isNaN(parseFloat(plan.gstPercentage)))
      ? parseFloat(plan.gstPercentage)
      : globalGst;

  let discountedBaseAmount = baseAmount;
  let coupon = null;

  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    if (coupon && coupon.isActive) {
      if (coupon.discountType === 'PERCENTAGE') {
        discountedBaseAmount = baseAmount - (baseAmount * coupon.discountValue / 100);
      } else if (coupon.discountType === 'FLAT_AMOUNT') {
        discountedBaseAmount = baseAmount - coupon.discountValue;
      }
      if (discountedBaseAmount < 0) discountedBaseAmount = 0;
    }
  }

  const gstAmount = (discountedBaseAmount === 0 || gstPercentage === 0) ? 0 : parseFloat(((discountedBaseAmount * gstPercentage) / 100).toFixed(2));
  const totalAmount = discountedBaseAmount === 0 ? 0 : parseFloat((discountedBaseAmount + gstAmount).toFixed(2));

  // FREE PLAN — activate directly without Razorpay
  if (baseAmount === 0 || totalAmount === 0) {
    const durationDays = plan?.durationDays || 7;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const freeTxnId = `FREE_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    let activeUser = null;

    if (req.user?.id) {
      const updateData = { subscriptionStatus: 'ACTIVE', subscriptionExpiresAt: expiresAt };
      if (decodedRegistration?.organizationId) {
        updateData.organizationId = decodedRegistration.organizationId;
      }
      if (decodedRegistration?.referredByPartnerId) {
        updateData.referredByPartnerId = decodedRegistration.referredByPartnerId;
      }
      activeUser = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
      });
    } else if (decodedRegistration?.email) {
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
            medicalNotes: decodedRegistration.medicalNotes || null,
            isEmailVerified: true,
            subscriptionStatus: 'ACTIVE',
            subscriptionExpiresAt: expiresAt,
            organizationId: decodedRegistration.organizationId || null,
            referredByPartnerId: decodedRegistration.referredByPartnerId || null,
          },
        });

        if (decodedRegistration.emergencyContactName && decodedRegistration.emergencyContactPhone) {
          try {
            await prisma.trustedContact.create({
              data: {
                userId: activeUser.id,
                name: decodedRegistration.emergencyContactName,
                relationship: 'Guardian',
                phone: decodedRegistration.emergencyContactPhone,
                email: decodedRegistration.parentEmail || '',
                isVerified: true,
                priorityOrder: 1,
              },
            });
          } catch (e) {
            console.log('[Register Notice] Primary contact creation skipped:', e.message);
          }
          try {
            await syncParentProfileAndLink({
              childId: activeUser.id,
              parentPhone: decodedRegistration.emergencyContactPhone,
              parentName: decodedRegistration.emergencyContactName,
              parentEmail: decodedRegistration.parentEmail || '',
              relationship: 'Parent',
            });
          } catch (syncErr) {
            console.warn('[Payment Notice] syncParentProfileAndLink notice:', syncErr.message);
          }
        }
      } else {
        activeUser = await prisma.user.update({
          where: { id: activeUser.id },
          data: { subscriptionStatus: 'ACTIVE', subscriptionExpiresAt: expiresAt },
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

      // Send Welcome Email to newly registered user
      if (activeUser?.email) {
        sendWelcomeEmail({
          recipientEmail: activeUser.email,
          userName: activeUser.fullName,
          userPhoto: activeUser.profilePhoto,
        }).catch((err) => console.warn('[Free Plan Welcome Email Error]:', err.message));
      }

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

  // PAID PLAN — create Razorpay order
  const txnid = `VEAGLE_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const productinfo = plan ? plan.name : 'Sakhi Suraksha 365 Yearly Protection Plan';

  // Razorpay amount is in paise (₹1 = 100 paise)
  const amountInPaise = Math.round(totalAmount * 100);

  const { keyId: activeKeyId } = resolveRazorpayCredentials();

  let razorpayOrder;
  try {
    razorpayOrder = await getRazorpayClient().orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: txnid,
      notes: {
        productinfo,
        userEmail: user.email,
        userPhone: user.phone || '',
        planId: plan ? String(plan.id) : '',
      },
    });
  } catch (rzpErr) {
    console.error('[Razorpay Order Creation Error]:', rzpErr);
    return res.status(400).json({
      success: false,
      message: rzpErr?.error?.description || rzpErr?.message || 'Payment gateway initialization failed. Please try again.',
    });
  }

  // Save pending payment record
  let dbUser = user.id ? user : (user.email ? await prisma.user.findUnique({ where: { email: user.email } }) : null);
  if (dbUser?.id) {
    try {
      await prisma.paymentHistory.create({
        data: {
          userId: dbUser.id,
          planId: plan ? plan.id : null,
          txnid,
          amount: totalAmount,
          baseAmount: discountedBaseAmount,
          gstAmount,
          gstPercentage,
          status: 'PENDING',
          hash: razorpayOrder.id, // Store Razorpay order ID in hash field
          couponId: coupon ? coupon.id : null,
        },
      });
    } catch (payHistErr) {
      console.warn('[Payment Notice] Pending payment history log notice:', payHistErr.message);
    }
  }

  if (registrationToken) {
    global.pendingRegistrations.set(txnid, registrationToken);
    setTimeout(() => global.pendingRegistrations.delete(txnid), 30 * 60 * 1000);
  }

  return res.json({
    message: 'Razorpay order created',
    paymentData: {
      orderId: razorpayOrder.id,
      keyId: activeKeyId,
      txnid,
      amount: amountInPaise,
      amountDisplay: totalAmount.toFixed(2),
      baseAmount: discountedBaseAmount,
      gstAmount,
      gstPercentage,
      currency: 'INR',
      productinfo,
      name: user.fullName,
      email: user.email,
      phone: user.phone || '',
      description: productinfo,
    },
  });
});

/**
 * Verify Razorpay Payment & Activate Subscription
 */
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    txnid,
    registrationToken,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing Razorpay payment parameters' });
  }

  // 1. Verify signature
  const isValid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    // Mark as failed in DB
    if (txnid) {
      await prisma.paymentHistory.updateMany({
        where: { txnid },
        data: { status: 'FAILED' },
      }).catch(() => {});
    }
    return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
  }

  // 2. Find payment record by txnid or razorpay_order_id (stored in hash field)
  let paymentRecord = txnid
    ? await prisma.paymentHistory.findUnique({ where: { txnid } })
    : await prisma.paymentHistory.findFirst({ where: { hash: razorpay_order_id } });

  let finalRegToken = registrationToken;
  if (!finalRegToken && txnid && global.pendingRegistrations.has(txnid)) {
    finalRegToken = global.pendingRegistrations.get(txnid);
    global.pendingRegistrations.delete(txnid);
  }

  let user = null;
  let decodedRegistration = null;

  if (finalRegToken) {
    try {
      decodedRegistration = jwt.verify(finalRegToken, config.jwt.secret);
    } catch (e) {
      console.error('Registration token verification error:', e.message);
    }
  }

  const durationDays = 365;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  // 3. Create user if pending registration
  let isNewlyCreatedUser = false;
  if (decodedRegistration?.email) {
    user = await prisma.user.findUnique({ where: { email: decodedRegistration.email } });
    if (!user) {
      isNewlyCreatedUser = true;
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
          organizationId: decodedRegistration.organizationId || null,
          referredByPartnerId: decodedRegistration.referredByPartnerId || null,
        },
      });

      if (decodedRegistration.emergencyContactName && decodedRegistration.emergencyContactPhone) {
        try {
          await prisma.trustedContact.create({
            data: {
              userId: user.id,
              name: decodedRegistration.emergencyContactName,
              relationship: 'Guardian',
              phone: decodedRegistration.emergencyContactPhone,
              email: decodedRegistration.parentEmail || '',
              isVerified: true,
              priorityOrder: 1,
            },
          });
        } catch (e) {
          console.log('[Register Notice] Primary contact creation skipped:', e.message);
        }
        try {
          await syncParentProfileAndLink({
            childId: user.id,
            parentPhone: decodedRegistration.emergencyContactPhone,
            parentName: decodedRegistration.emergencyContactName,
            parentEmail: decodedRegistration.parentEmail || '',
            relationship: 'Parent',
          });
        } catch (syncErr) {
          console.warn('[Payment Notice] syncParentProfileAndLink notice:', syncErr.message);
        }
      }
    }
  }

  if (!user && paymentRecord) {
    user = await prisma.user.findUnique({ where: { id: paymentRecord.userId } });
  }

  // 4. Activate subscription
  if (user) {
    const updateData = { subscriptionStatus: 'ACTIVE', subscriptionExpiresAt: expiresAt };
    if (decodedRegistration?.organizationId && !user.organizationId) {
      updateData.organizationId = decodedRegistration.organizationId;
    }
    if (decodedRegistration?.referredByPartnerId && !user.referredByPartnerId) {
      updateData.referredByPartnerId = decodedRegistration.referredByPartnerId;
    }
    user = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
  }

  // 5. Update or create payment record
  if (paymentRecord) {
    await prisma.paymentHistory.update({
      where: { id: paymentRecord.id },
      data: {
        status: 'SUCCESS',
        payuMoneyId: razorpay_payment_id, // Reusing field for Razorpay payment ID
        paymentMode: 'ONLINE',
      },
    });
  } else if (user) {
    const gstSetting = await prisma.systemSetting.findUnique({ where: { key: 'GST_PERCENTAGE' } });
    const currentGst = gstSetting && !isNaN(parseFloat(gstSetting.value)) ? parseFloat(gstSetting.value) : 18.0;
    let paidAmt = paymentRecord?.amount;
    if (!paidAmt || paidAmt === 0) {
      try {
        const orderInfo = await getRazorpayClient().orders.fetch(razorpay_order_id);
        if (orderInfo && orderInfo.amount) {
          paidAmt = Number((orderInfo.amount / 100).toFixed(2));
        }
      } catch (e) {
        paidAmt = 28.32;
      }
    }
    const baseAmt = Number((paidAmt / (1 + currentGst / 100)).toFixed(2));
    const gstAmt = Number((paidAmt - baseAmt).toFixed(2));

    paymentRecord = await prisma.paymentHistory.create({
      data: {
        userId: user.id,
        txnid: txnid || razorpay_order_id,
        amount: paidAmt,
        baseAmount: baseAmt,
        gstAmount: gstAmt,
        gstPercentage: currentGst,
        status: 'SUCCESS',
        payuMoneyId: razorpay_payment_id,
        paymentMode: 'ONLINE',
        hash: razorpay_order_id,
      },
    });
  }

  // 6. Generate session token
  const sessionToken = user
    ? jwt.sign(
        { id: user.id, userId: user.id, role: user.role, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )
    : null;

  // Send Welcome Email to newly registered user after successful payment
  if (isNewlyCreatedUser && user?.email) {
    sendWelcomeEmail({
      recipientEmail: user.email,
      userName: user.fullName,
      userPhoto: user.profilePhoto,
    }).catch((err) => console.warn('[Payment Welcome Email Error]:', err.message));
  }

  return res.json({
    success: true,
    message: 'Payment verified and subscription activated successfully!',
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
    txnid: txnid || razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    status: 'SUCCESS',
  });
});

/**
 * Handle payment failure (called from frontend on Razorpay dismiss/failure)
 */
export const handlePaymentFailure = asyncHandler(async (req, res) => {
  const { txnid, razorpay_order_id } = req.body;

  if (txnid) {
    await prisma.paymentHistory.updateMany({
      where: { txnid },
      data: { status: 'FAILED' },
    }).catch(() => {});
  } else if (razorpay_order_id) {
    await prisma.paymentHistory.updateMany({
      where: { hash: razorpay_order_id },
      data: { status: 'FAILED' },
    }).catch(() => {});
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
