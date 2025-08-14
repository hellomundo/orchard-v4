import { randomUUID } from 'node:crypto';
import { db } from '@/db/client';
import {
  schoolYears,
  taskCategories,
  users,
  families,
  familyYearStatus,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {

  const now = Date.now();

  // Create admin user placeholder if not present
  const adminId = process.env.SEED_ADMIN_ID ?? 'admin_1';
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  await db
    .insert(users)
    .values({ id: adminId, email: adminEmail, role: 'admin', createdAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: users.id, set: { email: adminEmail, updatedAt: now } });

  // Create a sample family (or get existing one)
  let familyId: string;
  const existingFamily = await db.select().from(families).where(eq(families.name, 'Sample Family')).limit(1);
  
  if (existingFamily.length > 0) {
    familyId = existingFamily[0].id;
    console.log('Using existing Sample Family');
  } else {
    familyId = randomUUID();
    await db.insert(families).values({ id: familyId, name: 'Sample Family', createdAt: now, updatedAt: now });
    console.log('Created new Sample Family');
  }

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
    const existing = await db.select().from(taskCategories).where(eq(taskCategories.name, name)).limit(1);
    if (existing.length === 0) {
      await db
        .insert(taskCategories)
        .values({ id: randomUUID(), name, isActive: true, createdAt: now });
      console.log(`Created category: ${name}`);
    } else {
      console.log(`Category already exists: ${name}`);
    }
  }

  // Family year status
  const existingFamilyYear = await db
    .select()
    .from(familyYearStatus)
    .where(eq(familyYearStatus.familyId, familyId))
    .limit(1);
    
  if (existingFamilyYear.length === 0) {
    await db
      .insert(familyYearStatus)
      .values({ id: randomUUID(), familyId, schoolYearId: syId, isActive: true, totalHours: 0, createdAt: now });
    console.log('Created family year status');
  } else {
    console.log('Family year status already exists');
  }

  console.log('Seed complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


