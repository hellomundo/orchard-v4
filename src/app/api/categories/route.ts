import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { taskCategories } from '@/db/schema';
import { getCurrentUserRecord } from '@/lib/auth';
import { eq } from 'drizzle-orm';

// GET /api/categories - List active task categories for parents
export async function GET() {
  const user = await getCurrentUserRecord();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const categories = await db
      .select()
      .from(taskCategories)
      .where(eq(taskCategories.isActive, true))
      .orderBy(taskCategories.name);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}