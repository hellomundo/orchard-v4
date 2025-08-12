import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/db/client';
import { taskCategories } from '@/db/schema';
import { getCurrentUserRecord } from '@/lib/auth';
import { eq } from 'drizzle-orm';

// GET /api/admin/categories - List all task categories
export async function GET() {
  const user = await getCurrentUserRecord();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const categories = await db
    .select()
    .from(taskCategories)
    .orderBy(taskCategories.createdAt);

  return NextResponse.json(categories);
}

// POST /api/admin/categories - Create new task category
export async function POST(request: NextRequest) {
  const user = await getCurrentUserRecord();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, isActive = true } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const now = Date.now();

    const [newCategory] = await db
      .insert(taskCategories)
      .values({
        id,
        name: name.trim(),
        isActive,
        createdAt: now,
      })
      .returning();

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating task category:', error);
    return NextResponse.json(
      { error: 'Failed to create task category' },
      { status: 500 }
    );
  }
}