import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { families, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// PUT /api/admin/families/[id]/archive - Archive family
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

    if (family.archivedAt) {
      return NextResponse.json(
        { error: 'Family is already archived' },
        { status: 400 }
      );
    }

    // Archive the family
    const archivedFamily = await db
      .update(families)
      .set({
        archivedAt: Date.now(),
        updatedAt: Date.now(),
      })
      .where(eq(families.id, id))
      .returning();

    // Also archive all users in this family
    await db
      .update(users)
      .set({
        archivedAt: Date.now(),
        updatedAt: Date.now(),
      })
      .where(eq(users.familyId, id));

    return NextResponse.json({
      message: 'Family and all its users have been archived',
      family: archivedFamily[0],
    });
  } catch (error) {
    console.error('Error archiving family:', error);
    return NextResponse.json(
      { error: 'Failed to archive family' },
      { status: 500 }
    );
  }
}