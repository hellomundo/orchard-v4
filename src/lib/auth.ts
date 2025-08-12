import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUserRecord() {
  const { userId } = await auth();
  if (!userId) return null;
  const record = await db.query.users.findFirst({ where: eq(users.id, userId) });
  return record ?? null;
}


