import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { config } from '../config/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendEmailVerificationOtp, sendWelcomeEmail, sendPasswordResetEmail } from '../services/mailer.js';

/**
 * Register User / SuperAdmin with Email Verification OTP
 */
export const register = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phone,
    password,
    role,
    profilePhoto,
    bloodGroup,
    address,
    city,
    state,
    country,
    pincode,
    emergencyContactName,
    emergencyContactRelation,
    emergencyContactPhone,
    parentEmail,
    medicalNotes,
  } = req.body;

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^[6-9]\d{9}$/;

  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const cleanFullName = fullName ? fullName.trim() : '';

  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address (e.g. name@example.com).' });
  }

  if (!cleanPhone || !PHONE_REGEX.test(cleanPhone)) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.' });
  }

  if (emergencyContactPhone) {
    const cleanEmergencyPhone = emergencyContactPhone.replace(/\D/g, '');
    if (cleanEmergencyPhone && !PHONE_REGEX.test(cleanEmergencyPhone)) {
      return res.status(400).json({ error: 'Emergency contact phone must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.' });
    }
  }

  if (parentEmail && parentEmail.trim()) {
    const cleanParentEmail = parentEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanParentEmail)) {
      return res.status(400).json({ error: 'Please enter a valid parent email address.' });
    }
  }

  let assignedRole = 'USER';
  if (role === 'SUPER_ADMIN') assignedRole = 'SUPER_ADMIN';
  else if (role === 'ORGANIZATION') assignedRole = 'ORGANIZATION';
  else if (role === 'PARENT') assignedRole = 'PARENT';

  const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existingUser) {
    if (assignedRole === 'PARENT' || assignedRole === 'ORGANIZATION') {
      const passwordHash = await bcrypt.hash(password, 10);
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          fullName,
          phone,
          passwordHash,
          role: assignedRole,
          isEmailVerified: true,
        },
      });

      const token = jwt.sign(
        { id: updatedUser.id, userId: updatedUser.id, role: updatedUser.role, email: updatedUser.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return res.status(200).json({
        message: `${assignedRole} account logged in successfully`,
        token,
        user: {
          id: updatedUser.id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          subscriptionStatus: updatedUser.subscriptionStatus,
        },
      });
    }

    if (existingUser.isEmailVerified) {
      return res.status(409).json({ error: 'An account with this email already exists. Please Sign In instead.' });
    }

    // Update existing unverified user with new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { emailOtp: otp, emailOtpExpiresAt: otpExpires },
    });
    try {
      await sendEmailVerificationOtp({ recipientEmail: cleanEmail, userName: cleanFullName || fullName, otp });
    } catch (emailErr) {
      console.warn('[Register Email Notice] Verification email notice:', emailErr.message);
    }
    return res.status(200).json({
      message: `OTP code sent to ${cleanEmail}. (OTP Code: ${otp})`,
      requiresVerification: true,
      email: cleanEmail,
      debugOtp: otp,
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Generate 6-digit Email Verification OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  let user;
  try {
    user = await prisma.user.create({
      data: {
        fullName: cleanFullName,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        role: assignedRole,
        profilePhoto: profilePhoto || 'https://ik.imagekit.io/m5ei0wbuw/avatar-woman-1.png',
        bloodGroup: bloodGroup || 'O+',
        address: address || 'Not Specified',
        city: city || 'Pune',
        state: state || 'Maharashtra',
        country: country || 'India',
        pincode: pincode || '411001',
        emergencyContactName: assignedRole === 'USER' ? (emergencyContactName || null) : null,
        emergencyContactPhone: assignedRole === 'USER' ? (emergencyContactPhone || null) : null,
        parentEmail: parentEmail ? parentEmail.trim().toLowerCase() : null,
        medicalNotes: medicalNotes || null,
        isEmailVerified: assignedRole !== 'USER',
        emailOtp: assignedRole === 'USER' ? otp : null,
        emailOtpExpiresAt: assignedRole === 'USER' ? otpExpires : null,
        subscriptionStatus: assignedRole === 'SUPER_ADMIN' ? 'ACTIVE' : 'INACTIVE',
      },
    });
  } catch (dbErr) {
    if (dbErr.code === 'P2002') {
      return res.status(409).json({ error: 'An account with this email or mobile number already exists. Please Sign In.' });
    }
    console.error('[Registration DB Error]:', dbErr);
    return res.status(400).json({ error: dbErr.message || 'Failed to create account. Please try again.' });
  }

  if (assignedRole === 'USER' && emergencyContactName && emergencyContactPhone && emergencyContactName !== 'N/A') {
    try {
      await prisma.trustedContact.create({
        data: {
          userId: user.id,
          name: emergencyContactName,
          relationship: emergencyContactRelation || 'Guardian',
          phone: emergencyContactPhone,
          email: user.parentEmail || '',
          isVerified: true,
          priorityOrder: 1,
        },
      });
    } catch (e) {
      console.log('[Register Notice] Primary contact creation skipped:', e.message);
    }
  }

  try {
    if (assignedRole === 'USER') {
      const pendingRegistrationToken = jwt.sign(
        {
          id: user.id,
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          parentEmail: user.parentEmail,
          role: 'USER',
          otp,
          otpExpiresAt: otpExpires.getTime(),
          type: 'PENDING_REGISTRATION',
        },
        config.jwt.secret,
        { expiresIn: '2h' }
      );

      try {
        await sendEmailVerificationOtp({ recipientEmail: cleanEmail, userName: cleanFullName, otp });
      } catch (emailErr) {
        console.warn('[Register Email Notice] Verification email notice:', emailErr.message);
      }

      return res.status(200).json({
        message: `OTP code sent to ${cleanEmail}. (OTP Code: ${otp})`,
        requiresVerification: true,
        pendingToken: pendingRegistrationToken,
        email: cleanEmail,
        debugOtp: otp,
      });
    }

    // Non-USER roles (SuperAdmin, Organization, Parent) get immediate JWT login
    const token = jwt.sign(
      { id: user.id, userId: user.id, role: user.role, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return res.status(201).json({
      message: `${user.role} account registered successfully`,
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (err) {
    console.error('❌ [Register Controller Error]:', err);
    return res.status(500).json({ error: err.message || 'Registration processing failed. Please try again.' });
  }
});

/**
 * Verify Email Verification OTP (Without DB insertion for pending users)
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp, pendingToken } = req.body;

  if (!otp) {
    return res.status(400).json({ error: '6-digit OTP code is required' });
  }

  // Case 1: Check existing DB user (for resend OTP / existing users)
  const existingUser = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (existingUser) {
    if (existingUser.isEmailVerified) {
      const token = jwt.sign(
        { id: existingUser.id, userId: existingUser.id, role: existingUser.role, email: existingUser.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      return res.status(200).json({
        message: 'Email is already verified',
        token,
        user: {
          id: existingUser.id,
          fullName: existingUser.fullName,
          email: existingUser.email,
          phone: existingUser.phone,
          role: existingUser.role,
          subscriptionStatus: existingUser.subscriptionStatus,
        },
      });
    }

    if (existingUser.emailOtp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP code. Please check your email and try again.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: { isEmailVerified: true, emailOtp: null, emailOtpExpiresAt: null },
    });

    // Send Welcome Email after successful verification
    try {
      await sendWelcomeEmail({ recipientEmail: updatedUser.email, userName: updatedUser.fullName });
    } catch (welcomeErr) {
      console.warn('[Welcome Email Notice] Failed to send welcome email:', welcomeErr.message);
    }

    const token = jwt.sign(
      { id: updatedUser.id, userId: updatedUser.id, role: updatedUser.role, email: updatedUser.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return res.status(200).json({
      message: 'Email verified successfully!',
      token,
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        subscriptionStatus: updatedUser.subscriptionStatus,
      },
    });
  }

  // Case 2: Pending registration token verification (NO DB insertion yet)
  if (!pendingToken) {
    return res.status(400).json({ error: 'Registration session expired. Please register again.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(pendingToken, config.jwt.secret);
  } catch (err) {
    return res.status(400).json({ error: 'Registration session expired or invalid. Please try registering again.' });
  }

  if (decoded.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP code. Please check your email and try again.' });
  }

  if (decoded.otpExpiresAt && Date.now() > decoded.otpExpiresAt) {
    return res.status(400).json({ error: 'OTP code has expired. Please click Resend OTP.' });
  }

  // Issue a verified registration token to be passed to Checkout and PayU
  const { exp, iat, ...cleanPayload } = decoded;
  const registrationToken = jwt.sign(
    {
      ...cleanPayload,
      isEmailVerified: true,
      type: 'VERIFIED_REGISTRATION',
    },
    config.jwt.secret,
    { expiresIn: '2h' }
  );

  res.status(200).json({
    message: 'Email verified successfully! Please select your plan and complete payment to activate account.',
    registrationToken,
    user: {
      fullName: decoded.fullName,
      email: decoded.email,
      phone: decoded.phone,
      role: decoded.role,
      bloodGroup: decoded.bloodGroup,
      address: decoded.address,
      city: decoded.city,
      state: decoded.state,
      pincode: decoded.pincode,
      emergencyContactName: decoded.emergencyContactName,
      emergencyContactPhone: decoded.emergencyContactPhone,
      subscriptionStatus: 'INACTIVE',
    },
  });
});

/**
 * Resend Email Verification OTP
 */
export const resendOtp = asyncHandler(async (req, res) => {
  const { email, pendingToken } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const newOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtp: newOtp,
        emailOtpExpiresAt: newOtpExpires,
      },
    });

    try {
      await sendEmailVerificationOtp({ recipientEmail: email, userName: user.fullName, otp: newOtp });
    } catch (emailErr) {
      console.warn('[Resend OTP Email Notice] Failed to send email:', emailErr.message);
    }

    return res.status(200).json({
      message: `A new 6-digit OTP code has been sent to ${email}. (OTP Code: ${newOtp})`,
      debugOtp: newOtp,
    });
  }

  // Pending Token flow for new user before DB insertion
  let updatedPendingToken = null;
  if (pendingToken) {
    try {
      const decoded = jwt.verify(pendingToken, config.jwt.secret);
      updatedPendingToken = jwt.sign(
        {
          ...decoded,
          otp: newOtp,
          otpExpiresAt: newOtpExpires.getTime(),
        },
        config.jwt.secret,
        { expiresIn: '2h' }
      );
    } catch (e) {}
  }

  try {
    await sendEmailVerificationOtp({ recipientEmail: email, userName: 'Sakhi Member', otp: newOtp });
  } catch (emailErr) {
    console.warn('[Resend OTP Email Notice] Failed to send email:', emailErr.message);
  }

  return res.status(200).json({
    message: `A new 6-digit OTP code has been sent to ${email}. (OTP Code: ${newOtp})`,
    pendingToken: updatedPendingToken || pendingToken,
    debugOtp: newOtp,
  });
});

/**
 * Login User / SuperAdmin
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password, isAdminLogin } = req.body;

  const inputStr = email?.trim() || '';
  const cleanPhone = inputStr.replace(/\D/g, '');

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: inputStr.toLowerCase() },
        cleanPhone.length >= 10 ? { phone: { contains: cleanPhone } } : undefined,
      ].filter(Boolean),
    },
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid email/phone or password' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // SuperAdmin Dedicated URL Access Control Enforcement
  if (isAdminLogin) {
    if (user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. SuperAdmin privileges required.' });
    }
  } else {
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'SuperAdmin access is restricted. Please use the dedicated admin login URL.' });
    }
  }

  if (!user.isEmailVerified && user.role === 'USER') {
    // Auto-send fresh OTP on login attempt for unverified account
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailOtp: newOtp, emailOtpExpiresAt: otpExpires },
    });

    console.log(`🔑 [OTP RESENT on Login] Email: ${user.email} | OTP: ${newOtp}`);

    try {
      await sendEmailVerificationOtp({ recipientEmail: user.email, userName: user.fullName, otp: newOtp });
    } catch (e) {
      console.warn('[Login OTP Email Notice]', e.message);
    }

    return res.status(403).json({
      error: 'Your email is not verified. A new OTP has been sent to your email.',
      requiresVerification: true,
      email: user.email,
    });
  }


  const token = jwt.sign(
    { id: user.id, userId: user.id, role: user.role, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  res.status(200).json({
    message: 'Logged in successfully',
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      profilePhoto: user.profilePhoto,
      bloodGroup: user.bloodGroup,
    },
  });
});

/**
 * Get Profile of Logged-in User
 */
export const getProfile = asyncHandler(async (req, res) => {
  const targetId = req.user?.id || req.user?.userId;
  if (!targetId) {
    return res.status(401).json({ error: 'Invalid user token payload' });
  }

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      subscriptionStatus: true,
      profilePhoto: true,
      bloodGroup: true,
      address: true,
      city: true,
      state: true,
      country: true,
      pincode: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      parentEmail: true,
      medicalNotes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  res.status(200).json({ user });
});

/**
 * Update Profile Settings
 */
/**
 * Send OTP for New Email Change Verification
 */
export const sendEmailChangeOtp = asyncHandler(async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) {
    return res.status(400).json({ error: 'New email address is required' });
  }

  const cleanEmail = newEmail.toLowerCase().trim();
  const existingUser = await prisma.user.findFirst({
    where: {
      email: cleanEmail,
      id: { not: req.user.id },
    },
  });

  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email address already exists' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      emailOtp: otp,
      emailOtpExpiresAt: otpExpires,
    },
  });

  try {
    await sendEmailVerificationOtp({
      recipientEmail: cleanEmail,
      userName: req.user.fullName || 'Sakhi Member',
      otp,
    });
  } catch (emailErr) {
    console.warn('[Email Change OTP Notice]:', emailErr.message);
  }

  res.status(200).json({
    message: `Verification 6-digit OTP code sent to ${cleanEmail}`,
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      profilePhoto,
      bloodGroup,
      address,
      city,
      state,
      country,
      pincode,
      emergencyContactName,
      emergencyContactPhone,
      parentEmail,
      medicalNotes,
      newPassword,
    } = req.body;

    const targetUserId = parseInt(req.user?.id || req.user?.userId, 10);
    if (!targetUserId || isNaN(targetUserId)) {
      return res.status(401).json({ error: 'Invalid user session token' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!currentUser) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const updateData = {};

    if (typeof fullName === 'string' && fullName.trim()) {
      updateData.fullName = fullName.trim();
    }

    if (typeof email === 'string' && email.trim() && email.toLowerCase().trim() !== currentUser.email.toLowerCase().trim()) {
      const cleanEmail = email.toLowerCase().trim();
      const existingUser = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          id: { not: targetUserId },
        },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email address already exists. Duplicate email is not allowed.' });
      }
      updateData.email = cleanEmail;
    }

    if (typeof phone === 'string' && phone.trim()) {
      updateData.phone = phone.trim();
    }

    if (newPassword && typeof newPassword === 'string' && newPassword.length >= 6) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (profilePhoto !== undefined) {
      updateData.profilePhoto = profilePhoto;
    }
    if (bloodGroup !== undefined) {
      updateData.bloodGroup = typeof bloodGroup === 'string' ? bloodGroup.trim() : bloodGroup;
    }
    if (address !== undefined) {
      updateData.address = typeof address === 'string' ? address.trim() : address;
    }
    if (city !== undefined) {
      updateData.city = typeof city === 'string' ? city.trim() : city;
    }
    if (state !== undefined) {
      updateData.state = typeof state === 'string' ? state.trim() : state;
    }
    if (country !== undefined) {
      updateData.country = typeof country === 'string' ? country.trim() : country;
    }
    if (pincode !== undefined) {
      updateData.pincode = typeof pincode === 'string' ? pincode.trim() : pincode;
    }
    if (emergencyContactName !== undefined) {
      updateData.emergencyContactName = typeof emergencyContactName === 'string' ? emergencyContactName.trim() : emergencyContactName;
    }
    if (emergencyContactPhone !== undefined) {
      updateData.emergencyContactPhone = typeof emergencyContactPhone === 'string' ? emergencyContactPhone.trim() : emergencyContactPhone;
    }
    if (parentEmail !== undefined) {
      updateData.parentEmail = typeof parentEmail === 'string' && parentEmail.trim() ? parentEmail.trim().toLowerCase() : null;
    }
    if (medicalNotes !== undefined) {
      updateData.medicalNotes = typeof medicalNotes === 'string' ? medicalNotes.trim() : medicalNotes;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        subscriptionStatus: true,
        profilePhoto: true,
        bloodGroup: true,
        address: true,
        city: true,
        state: true,
        country: true,
        pincode: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        parentEmail: true,
        medicalNotes: true,
      },
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Error in updateSettings:', err);
    return res.status(500).json({ error: err.message || 'Failed to update profile settings' });
  }
});

