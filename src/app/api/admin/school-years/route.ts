import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/db/client';
import { schoolYears, familyYearStatus, families } from '@/db/schema';
import { getCurrentUserRecord } from '@/lib/auth';
import { clearSchoolYearCache } from '@/lib/schoolYear';
import { eq, and } from 'drizzle-orm';

// GET /api/admin/school-years - List all school years
export async function GET() {
  const user = await getCurrentUserRecord();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const years = await db.select().from(schoolYears).orderBy(schoolYears.createdAt);
  return NextResponse.json(years);
}

// POST /api/admin/school-years - Create new school year
export async function POST(request: NextRequest) {
  const user = await getCurrentUserRecord();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, startDate, endDate, requiredHours = 50, hourlyRate = 20.0 } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, startDate, endDate' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const now = Date.now();

    const newYear = await db.insert(schoolYears).values({
      id,
      name,
      startDate: new Date(startDate).getTime(),
      endDate: new Date(endDate).getTime(),
      requiredHours,
      hourlyRate,
      isActive: false, // New years start inactive
      createdAt: now,
    }).returning();

    return NextResponse.json(newYear[0], { status: 201 });
  } catch (error) {
    console.error('Error creating school year:', error);
    return NextResponse.json(
      { error: 'Failed to create school year' },
      { status: 500 }
    );
  }
}