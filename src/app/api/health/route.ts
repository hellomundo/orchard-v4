import { db } from '@/db/client';
import { schoolYears } from '@/db/schema';

export async function GET() {
  try {
    // Simple roundtrip via drizzle
    await db.select({ id: schoolYears.id }).from(schoolYears).limit(1);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}


