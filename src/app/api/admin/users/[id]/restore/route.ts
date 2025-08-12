import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// PUT /api/admin/users/[id]/restore - Restore archived user
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

    // Check if target user exists
    const targetUser = await db.select().from(users).where(eq(users.id, id)).get();
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!targetUser.archivedAt) {
      return NextResponse.json(
        { error: 'User is not archived' },
        { status: 400 }
      );
    }

    // Restore the user
    const restoredUser = await db
      .update(users)
      .set({
        archivedAt: null,
        updatedAt: Date.now(),
      })
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json({
      message: 'User has been restored',
      user: restoredUser[0],
    });
  } catch (error) {
    console.error('Error restoring user:', error);
    return NextResponse.json(
      { error: 'Failed to restore user' },
      { status: 500 }
    );
  }
}