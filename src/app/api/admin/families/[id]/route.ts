import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { families, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// PUT /api/admin/families/[id] - Update family
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Family name is required' },
        { status: 400 }
      );
    }

    // Check if family exists
    const family = await db.select().from(families).where(eq(families.id, id)).get();
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    // Check if another family with this name already exists (excluding current family)
    const existingFamily = await db
      .select()
      .from(families)
      .where(eq(families.name, name.trim()))
      .get();

    if (existingFamily && existingFamily.id !== id && !existingFamily.archivedAt) {
      return NextResponse.json(
        { error: 'A family with this name already exists' },
        { status: 400 }
      );
    }

    // Update the family
    const updatedFamily = await db
      .update(families)
      .set({
        name: name.trim(),
        updatedAt: Date.now(),
      })
      .where(eq(families.id, id))
      .returning();

    return NextResponse.json(updatedFamily[0]);
  } catch (error) {
    console.error('Error updating family:', error);
    return NextResponse.json(
      { error: 'Failed to update family' },
      { status: 500 }
    );
  }
}