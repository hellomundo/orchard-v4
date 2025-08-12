import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { schoolYears, familyYearStatus, families } from '@/db/schema';
import { getCurrentUserRecord } from '@/lib/auth';
import { clearSchoolYearCache } from '@/lib/schoolYear';
import { eq, and, isNull } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

// PUT /api/admin/school-years/[id]/activate - Set school year as active and create family year status records
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
    await db.transaction(async (tx) => {
      // First, deactivate all other school years
      await tx.update(schoolYears).set({ isActive: false });

      // Activate the specified year
      const [updatedYear] = await tx
        .update(schoolYears)
        .set({ isActive: true })
        .where(eq(schoolYears.id, id))
        .returning();

      if (!updatedYear) {
        throw new Error('School year not found');
      }

      // Create family_year_status records for all active families if they don't exist
      const activeFamilies = await tx
        .select()
        .from(families)
        .where(isNull(families.archivedAt));

      const now = Date.now();
      for (const family of activeFamilies) {
        // Check if family year status already exists
        const existingStatus = await tx
          .select()
          .from(familyYearStatus)
          .where(
            and(
              eq(familyYearStatus.familyId, family.id),
              eq(familyYearStatus.schoolYearId, id)
            )
          )
          .get();

        if (!existingStatus) {
          await tx.insert(familyYearStatus).values({
            id: randomUUID(),
            familyId: family.id,
            schoolYearId: id,
            isActive: true,
            totalHours: 0,
            createdAt: now,
          });
        }
      }
    });

    // Clear the school year cache after successful activation
    clearSchoolYearCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error activating school year:', error);
    return NextResponse.json(
      { error: 'Failed to activate school year' },
      { status: 500 }
    );
  }
}