/**
 * Verify New Email Change via OTP
 */
export const verifyNewEmail = asyncHandler(async (req, res) => {
  const { pendingEmail, otpCode } = req.body;

  if (!pendingEmail || !otpCode) {
    return res.status(400).json({ error: 'New email and 6-digit OTP code are required' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.emailOtp !== otpCode.trim()) {
    return res.status(400).json({ error: 'Invalid OTP code. Please check your email and try again.' });
  }

  if (user.emailOtpExpiresAt && new Date() > new Date(user.emailOtpExpiresAt)) {
    return res.status(400).json({ error: 'OTP code has expired. Please request a new email update.' });
  }

  const cleanEmail = pendingEmail.toLowerCase().trim();
  const existingUser = await prisma.user.findFirst({
    where: {
      email: cleanEmail,
      id: { not: req.user.id },
    },
  });

  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email address already exists. Duplicate email is not allowed.' });
  }

  // Update user's email to verified pending email
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      email: cleanEmail,
      isEmailVerified: true,
      emailOtp: null,
      emailOtpExpiresAt: null,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      subscriptionStatus: true,
      profilePhoto: true,
      bloodGroup: true,
      address: true,
      city: true,
      state: true,
      country: true,
      pincode: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      medicalNotes: true,
    },
  });

  res.status(200).json({
    message: 'New email address verified and updated successfully!',
    user: updatedUser,
  });
});

