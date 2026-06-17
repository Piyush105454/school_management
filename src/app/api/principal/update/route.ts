import { db } from '@/db';
import { teachers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { principalId, name, institute } = await request.json();

    if (!principalId || !name || !institute) {
      return NextResponse.json({ error: 'Principal ID, name, and institute are required' }, { status: 400 });
    }

    const existingTeacher = await db.select().from(teachers).where(eq(teachers.userId, principalId)).limit(1);

    if (existingTeacher && existingTeacher.length > 0) {
      await db.update(teachers).set({ name: name, institute: institute, updatedAt: new Date() }).where(eq(teachers.userId, principalId));
    } else {
      await db.insert(teachers).values({ userId: principalId, employeeId: 'PR-' + Math.random().toString(36).substring(2, 8).toUpperCase(), name: name, email: 'pr_' + principalId.substring(0,6) + '@update.com', gender: 'Not Specified', assignedRole: 'PRINCIPAL', institute: institute });
    }

    return NextResponse.json({ success: true, message: 'Principal updated successfully' });
  } catch (error) {
    console.error('Error updating principal:', error);
    return NextResponse.json({ error: 'Failed to update principal' }, { status: 500 });
  }
}
