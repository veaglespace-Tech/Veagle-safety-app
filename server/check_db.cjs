const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('Coupons:', await prisma.coupon.findMany({take: 1, orderBy: {id: 'desc'}}));
  console.log('Plans:', await prisma.plan.findMany({take: 1, orderBy: {id: 'desc'}}));
  console.log('Referrals:', await prisma.referralPartner.findMany({take: 1, orderBy: {id: 'desc'}}));
}
main().finally(() => prisma.$disconnect());