/**
 * Logout User
 */
export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

/**
 * Request Password Reset Email Link
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

  if (!user) {
    return res.status(200).json({
      message: `If an account exists with ${cleanEmail}, a password reset link has been sent to your inbox.`,
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpiresAt: resetExpires,
    },
  });

  const clientUrl = config.clientUrl || 'http://localhost:3000';
  const resetLink = `${clientUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;

  try {
    await sendPasswordResetEmail({
      recipientEmail: cleanEmail,
      userName: user.fullName || 'Sakhi Member',
      resetLink,
    });
  } catch (emailErr) {
    console.warn('[Reset Email Notice]:', emailErr.message);
  }

  return res.status(200).json({
    message: `Password reset link sent to ${cleanEmail}. Check your inbox!`,
  });
});

/**
 * Reset Password with Token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'Email, reset token, and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

  if (!user || user.resetPasswordToken !== token) {
    return res.status(400).json({ error: 'Invalid or expired password reset link.' });
  }

  if (user.resetPasswordExpiresAt && new Date() > new Date(user.resetPasswordExpiresAt)) {
    return res.status(400).json({ error: 'Password reset link has expired. Please request a new link.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
    },
  });

  return res.status(200).json({
    message: '🎉 Password updated successfully! You can now sign in with your new password.',
  });
});

