import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full Name must be at least 2 characters").trim(),
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  phone: z.string().transform(val => val.replace(/\D/g, '')).pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(['USER', 'SUPER_ADMIN', 'ORGANIZATION', 'PARENT']).optional().default('USER'),
  emergencyContactName: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  emergencyContactPhone: z.string().transform(val => val ? val.replace(/\D/g, '') : '').pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number for Emergency Contact").optional().or(z.literal(''))),
  parentEmail: z.string().email("Please enter a valid Parent Email address").optional().or(z.literal('')),
  profilePhoto: z.string().url().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit Pincode").optional().or(z.literal('')),
  medicalNotes: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().min(1, "Email or Phone is required").trim(),
  password: z.string().min(1, "Password is required"),
  isAdminLogin: z.boolean().optional(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});
