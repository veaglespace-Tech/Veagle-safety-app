import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';

/**
 * Ensures a Parent user account exists for the given parent phone/name/email,
 * and creates an active ParentChildLink to the child user.
 *
 * @param {Object} params
 * @param {number} params.childId - The user ID of the child/member
 * @param {string} params.parentPhone - The phone number of the parent/guardian
 * @param {string} [params.parentName] - Name of the parent/guardian
 * @param {string} [params.parentEmail] - Optional email of the parent
 * @param {string} [params.relationship] - Relationship e.g. 'Parent', 'Mother', 'Father', 'Guardian'
 * @returns {Promise<Object|null>} The parent User record or null
 */
export async function syncParentProfileAndLink({
  childId,
  parentPhone,
  parentName,
  parentEmail,
  relationship = 'Parent',
}) {
  if (!parentPhone || !childId) return null;

  const cleanPhone = String(parentPhone).replace(/\D/g, '');
  if (cleanPhone.length < 10) return null;
  const phone10 = cleanPhone.slice(-10);

  const cleanName = (parentName && parentName.trim()) ? parentName.trim() : 'Parent Guardian';
  const cleanEmail = (parentEmail && parentEmail.trim()) ? parentEmail.trim().toLowerCase() : null;

  try {
    // 1. Check if parent User already exists by phone (or email)
    let parentUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: phone10 },
          cleanEmail ? { email: cleanEmail } : undefined,
        ].filter(Boolean),
      },
    });

    if (!parentUser) {
      // Generate a secure placeholder password hash for phone-only login
      const dummyPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(dummyPassword, 10);
      const fallbackEmail = cleanEmail || `parent.${phone10}@veagle.internal`;

      parentUser = await prisma.user.create({
        data: {
          fullName: cleanName,
          email: fallbackEmail,
          phone: phone10,
          passwordHash,
          role: 'PARENT',
          isEmailVerified: true,
          subscriptionStatus: 'ACTIVE',
          profilePhoto: 'https://ik.imagekit.io/m5ei0wbuw/avatar-woman-1.png',
        },
      });
    } else {
      // If user exists and is not super_admin or org, make sure role/profile keeps parent access
      const updateData = {};
      if (parentUser.role === 'USER') {
        // Can access parent portal as well
      }
      if (cleanName && (!parentUser.fullName || parentUser.fullName === 'Parent Guardian')) {
        updateData.fullName = cleanName;
      }
      if (Object.keys(updateData).length > 0) {
        parentUser = await prisma.user.update({
          where: { id: parentUser.id },
          data: updateData,
        });
      }
    }

    // 2. Link Parent and Child (ensure no self-link)
    if (parentUser.id !== childId) {
      await prisma.parentChildLink.upsert({
        where: {
          parentId_childId: {
            parentId: parentUser.id,
            childId,
          },
        },
        update: {
          relationship: relationship || 'Parent',
          status: 'ACTIVE',
        },
        create: {
          parentId: parentUser.id,
          childId,
          relationship: relationship || 'Parent',
          status: 'ACTIVE',
        },
      });
    }

    return parentUser;
  } catch (error) {
    console.error('[syncParentProfileAndLink] Error:', error.message);
    return null;
  }
}

