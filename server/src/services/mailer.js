import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const transporter = nodemailer.createTransport({
  host: config.emailService.host || 'smtp.gmail.com',
  port: config.emailService.port || 587,
  secure: false, // TLS
  auth: config.emailService.user ? {
    user: config.emailService.user,
    pass: config.emailService.pass,
  } : undefined,
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Send Email Verification OTP
 */
export const sendEmailVerificationOtp = async (arg1, arg2, arg3) => {
  let recipientEmail, userName, otp;

  if (typeof arg1 === 'object' && arg1 !== null) {
    recipientEmail = arg1.recipientEmail || arg1.email;
    userName = arg1.userName || arg1.name;
    otp = arg1.otp;
  } else {
    recipientEmail = arg1;
    userName = arg2;
    otp = arg3;
  }

  console.log(`🔑 [OTP GENERATED] Email: ${recipientEmail} | OTP Code: ${otp}`);

  try {
    await transporter.sendMail({
      from: `"Sakhi Suraksha SOS" <${config.emailService.user || 'no-reply@sakhisuraksha.org'}>`,
      to: recipientEmail,
      subject: `🔐 Email Verification OTP: ${otp} - Sakhi Suraksha SOS`,
      html: `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #FF5C8A; border-radius: 16px; padding: 32px; background-color: #FFF0F3;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #2A0826; font-size: 26px; font-weight: 900; margin: 0;">Sakhi Suraksha SOS</h1>
            <p style="color: #FF5C8A; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">24/7 Women &amp; Personal Safety Platform</p>
          </div>
          <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #FFCCE1;">
            <p style="font-size: 16px; color: #2A0826; margin-top: 0;">Hi <strong>${userName || 'Sakhi Member'}</strong>,</p>
            <p style="font-size: 14px; color: #555555; line-height: 1.6;">
              Thank you for registering on Sakhi Suraksha SOS. Please use the following 6-digit OTP code to verify your email address:
            </p>
            <div style="background: linear-gradient(135deg, #FF5C8A, #FF2A6D); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ffffff;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #888888; margin-bottom: 0;">
              ⏰ This OTP is valid for 10 minutes. If you did not request this, please ignore this email.
            </p>
          </div>
        </div>
      `,
    });
    console.log(`[Email Service] Verification OTP sent successfully to ${recipientEmail}`);
    return true;
  } catch (err) {
    console.error(`[Email Service Error] Failed to send OTP to ${recipientEmail}:`, err.message);
    return false;
  }
};

/**
 * Helper: Resolve profile photo into CID inline attachment (for base64) or direct URL (for http photos).
 * Gmail blocks base64 data: URIs in <img> tags — must use CID inline attachments.
 */
const resolveAvatarImage = (userPhoto, userName) => {
  if (userPhoto && typeof userPhoto === 'string' && userPhoto.trim()) {
    const trimmed = userPhoto.trim();

    // Base64 Data URI (e.g. data:image/jpeg;base64,...)
    if (trimmed.startsWith('data:image/')) {
      const matches = trimmed.match(/^data:(image\/[a-zA-Z0-9+\-.]+);base64,(.+)$/s);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2].replace(/[\r\n\s]/g, '');
        const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg';
        return {
          src: 'cid:userprofilephoto',
          attachments: [
            {
              filename: `profile.${ext}`,
              content: Buffer.from(base64Data, 'base64'),
              contentType: mimeType,
              contentDisposition: 'inline',
              cid: 'userprofilephoto',
            },
          ],
        };
      }
    }

    // Public HTTP/HTTPS URL
    if (
      (trimmed.startsWith('https://') || trimmed.startsWith('http://')) &&
      !trimmed.includes('localhost') &&
      !trimmed.includes('127.0.0.1')
    ) {
      return { src: trimmed, attachments: [] };
    }
  }

  // Fallback: ui-avatars PNG
  const cleanName = encodeURIComponent(userName || 'Sakhi Member');
  return {
    src: `https://ui-avatars.com/api/?name=${cleanName}&background=FF2A6D&color=ffffff&size=128&bold=true&format=png`,
    attachments: [],
  };
};

