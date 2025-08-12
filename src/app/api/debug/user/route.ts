import { NextResponse } from 'next/server';
import { getCurrentUserRecord } from '@/lib/auth';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    const userRecord = await getCurrentUserRecord();
    
    let clerkUserInfo = null;
    if (userId) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        clerkUserInfo = {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || 'No email',
          createdAt: clerkUser.createdAt,
          lastSignInAt: clerkUser.lastSignInAt,
        };
      } catch (clerkError) {
        clerkUserInfo = { error: 'Failed to fetch from Clerk' };
      }
    }
    
    return NextResponse.json({
      clerkUserId: userId,
      clerkUserInfo,
      userRecord,
      hasUserRecord: !!userRecord,
      userRole: userRecord?.role || 'none',
      isAdmin: userRecord?.role === 'admin',
      webhookSecret: !!process.env.CLERK_WEBHOOK_SECRET
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get user info' }, { status: 500 });
  }
}