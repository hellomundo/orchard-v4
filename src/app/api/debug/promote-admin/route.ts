import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // First, try to update existing user
    const [updatedUser] = await db
      .update(users)
      .set({ 
        role: 'admin', 
        updatedAt: Date.now() 
      })
      .where(eq(users.id, userId))
      .returning();
      
    if (updatedUser) {
      return NextResponse.json({ 
        success: true, 
        message: 'User promoted to admin successfully',
        user: updatedUser
      });
    }
    
    // If user doesn't exist, create it first
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || `${userId}@unknown.com`;
      
      const now = Date.now();
      const [newUser] = await db
        .insert(users)
        .values({
          id: userId,
          email,
          role: 'admin',
          createdAt: now,
          updatedAt: now,
        })
        .returning();
        
      return NextResponse.json({ 
        success: true, 
        message: 'User record created and promoted to admin successfully',
        user: newUser
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
          role: 'admin',
          createdAt: now,
          updatedAt: now,
        })
        .returning();
        
      return NextResponse.json({ 
        success: true, 
        message: 'User record created with placeholder email and promoted to admin',
        user: newUser
      });
    }
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    return NextResponse.json({ error: 'Failed to promote user' }, { status: 500 });
  }
}