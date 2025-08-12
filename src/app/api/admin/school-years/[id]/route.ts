import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { schoolYears } from '@/db/schema';
import { getCurrentUserRecord } from '@/lib/auth';
import { clearSchoolYearCache } from '@/lib/schoolYear';
import { eq } from 'drizzle-orm';

// PUT /api/admin/school-years/[id] - Update school year settings
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
    const { name, startDate, endDate, requiredHours, hourlyRate } = body;

    const updateData: Partial<typeof schoolYears.$inferInsert> = {};

    if (name !== undefined) updateData.name = name;
    if (startDate !== undefined) updateData.startDate = new Date(startDate).getTime();
    if (endDate !== undefined) updateData.endDate = new Date(endDate).getTime();
    if (requiredHours !== undefined) updateData.requiredHours = requiredHours;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const [updatedYear] = await db
      .update(schoolYears)
      .set(updateData)
      .where(eq(schoolYears.id, id))
      .returning();

    if (!updatedYear) {
      return NextResponse.json({ error: 'School year not found' }, { status: 404 });
    }

    // Clear cache if we updated the active year
    if (updatedYear.isActive) {
      clearSchoolYearCache();
    }

    return NextResponse.json(updatedYear);
  } catch (error) {
    console.error('Error updating school year:', error);
    return NextResponse.json(
      { error: 'Failed to update school year' },
      { status: 500 }
    );
  }
}