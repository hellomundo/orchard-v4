import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { users, families } from '@/db/schema';
import { eq } from 'drizzle-orm';

// PUT /api/admin/users/[id] - Update user (for family reassignment)
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
    const adminUser = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { familyId } = body;

    // Check if target user exists
    const targetUser = await db.select().from(users).where(eq(users.id, id)).get();
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admins from changing their own family assignment
    if (id === userId) {
      return NextResponse.json(
        { error: 'Cannot change your own family assignment' },
        { status: 400 }
      );
    }

    // If familyId is provided, validate it exists and is not archived
    if (familyId) {
      const family = await db.select().from(families).where(eq(families.id, familyId)).get();
      if (!family) {
        return NextResponse.json({ error: 'Family not found' }, { status: 404 });
      }
      if (family.archivedAt) {
        return NextResponse.json(
          { error: 'Cannot assign user to archived family' },
          { status: 400 }
        );
      }
    }

    // Update the user's family assignment
    const updatedUser = await db
      .update(users)
      .set({
        familyId: familyId || null,
        updatedAt: Date.now(),
      })
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}