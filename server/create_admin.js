import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const superAdmin = await prisma.user.create({
    data: {
      fullName: 'Veagle Organization HQ',
      email: 'org@veagle.com',
      phone: '+919876543210',
      passwordHash,
      role: 'SUPER_ADMIN',
      bloodGroup: 'O+',
      address: 'Veagle HQ',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      pincode: '411001',
      isEmailVerified: true,
      subscriptionStatus: 'ACTIVE',
    }
  });

  console.log('Created SUPER_ADMIN:', superAdmin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
