import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import * as contactController from '../controllers/contactController.js';
import * as sosController from '../controllers/sosController.js';
import * as journeyController from '../controllers/journeyController.js';
import * as checkinController from '../controllers/checkinController.js';
import * as adminController from '../controllers/adminController.js';
import * as organizationController from '../controllers/organizationController.js';
import * as parentController from '../controllers/parentController.js';
import * as paymentController from '../controllers/paymentController.js';
import * as pushController from '../controllers/pushController.js';
import * as settingController from '../controllers/settingController.js';
import * as referralController from '../controllers/referralController.js';
import * as couponController from '../controllers/couponController.js';
import { authenticateToken, optionalAuthToken, requireSuperAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, verifyEmailSchema } from '../utils/schemas.js';
import { imagekit } from '../services/imagekit.js';
import fs from 'fs';

const router = Router();

// Auth & User
router.post('/auth/register', validate(registerSchema), authController.register);
router.post('/auth/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/auth/resend-otp', authController.resendOtp);
router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authenticateToken, authController.getProfile);
router.put('/auth/settings', authenticateToken, authController.updateSettings);
router.post('/auth/send-email-change-otp', authenticateToken, authController.sendEmailChangeOtp);
router.post('/auth/verify-new-email', authenticateToken, authController.verifyNewEmail);

router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// Public Contact Form Submission
router.post('/contact', adminController.submitContactEnquiry);

// Public Plans & Pricing
router.get('/plans', adminController.getPlans);

// PayU Payment Routes
router.post('/payment/payu-initiate', optionalAuthToken, paymentController.initiatePayUPayment);
router.post('/payment/payu-success', paymentController.handlePayUSuccess);
router.get('/payment/payu-success', paymentController.handlePayUSuccess);
router.post('/payment/payu-failure', paymentController.handlePayUFailure);
router.get('/payment/payu-failure', paymentController.handlePayUFailure);
router.get('/payment/history', authenticateToken, paymentController.getUserPaymentHistory);

// Contacts
router.get('/contacts', authenticateToken, contactController.getContacts);
router.post('/contacts', authenticateToken, contactController.addContact);
router.put('/contacts/:id', authenticateToken, contactController.updateContact);
router.delete('/contacts/:id', authenticateToken, contactController.deleteContact);

// SOS
router.post('/sos/start', authenticateToken, sosController.startSos);
router.post('/sos/location', authenticateToken, sosController.updateSosLocation);
router.post('/sos/resolve', authenticateToken, sosController.resolveSos);
router.get('/sos/active', authenticateToken, sosController.getActiveSosSession);
router.get('/sos/public-track/:token', sosController.getPublicSosTracking);

// Journey
router.post('/journey/start', authenticateToken, journeyController.startJourney);
router.post('/journey/complete', authenticateToken, journeyController.completeJourney);
router.get('/journey/active', authenticateToken, journeyController.getActiveJourney);

// Check-in
router.post('/checkin/start', authenticateToken, checkinController.startCheckin);
router.post('/checkin/safe', authenticateToken, checkinController.confirmCheckinSafe);
router.get('/checkin/active', authenticateToken, checkinController.getActiveCheckin);

