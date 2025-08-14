import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { tasks, taskCategories, users } from '@/db/schema';
import { getCurrentUserRecord } from '@/lib/auth';
import { getCurrentSchoolYear } from '@/lib/schoolYear';
import { eq, and } from 'drizzle-orm';

// PUT /api/tasks/[id] - Edit own task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserRecord();
  if (!user || user.role !== 'parent') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentYear = await getCurrentSchoolYear();
  if (!currentYear) {
    return NextResponse.json({ error: 'No active school year' }, { status: 400 });
  }

  try {
    const { id } = params;
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

    // Verify the task exists and belongs to the current user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, id),
          eq(tasks.userId, user.id),
          eq(tasks.schoolYearId, currentYear.id)
        )
      )
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json(
        { error: 'Task not found or unauthorized' },
        { status: 404 }
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

    // Update the task
    await db
      .update(tasks)
      .set({
        hours: parseFloat(hours),
        date: new Date(date).getTime(),
        categoryId,
        description: description?.trim() || null,
        updatedAt: Date.now(),
      })
      .where(eq(tasks.id, id));

    // Fetch the updated task with joined data for response
    const updatedTask = await db
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
      .where(eq(tasks.id, id))
      .limit(1);

    return NextResponse.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete own task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserRecord();
  if (!user || user.role !== 'parent') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentYear = await getCurrentSchoolYear();
  if (!currentYear) {
    return NextResponse.json({ error: 'No active school year' }, { status: 400 });
  }

  try {
    const { id } = params;

    // Verify the task exists and belongs to the current user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, id),
          eq(tasks.userId, user.id),
          eq(tasks.schoolYearId, currentYear.id)
        )
      )
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json(
        { error: 'Task not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the task
    await db
      .delete(tasks)
      .where(eq(tasks.id, id));

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}