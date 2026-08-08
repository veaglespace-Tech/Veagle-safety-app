import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting database cleanup (preserving SUPER_ADMIN users and Plans)...');

  // 1. Delete relations & dependent tables
  const parentLinks = await prisma.parentChildLink.deleteMany({});
  console.log(`- Deleted ${parentLinks.count} ParentChildLink records`);

  const orgMembers = await prisma.organizationMember.deleteMany({});
  console.log(`- Deleted ${orgMembers.count} OrganizationMember records`);

  const sosLocations = await prisma.sosLocation.deleteMany({});
  console.log(`- Deleted ${sosLocations.count} SosLocation records`);

  const sosAlerts = await prisma.sosAlert.deleteMany({});
  console.log(`- Deleted ${sosAlerts.count} SosAlert records`);

  const sosSessions = await prisma.sosSession.deleteMany({});
  console.log(`- Deleted ${sosSessions.count} SosSession records`);

  const journeyLocations = await prisma.journeyLocation.deleteMany({});
  console.log(`- Deleted ${journeyLocations.count} JourneyLocation records`);

  const journeys = await prisma.journey.deleteMany({});
  console.log(`- Deleted ${journeys.count} Journey records`);

  const liveShares = await prisma.liveShareSession.deleteMany({});
  console.log(`- Deleted ${liveShares.count} LiveShareSession records`);

  const safetyCheckins = await prisma.safetyCheckin.deleteMany({});
  console.log(`- Deleted ${safetyCheckins.count} SafetyCheckin records`);

  const trustedContacts = await prisma.trustedContact.deleteMany({});
  console.log(`- Deleted ${trustedContacts.count} TrustedContact records`);

  const paymentHistories = await prisma.paymentHistory.deleteMany({});
  console.log(`- Deleted ${paymentHistories.count} PaymentHistory records`);

  const auditLogs = await prisma.auditLog.deleteMany({});
  console.log(`- Deleted ${auditLogs.count} AuditLog records`);

  const pushSubs = await prisma.pushSubscription.deleteMany({});
  console.log(`- Deleted ${pushSubs.count} PushSubscription records`);

  const enquiries = await prisma.contactEnquiry.deleteMany({});
  console.log(`- Deleted ${enquiries.count} ContactEnquiry records`);

  // 2. Delete all non-SUPER_ADMIN users
  const nonAdminUsers = await prisma.user.deleteMany({
    where: {
      role: {
        not: 'SUPER_ADMIN',
      },
    },
  });
  console.log(`- Deleted ${nonAdminUsers.count} non-SUPER_ADMIN User records`);

  // 3. Count preserved records
  const superAdminsCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
  const plansCount = await prisma.plan.count({});

  console.log('✅ Database cleanup completed successfully!');
  console.log(`   - Preserved ${superAdminsCount} SUPER_ADMIN Users`);
  console.log(`   - Preserved ${plansCount} Subscription Plans`);
}

main()
  .catch((e) => {
    console.error('❌ Error during DB cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
