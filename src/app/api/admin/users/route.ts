import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { users, families } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/admin/users - List all users
export async function GET() {
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

    // Get all users with their family information
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        familyId: users.familyId,
        archivedAt: users.archivedAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        familyName: families.name,
        familyArchivedAt: families.archivedAt,
      })
      .from(users)
      .leftJoin(families, eq(users.familyId, families.id))
      .orderBy(users.email);

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}