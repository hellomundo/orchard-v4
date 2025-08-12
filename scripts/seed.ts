import { randomUUID } from 'node:crypto';
import { db } from '@/db/client';
import {
  schoolYears,
  taskCategories,
  users,
  families,
  familyYearStatus,
} from '@/db/schema';

async function main() {

  const now = Date.now();

  // Create admin user placeholder if not present
  const adminId = process.env.SEED_ADMIN_ID ?? 'admin_1';
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  await db
    .insert(users)
    .values({ id: adminId, email: adminEmail, role: 'admin', createdAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: users.id, set: { email: adminEmail, updatedAt: now } });

  // Create a sample family
  const familyId = randomUUID();
  await db.insert(families).values({ id: familyId, name: 'Sample Family', createdAt: now, updatedAt: now }).onConflictDoNothing();

  // School year 2024-2025 active
  const syId = '2024-2025';
  await db
    .insert(schoolYears)
    .values({
      id: syId,
      name: '2024-2025',
      startDate: new Date('2024-08-15').getTime(),
      endDate: new Date('2025-06-15').getTime(),
      requiredHours: 50,
      hourlyRate: 20,
      isActive: true,
      createdAt: now,
    })
    .onConflictDoNothing();

  // Task categories
  const cats = ['Classroom Help', 'Event Setup', 'Fundraising'];
  for (const name of cats) {
    await db
      .insert(taskCategories)
      .values({ id: randomUUID(), name, isActive: true, createdAt: now })
      .onConflictDoNothing();
  }

  // Family year status
  await db
    .insert(familyYearStatus)
    .values({ id: randomUUID(), familyId, schoolYearId: syId, isActive: true, totalHours: 0, createdAt: now })
    .onConflictDoNothing();

  console.log('Seed complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


