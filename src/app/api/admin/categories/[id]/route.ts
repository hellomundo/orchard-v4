import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { taskCategories } from '@/db/schema';
import { getCurrentUserRecord } from '@/lib/auth';
import { eq } from 'drizzle-orm';

// PUT /api/admin/categories/[id] - Update task category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserRecord();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, isActive } = body;

    const updateData: Partial<typeof taskCategories.$inferInsert> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Invalid category name' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const [updatedCategory] = await db
      .update(taskCategories)
      .set(updateData)
      .where(eq(taskCategories.id, id))
      .returning();

    if (!updatedCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating task category:', error);
    return NextResponse.json(
      { error: 'Failed to update task category' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id] - Archive task category
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserRecord();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const [updatedCategory] = await db
      .update(taskCategories)
      .set({ isActive: false })
      .where(eq(taskCategories.id, id))
      .returning();

    if (!updatedCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error archiving task category:', error);
    return NextResponse.json(
      { error: 'Failed to archive task category' },
      { status: 500 }
    );
  }
}