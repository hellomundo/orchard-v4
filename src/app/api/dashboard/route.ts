import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { tasks, families } from '@/db/schema';
import { getCurrentUserRecord } from '@/lib/auth';
import { getCurrentSchoolYear } from '@/lib/schoolYear';
import { eq, and, sum, desc } from 'drizzle-orm';

// GET /api/dashboard - Family progress summary for parents
export async function GET() {
  const user = await getCurrentUserRecord();
  if (!user || user.role !== 'parent' || !user.familyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentYear = await getCurrentSchoolYear();
  if (!currentYear) {
    return NextResponse.json({ error: 'No active school year' }, { status: 400 });
  }

  try {
    // Get family information
    const family = await db
      .select()
      .from(families)
      .where(eq(families.id, user.familyId))
      .limit(1);

    if (family.length === 0) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      );
    }

    // Calculate total hours for the family in the current year
    const hoursResult = await db
      .select({
        totalHours: sum(tasks.hours)
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.familyId, user.familyId),
          eq(tasks.schoolYearId, currentYear.id)
        )
      );

    const totalHours = parseFloat(hoursResult[0]?.totalHours || '0');
    const requiredHours = currentYear.requiredHours;
    const hoursRemaining = Math.max(0, requiredHours - totalHours);
    const progressPercentage = Math.min(100, (totalHours / requiredHours) * 100);
    const penalty = hoursRemaining * currentYear.hourlyRate;

    // Get recent tasks (last 5)
    const recentTasks = await db
      .select({
        id: tasks.id,
        hours: tasks.hours,
        date: tasks.date,
        description: tasks.description,
        createdAt: tasks.createdAt
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.familyId, user.familyId),
          eq(tasks.schoolYearId, currentYear.id)
        )
      )
      .orderBy(desc(tasks.date), desc(tasks.createdAt))
      .limit(5);

    return NextResponse.json({
      family: {
        id: family[0].id,
        name: family[0].name
      },
      schoolYear: {
        id: currentYear.id,
        name: currentYear.name,
        requiredHours: currentYear.requiredHours,
        hourlyRate: currentYear.hourlyRate,
        startDate: currentYear.startDate,
        endDate: currentYear.endDate
      },
      progress: {
        totalHours,
        requiredHours,
        hoursRemaining,
        progressPercentage,
        penalty
      },
      recentTasks
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}