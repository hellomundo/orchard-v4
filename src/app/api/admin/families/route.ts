import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { families, familyYearStatus, users } from '@/db/schema';
import { eq, isNull, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getCurrentSchoolYear } from '@/lib/schoolYear';

// GET /api/admin/families - List all families
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

    // Get all families with their users
    const allFamilies = await db
      .select({
        id: families.id,
        name: families.name,
        archivedAt: families.archivedAt,
        createdAt: families.createdAt,
        updatedAt: families.updatedAt,
      })
      .from(families)
      .orderBy(families.name);

    // Get users for each family
    const familiesWithUsers = await Promise.all(
      allFamilies.map(async (family) => {
        const familyUsers = await db
          .select({
            id: users.id,
            email: users.email,
            role: users.role,
            archivedAt: users.archivedAt,
          })
          .from(users)
          .where(eq(users.familyId, family.id));

        return {
          ...family,
          users: familyUsers,
        };
      })
    );

    return NextResponse.json(familiesWithUsers);
  } catch (error) {
    console.error('Error fetching families:', error);
    return NextResponse.json(
      { error: 'Failed to fetch families' },
      { status: 500 }
    );
  }
}

// POST /api/admin/families - Create new family
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 403 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Family name is required' },
        { status: 400 }
      );
    }

    // Check if family name already exists (case-insensitive, excluding archived)
    const existingFamily = await db
      .select()
      .from(families)
      .where(
        eq(families.name, name.trim())
      )
      .get();

    if (existingFamily && !existingFamily.archivedAt) {
      return NextResponse.json(
        { error: 'A family with this name already exists' },
        { status: 400 }
      );
    }

    const now = Date.now();
    const familyId = nanoid();

    // Create the family
    const newFamily = {
      id: familyId,
      name: name.trim(),
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(families).values(newFamily);

    // Create family_year_status record for current school year
    try {
      const currentYear = await getCurrentSchoolYear();
      if (currentYear) {
        await db.insert(familyYearStatus).values({
          id: nanoid(),
          familyId: familyId,
          schoolYearId: currentYear.id,
          isActive: true,
          totalHours: 0,
          createdAt: now,
        });
      }
    } catch (error) {
      console.warn('Could not create family_year_status for new family:', error);
      // Don't fail the family creation if this fails
    }

    return NextResponse.json(newFamily, { status: 201 });
  } catch (error) {
    console.error('Error creating family:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: 'Failed to create family',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}