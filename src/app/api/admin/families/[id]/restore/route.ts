import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { families, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// PUT /api/admin/families/[id]/restore - Restore archived family
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

    // Check if family exists
    const family = await db.select().from(families).where(eq(families.id, id)).get();
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    if (!family.archivedAt) {
      return NextResponse.json(
        { error: 'Family is not archived' },
        { status: 400 }
      );
    }

    // Check if another family with this name already exists (active)
    const existingActiveFamily = await db
      .select()
      .from(families)
      .where(eq(families.name, family.name))
      .get();

    if (existingActiveFamily && existingActiveFamily.id !== id && !existingActiveFamily.archivedAt) {
      return NextResponse.json(
        { error: 'Cannot restore: a family with this name already exists' },
        { status: 400 }
      );
    }

    // Restore the family
    const restoredFamily = await db
      .update(families)
      .set({
        archivedAt: null,
        updatedAt: Date.now(),
      })
      .where(eq(families.id, id))
      .returning();

    // Note: We don't automatically restore users - that should be done individually
    // to give admins more control over which users to reactivate

    return NextResponse.json({
      message: 'Family has been restored',
      family: restoredFamily[0],
    });
  } catch (error) {
    console.error('Error restoring family:', error);
    return NextResponse.json(
      { error: 'Failed to restore family' },
      { status: 500 }
    );
  }
}