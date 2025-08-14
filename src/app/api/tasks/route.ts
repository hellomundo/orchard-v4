import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { tasks, taskCategories, users, families } from '@/db/schema';
import { getCurrentUserRecord } from '@/lib/auth';
import { getCurrentSchoolYear } from '@/lib/schoolYear';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// GET /api/tasks - List family's tasks for current year
export async function GET(request: NextRequest) {
  const user = await getCurrentUserRecord();
  if (!user || user.role !== 'parent' || !user.familyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentYear = await getCurrentSchoolYear();
  if (!currentYear) {
    return NextResponse.json({ error: 'No active school year' }, { status: 400 });
  }

  try {
    const familyTasks = await db
      .select({
        id: tasks.id,
        hours: tasks.hours,
        date: tasks.date,
        description: tasks.description,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        userId: tasks.userId,
        category: {
          id: taskCategories.id,
          name: taskCategories.name
        },
        submittedBy: {
          id: users.id,
          email: users.email
        }
      })
      .from(tasks)
      .leftJoin(taskCategories, eq(tasks.categoryId, taskCategories.id))
      .leftJoin(users, eq(tasks.userId, users.id))
      .where(
        and(
          eq(tasks.familyId, user.familyId),
          eq(tasks.schoolYearId, currentYear.id)
        )
      )
      .orderBy(desc(tasks.date), desc(tasks.createdAt));

    return NextResponse.json(familyTasks);
  } catch (error) {
    console.error('Error fetching family tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Submit new volunteer task
export async function POST(request: NextRequest) {
  const user = await getCurrentUserRecord();
  if (!user || user.role !== 'parent' || !user.familyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentYear = await getCurrentSchoolYear();
  if (!currentYear) {
    return NextResponse.json({ error: 'No active school year' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { hours, date, categoryId, description } = body;

    // Validation
    if (!hours || !date || !categoryId) {
      return NextResponse.json(
        { error: 'Hours, date, and category are required' },
        { status: 400 }
      );
    }

    // Validate hours (must be positive and in 0.25 increments)
    if (hours <= 0 || (hours * 4) % 1 !== 0) {
      return NextResponse.json(
        { error: 'Hours must be positive and in 0.25 increments' },
        { status: 400 }
      );
    }

    // Validate date is not in the future
    if (new Date(date) > new Date()) {
      return NextResponse.json(
        { error: 'Date cannot be in the future' },
        { status: 400 }
      );
    }

    // Verify category exists and is active
    const category = await db
      .select()
      .from(taskCategories)
      .where(and(eq(taskCategories.id, categoryId), eq(taskCategories.isActive, true)))
      .limit(1);

    if (category.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or inactive category' },
        { status: 400 }
      );
    }

    const now = Date.now();
    const taskId = randomUUID();

    // Create the task
    const newTask = await db
      .insert(tasks)
      .values({
        id: taskId,
        familyId: user.familyId,
        schoolYearId: currentYear.id,
        userId: user.id,
        categoryId,
        hours: parseFloat(hours),
        date: new Date(date).getTime(),
        description: description?.trim() || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Fetch the created task with joined data for response
    const taskWithDetails = await db
      .select({
        id: tasks.id,
        hours: tasks.hours,
        date: tasks.date,
        description: tasks.description,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        userId: tasks.userId,
        category: {
          id: taskCategories.id,
          name: taskCategories.name
        },
        submittedBy: {
          id: users.id,
          email: users.email
        }
      })
      .from(tasks)
      .leftJoin(taskCategories, eq(tasks.categoryId, taskCategories.id))
      .leftJoin(users, eq(tasks.userId, users.id))
      .where(eq(tasks.id, taskId))
      .limit(1);

    return NextResponse.json(taskWithDetails[0], { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}