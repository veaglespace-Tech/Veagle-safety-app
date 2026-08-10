import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'org@veagle.com' } });
  console.log('ROLE IS:', user.role);
}
main().catch(console.error).finally(() => prisma.$disconnect());