/**
 * 🚨 Send High-Priority Emergency SOS Broadcast Email
 */
export const sendSosEmergencyAlert = async ({
  recipientEmail,
  recipientName,
  userName,
  userPhone,
  userEmail,
  userPhoto,
  trackingUrl,
  googleMapsUrl,
  latitude,
  longitude,
  sosId,
}) => {
  try {
    const mapUrl = googleMapsUrl || `https://www.google.com/maps?q=${latitude},${longitude}`;
    const avatar = resolveAvatarImage(userPhoto, userName);

    const info = await transporter.sendMail({
      from: `"🚨 Sakhi Suraksha Emergency Command" <${config.emailService.user || 'sos@sakhisuraksha.org'}>`,
      to: recipientEmail,
      subject: `🚨 CRITICAL EMERGENCY SOS ALERT: ${userName} Needs Help Immediately!`,
      attachments: avatar.attachments,
      html: `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 3px solid #FF2A6D; border-radius: 18px; padding: 24px; background-color: #FFF0F3;">
          <div style="text-align: center; margin-bottom: 18px;">
            <div style="display: inline-block; background-color: #FF2A6D; color: #ffffff; padding: 5px 14px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">
              CRITICAL EMERGENCY GUARDIAN BROADCAST
            </div>
            <h1 style="color: #FF2A6D; font-size: 24px; font-weight: 900; margin: 10px 0 2px 0;">🚨 EMERGENCY SOS ACTIVATED</h1>
            <p style="color: #684E67; font-size: 12px; font-weight: 700; margin: 0;">Sakhi Safety Incident #${sosId || 'LIVE'}</p>
          </div>

          <div style="background-color: #ffffff; border-radius: 14px; padding: 18px; border: 1.5px solid #FFCCE1; margin-bottom: 18px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 70px; vertical-align: middle; padding-right: 14px;">
                  <img src="${avatar.src}" alt="${userName}" width="56" height="56" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 3px solid #FF2A6D; display: block;" />
                </td>
                <td style="vertical-align: middle;">
                  <h3 style="margin: 0 0 3px 0; color: #2A0826; font-size: 17px; font-weight: 900;">${userName}</h3>
                  <p style="margin: 0; color: #FF2A6D; font-weight: 800; font-size: 13px;">📞 Phone: ${userPhone || 'N/A'}</p>
                  <p style="margin: 3px 0 0 0; color: #684E67; font-weight: 600; font-size: 12px;">✉️ Email: ${userEmail || recipientEmail}</p>
                </td>
              </tr>
            </table>
          </div>

          <div style="background: linear-gradient(135deg, #FF2A6D, #E01A4F); border-radius: 14px; padding: 20px; text-align: center; color: #ffffff; margin-bottom: 18px;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 900; text-transform: uppercase;">📍 LIVE GPS LOCATION COORDINATES</p>
            <p style="font-size: 16px; font-weight: 900; font-family: monospace; background: rgba(0,0,0,0.25); display: inline-block; padding: 6px 14px; border-radius: 6px; margin: 4px 0 14px 0;">
              Lat: ${latitude} | Lng: ${longitude}
            </p>
            <div>
              <a href="${trackingUrl}" target="_blank" style="background-color: #ffffff; color: #FF2A6D; padding: 12px 24px; text-decoration: none; border-radius: 999px; font-weight: 900; font-size: 12px; display: inline-block; text-transform: uppercase;">
                👉 OPEN INTERACTIVE LIVE MAP TRACKER
              </a>
            </div>
          </div>

          <div style="background-color: #ffffff; border-radius: 12px; padding: 14px; border: 1px solid #FFCCE1; text-align: center;">
            <a href="${mapUrl}" target="_blank" style="color: #FF2A6D; font-weight: 900; font-size: 12px; text-decoration: underline;">
              🌐 Open Coordinates on Google Maps (${latitude}, ${longitude})
            </a>
          </div>

          <p style="font-size: 10px; color: #888888; text-align: center; margin: 14px 0 0 0;">
            High-priority safety broadcast generated by Sakhi Suraksha SOS Command Center.
          </p>
        </div>
      `,
    });

    console.log(`[Email Service] Emergency alert sent to ${recipientEmail} (ID: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`[Email Service Error] Emergency alert failed for ${recipientEmail}:`, err.message);
    return false;
  }
};

/**
 * ✅ Send "I AM SAFE NOW" Confirmation Email
 */
export const sendSosSafeAlert = async ({
  recipientEmail,
  userName,
  userPhone,
  userEmail,
  userPhoto,
  googleMapsUrl,
  latitude,
  longitude,
  resolvedAt,
}) => {
  try {
    const mapUrl = googleMapsUrl || `https://www.google.com/maps?q=${latitude},${longitude}`;
    const avatar = resolveAvatarImage(userPhoto, userName);

    const info = await transporter.sendMail({
      from: `"✅ Sakhi Suraksha Safety Status" <${config.emailService.user || 'sos@sakhisuraksha.org'}>`,
      to: recipientEmail,
      subject: `✅ SAFE NOW: ${userName} is Safe!`,
      attachments: avatar.attachments,
      html: `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 3px solid #10B981; border-radius: 18px; padding: 24px; background-color: #ECFDF5;">
          <div style="text-align: center; margin-bottom: 18px;">
            <div style="display: inline-block; background-color: #10B981; color: #ffffff; padding: 5px 14px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">
              EMERGENCY RESOLVED — MEMBER IS SAFE
            </div>
            <h1 style="color: #065F46; font-size: 26px; font-weight: 900; margin: 10px 0 2px 0;">✅ I AM SAFE NOW!</h1>
            <p style="color: #047857; font-size: 13px; font-weight: 700; margin: 0;">${userName} has confirmed they are safe</p>
          </div>

          <div style="background-color: #ffffff; border-radius: 14px; padding: 18px; border: 1.5px solid #A7F3D0; margin-bottom: 18px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 70px; vertical-align: middle; padding-right: 14px;">
                  <img src="${avatar.src}" alt="${userName}" width="56" height="56" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 3px solid #10B981; display: block;" />
                </td>
                <td style="vertical-align: middle;">
                  <h3 style="margin: 0 0 4px 0; color: #065F46; font-size: 16px; font-weight: 900;">${userName}</h3>
                  <p style="margin: 0; color: #047857; font-weight: 700; font-size: 13px;">📞 ${userPhone || 'N/A'}</p>
                  ${userEmail ? `<p style="margin: 3px 0 0 0; color: #6EE7B7; font-size: 12px;">✉️ ${userEmail}</p>` : ''}
                  <p style="margin: 6px 0 0 0; font-size: 12px; color: #047857;">
                    🕒 Resolved at: <strong>${new Date(resolvedAt || Date.now()).toLocaleString('en-IN')}</strong>
                  </p>
                </td>
              </tr>
            </table>
          </div>

          <div style="background: linear-gradient(135deg, #10B981, #059669); border-radius: 14px; padding: 18px; text-align: center; color: #ffffff; margin-bottom: 14px;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 900; text-transform: uppercase;">📍 FINAL RESOLVED LOCATION</p>
            <p style="font-size: 15px; font-weight: 900; font-family: monospace; background: rgba(0,0,0,0.2); display: inline-block; padding: 5px 12px; border-radius: 6px; margin: 4px 0 12px 0;">
              Lat: ${latitude} | Lng: ${longitude}
            </p>
            <div>
              <a href="${mapUrl}" target="_blank" style="background-color: #ffffff; color: #10B981; padding: 10px 22px; text-decoration: none; border-radius: 999px; font-weight: 900; font-size: 12px; display: inline-block; text-transform: uppercase;">
                🌐 VIEW ON GOOGLE MAPS
              </a>
            </div>
          </div>

          <p style="font-size: 10px; color: #047857; text-align: center; margin: 10px 0 0 0;">
            Sakhi Suraksha 24/7 Safety Command System — Emergency Resolved.
          </p>
        </div>
      `,
    });

    console.log(`[Email Service] Safe confirmation sent to ${recipientEmail} (ID: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`[Email Service Error] Safe email failed for ${recipientEmail}:`, err.message);
    return false;
  }
};

/**
 * 📍 Send 5-Minute Periodic GPS Location Alert Email
 */
export const sendSos5MinLocationUpdate = async ({
  recipientEmail,
  victimName,
  victimPhone,
  victimPhoto,
  trackingUrl,
  googleMapsUrl,
  latitude,
  longitude,
  sosId,
  startedAt,
}) => {
  try {
    const mapUrl = googleMapsUrl || `https://www.google.com/maps?q=${latitude},${longitude}`;
    const avatar = resolveAvatarImage(victimPhoto, victimName);

    const info = await transporter.sendMail({
      from: `"📍 Sakhi Suraksha Live GPS Update" <${config.emailService.user || 'sos@sakhisuraksha.org'}>`,
      to: recipientEmail,
      subject: `📍 [5-MIN GPS UPDATE] Live Location for ${victimName}`,
      attachments: avatar.attachments,
      html: `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 3px solid #3B82F6; border-radius: 18px; padding: 22px; background-color: #EFF6FF;">
          <div style="text-align: center; margin-bottom: 14px;">
            <div style="display: inline-block; background-color: #3B82F6; color: #ffffff; padding: 4px 12px; border-radius: 999px; font-size: 9px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">
              RECURRING 5-MINUTE LOCATION DISPATCH
            </div>
            <h2 style="color: #1E40AF; font-size: 20px; font-weight: 900; margin: 8px 0 2px 0;">📍 5-MIN LIVE GPS UPDATE</h2>
            <p style="color: #1D4ED8; font-size: 11px; font-weight: 700; margin: 0;">Emergency Incident #${sosId} is STILL ACTIVE</p>
          </div>

          <div style="background-color: #ffffff; border-radius: 12px; padding: 14px; border: 1px solid #BFDBFE; margin-bottom: 14px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 60px; vertical-align: middle; padding-right: 12px;">
                  <img src="${avatar.src}" alt="${victimName}" width="48" height="48" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #2563EB; display: block;" />
                </td>
                <td style="vertical-align: middle;">
                  <p style="margin: 0; font-size: 13px; color: #1E3A8A; font-weight: 800;">
                    Sakhi Member: <strong>${victimName}</strong> (${victimPhone || 'N/A'})
                  </p>
                  <p style="margin: 3px 0 0 0; font-size: 11px; color: #3B82F6;">
                    Emergency Triggered: <strong>${new Date(startedAt || Date.now()).toLocaleString('en-IN')}</strong>
                  </p>
                </td>
              </tr>
            </table>
          </div>

          <div style="background: linear-gradient(135deg, #2563EB, #1D4ED8); border-radius: 14px; padding: 18px; text-align: center; color: #ffffff; margin-bottom: 14px;">
            <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; text-transform: uppercase;">CURRENT LIVE GPS COORDINATES</p>
            <p style="font-size: 16px; font-weight: 900; font-family: monospace; background: rgba(0,0,0,0.25); display: inline-block; padding: 5px 12px; border-radius: 6px; margin: 4px 0 12px 0;">
              Lat: ${latitude} | Lng: ${longitude}
            </p>
            <div>
              <a href="${trackingUrl}" target="_blank" style="background-color: #ffffff; color: #2563EB; padding: 10px 20px; text-decoration: none; border-radius: 999px; font-weight: 900; font-size: 11px; display: inline-block; text-transform: uppercase;">
                VIEW LIVE INTERACTIVE MAP
              </a>
            </div>
          </div>

          <div style="text-align: center; background-color: #ffffff; border-radius: 10px; padding: 10px; border: 1px solid #BFDBFE;">
            <a href="${mapUrl}" target="_blank" style="color: #2563EB; font-weight: 900; font-size: 11px; text-decoration: underline;">
              🌐 Open on Google Maps (${latitude}, ${longitude})
            </a>
          </div>

          <p style="font-size: 10px; color: #1E40AF; text-align: center; margin: 10px 0 0 0;">
            Automatic 5-minute safety tracker. Updates continue until SOS is resolved.
          </p>
        </div>
      `,
    });

    console.log(`[Email Service] 5-min location update sent to ${recipientEmail} (ID: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`[Email Service Error] 5-min update failed for ${recipientEmail}:`, err.message);
    return false;
  }
};

/**
 * Send Welcome Email on User Registration
 */
export const sendWelcomeEmail = async ({ recipientEmail, userName, userPhoto }) => {
  try {
    const avatar = resolveAvatarImage(userPhoto, userName);

    await transporter.sendMail({
      from: `"Sakhi Suraksha SOS" <${config.emailService.user || 'no-reply@sakhisuraksha.org'}>`,
      to: recipientEmail,
      subject: `🌸 Welcome to Sakhi Suraksha SOS - 24/7 Personal Protection Active`,
      attachments: avatar.attachments,
      html: `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 2px solid #FF5C8A; border-radius: 16px; padding: 28px; background-color: #FFF0F3;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2A0826; font-size: 24px; font-weight: 900; margin: 0;">Sakhi Suraksha SOS</h1>
            <p style="color: #FF5C8A; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Welcome to Your Personal Safety Command</p>
          </div>
          <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #FFCCE1;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
              <tr>
                <td style="width: 56px; vertical-align: middle; padding-right: 12px;">
                  <img src="${avatar.src}" alt="${userName}" width="48" height="48" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #FF2A6D; display: block;" />
                </td>
                <td style="vertical-align: middle;">
                  <p style="font-size: 16px; color: #2A0826; margin: 0; font-weight: 800;">Dear ${userName || 'Sakhi Member'},</p>
                </td>
              </tr>
            </table>
            <p style="font-size: 13px; color: #555555; line-height: 1.6; margin: 0;">
              Welcome to <strong>Sakhi Suraksha SOS</strong>! Your account is now active with 24/7 encrypted GPS emergency broadcasts and guardian network protection.
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Send Password Reset Link Email
 */
export const sendPasswordResetEmail = async ({ recipientEmail, userName, resetLink }) => {
  try {
    await transporter.sendMail({
      from: `"Sakhi Suraksha SOS" <${config.emailService.user || 'no-reply@sakhisuraksha.org'}>`,
      to: recipientEmail,
      subject: `🔐 Reset Your Sakhi Suraksha Password`,
      html: `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 2px solid #FF5C8A; border-radius: 16px; padding: 28px; background-color: #FFF0F3;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2A0826; font-size: 24px; font-weight: 900; margin: 0;">Sakhi Suraksha SOS</h1>
          </div>
          <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #FFCCE1;">
            <p style="font-size: 15px; color: #2A0826;">Hi <strong>${userName || 'Sakhi Member'}</strong>,</p>
            <p style="font-size: 13px; color: #555555;">Click below to reset your password:</p>
            <div style="text-align: center; margin-top: 16px;">
              <a href="${resetLink}" style="background-color: #FF2A6D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 999px; font-weight: bold; display: inline-block;">RESET PASSWORD</a>
            </div>
          </div>
        </div>
      `,
    });
    return true;
  } catch (err) {
    return false;
  }
};