// Super Admin Operations Command Portal
router.get('/admin/overview', authenticateToken, requireSuperAdmin, adminController.getAdminOverview);
router.get('/admin/users', authenticateToken, requireSuperAdmin, adminController.getAllUsers);
router.get('/admin/users/:id', authenticateToken, requireSuperAdmin, adminController.getUserByIdAdmin);
router.post('/admin/users', authenticateToken, requireSuperAdmin, adminController.createUserByAdmin);
router.post('/admin/users/create', authenticateToken, requireSuperAdmin, adminController.createUserByAdmin);
router.put('/admin/profile', authenticateToken, requireSuperAdmin, adminController.updateSuperAdminProfile);
router.put('/admin/user/role', authenticateToken, requireSuperAdmin, adminController.updateUserRole);
router.put('/admin/users/:id', authenticateToken, requireSuperAdmin, adminController.updateUserDetailsAdmin);
router.post('/admin/users/:id/block', authenticateToken, requireSuperAdmin, adminController.toggleUserBlock);
router.post('/admin/users/:id/grant-subscription', authenticateToken, requireSuperAdmin, adminController.grantUserFreeSubscription);
router.post('/admin/users/:userId/contacts', authenticateToken, requireSuperAdmin, adminController.addContactAdmin);
router.put('/admin/contacts/:contactId', authenticateToken, requireSuperAdmin, adminController.updateContactAdmin);
router.delete('/admin/contacts/:contactId', authenticateToken, requireSuperAdmin, adminController.deleteContactAdmin);
router.post('/admin/sos/resolve', authenticateToken, requireSuperAdmin, adminController.adminResolveSos);
router.get('/admin/plans', authenticateToken, requireSuperAdmin, adminController.getPlans);
router.post('/admin/plans', authenticateToken, requireSuperAdmin, adminController.createOrUpdatePlan);
router.post('/admin/plans/:id/toggle', authenticateToken, requireSuperAdmin, adminController.togglePlanActive);
router.get('/admin/gst', authenticateToken, requireSuperAdmin, adminController.getGstSettings);
router.put('/admin/gst', authenticateToken, requireSuperAdmin, adminController.updateGstSettings);
router.get('/admin/payments', authenticateToken, requireSuperAdmin, adminController.getPaymentHistory);
router.get('/admin/enquiries', authenticateToken, requireSuperAdmin, adminController.getContactEnquiries);
router.post('/admin/enquiries/:id/resolve', authenticateToken, requireSuperAdmin, adminController.resolveContactEnquiry);

// Organization Portal Routes
router.get('/organization/overview', authenticateToken, organizationController.getOrganizationOverview);
router.post('/organization/members', authenticateToken, organizationController.addMember);
router.delete('/organization/members/:membershipId', authenticateToken, organizationController.removeMember);

// Parent Portal Routes
router.get('/parent/overview', authenticateToken, parentController.getParentOverview);
router.post('/parent/link-child', authenticateToken, parentController.linkChild);
router.delete('/parent/children/:linkId', authenticateToken, parentController.unlinkChild);

// Web Push Notifications
router.get('/push/vapid-key', pushController.getVapidPublicKey);
router.post('/push/subscribe', authenticateToken, pushController.savePushSubscription);
router.post('/push/subscribe-email', pushController.savePushSubscriptionByEmail);

// System Settings
router.get('/settings', settingController.getSettings);
router.put('/settings', authenticateToken, requireSuperAdmin, settingController.updateSettings);

// Media Upload
router.post('/upload', authenticateToken, requireSuperAdmin, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Read the file buffer for ImageKit
    const fileBuffer = fs.readFileSync(req.file.path);
    
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: req.file.filename,
      useUniqueFileName: false,
    });
    
    // Optionally delete the local file after upload
    fs.unlinkSync(req.file.path);

    res.status(200).json({ 
      success: true, 
      url: response.url,
      mediaType: req.file.mimetype.startsWith('video/') ? 'video' : 'image' 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'File upload failed' });
  }
});

// Referral Partners
router.post('/partners', authenticateToken, requireSuperAdmin, referralController.createPartner);
router.get('/partners', authenticateToken, requireSuperAdmin, referralController.getAllPartners);
router.get('/partners/:id', authenticateToken, requireSuperAdmin, referralController.getPartnerById);
router.put('/partners/:id', authenticateToken, requireSuperAdmin, referralController.updatePartner);
router.delete('/partners/:id', authenticateToken, requireSuperAdmin, referralController.deletePartner);
router.post('/partners/stats', referralController.getPartnerStats); // Public/dashboard stats

// Coupons
router.post('/coupons', authenticateToken, requireSuperAdmin, couponController.createCoupon);
router.get('/coupons', authenticateToken, requireSuperAdmin, couponController.getAllCoupons);
router.put('/coupons/:id', authenticateToken, requireSuperAdmin, couponController.updateCoupon);
router.delete('/coupons/:id', authenticateToken, requireSuperAdmin, couponController.deleteCoupon);
router.get('/coupons/assignable-users', authenticateToken, requireSuperAdmin, couponController.getAssignableUsers);
router.get('/coupons/my-coupons', authenticateToken, couponController.getMyCoupons);
router.post('/coupons/validate', authenticateToken, couponController.validateCoupon);

export default router;
