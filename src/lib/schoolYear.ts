import { db } from '@/db/client';
import { schoolYears } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type SchoolYear = typeof schoolYears.$inferSelect;

let currentSchoolYearCache: SchoolYear | null = null;
let cacheExpiry: number | null = null;

export async function getCurrentSchoolYear(): Promise<SchoolYear | null> {
  const now = Date.now();
  if (currentSchoolYearCache && cacheExpiry && now < cacheExpiry) {
    return currentSchoolYearCache;
  }

  const result = await db
    .select()
    .from(schoolYears)
    .where(eq(schoolYears.isActive, true))
    .get();

  currentSchoolYearCache = result ?? null;
  cacheExpiry = now + 60 * 60 * 1000; // 1 hour
  return currentSchoolYearCache;
}

export function clearSchoolYearCache() {
  currentSchoolYearCache = null;
  cacheExpiry = null;
}

// Extract school year from middleware headers
export function getSchoolYearFromHeaders(headers: Headers): SchoolYear | null {
  const id = headers.get('x-school-year-id');
  const name = headers.get('x-school-year-name');
  const requiredHours = headers.get('x-required-hours');
  const hourlyRate = headers.get('x-hourly-rate');
  
  if (!id || !name || !requiredHours || !hourlyRate) {
    return null;
  }
  
  return {
    id,
    name,
    startDate: 0, // These will be filled from cache/DB if needed
    endDate: 0,
    requiredHours: parseInt(requiredHours, 10),
    hourlyRate: parseFloat(hourlyRate),
    isActive: true,
    createdAt: 0,
  };
}


