import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { users, families } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Find the sample family from seed data
    const sampleFamily = await db
      .select()
      .from(families)
      .where(eq(families.name, 'Sample Family'))
      .limit(1);
      
    if (sampleFamily.length === 0) {
      return NextResponse.json({ 
        error: 'Sample family not found. Please run the seed script first.' 
      }, { status: 400 });
    }
    
    const familyId = sampleFamily[0].id;
    
    // First, try to update existing user
    const [updatedUser] = await db
      .update(users)
      .set({ 
        role: 'parent',
        familyId: familyId,
        updatedAt: Date.now() 
      })
      .where(eq(users.id, userId))
      .returning();
      
    if (updatedUser) {
      return NextResponse.json({ 
        success: true, 
        message: 'User set as parent in Sample Family successfully',
        user: updatedUser,
        family: sampleFamily[0]
      });
    }
    
    // If user doesn't exist, create it first
    try {
      const clerkUser = await (await clerkClient()).users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || `${userId}@unknown.com`;
      
      const now = Date.now();
      const [newUser] = await db
        .insert(users)
        .values({
          id: userId,
          email,
          role: 'parent',
          familyId: familyId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
        
      return NextResponse.json({ 
        success: true, 
        message: 'User record created as parent in Sample Family successfully',
        user: newUser,
        family: sampleFamily[0]
      });
    } catch (clerkError) {
      console.error('Error fetching user from Clerk:', clerkError);
      
      // Fallback: create user with minimal info
      const now = Date.now();
      const [newUser] = await db
        .insert(users)
        .values({
          id: userId,
          email: `${userId}@pending.com`, // Placeholder email
          role: 'parent',
          familyId: familyId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
        
      return NextResponse.json({ 
        success: true, 
        message: 'User record created with placeholder email as parent in Sample Family',
        user: newUser,
        family: sampleFamily[0]
      });
    }
  } catch (error) {
    console.error('Error setting user as parent:', error);
    return NextResponse.json({ error: 'Failed to set user as parent' }, { status: 500 });
  }
}