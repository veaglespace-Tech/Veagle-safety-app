import { seedDatabase } from '../prisma/seed.js';

export async function seedSuperAdminData() {
  try {
    await seedDatabase();
  } catch (err) {
    console.error('[Seed Error]:', err.message);
  }
}
