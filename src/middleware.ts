import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSchoolYear } from '@/lib/schoolYear';

export default clerkMiddleware(async (_auth, req: NextRequest) => {
  // Inject current school year for API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    const schoolYear = await getCurrentSchoolYear();
    const response = NextResponse.next();
    
    if (schoolYear) {
      response.headers.set('x-school-year-id', schoolYear.id);
      response.headers.set('x-school-year-name', schoolYear.name);
      response.headers.set('x-required-hours', schoolYear.requiredHours.toString());
      response.headers.set('x-hourly-rate', schoolYear.hourlyRate.toString());
    }
    
    return response;
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};