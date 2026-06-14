import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET – return all teachers (for member assignment)
export async function GET() {
  try {
    const list = await db
      .select({
        id: teachers.id,
        name: teachers.name,
        committees: teachers.committees,
        responsibility: teachers.responsibility,
        assignedRole: teachers.assignedRole,
        specialization: teachers.specialization,
        institute: teachers.institute,
      })
      .from(teachers);
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST – assign/remove a teacher from a committee
// body: { teacherId, committeeName, action: "add" | "remove" }
export async function POST(req: NextRequest) {
  try {
    const { teacherId, committeeName, action } = await req.json();
    if (!teacherId || !committeeName || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const [teacher] = await db
      .select({ committees: teachers.committees })
      .from(teachers)
      .where(eq(teachers.id, teacherId));

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const current: string[] = teacher.committees
      ? teacher.committees.split(",").map((c) => c.trim()).filter(Boolean)
      : [];

    let updated: string[];
    if (action === "add") {
      if (!current.includes(committeeName)) current.push(committeeName);
      updated = current;
    } else {
      updated = current.filter((c) => c !== committeeName);
    }

    await db
      .update(teachers)
      .set({ committees: updated.join(",") })
      .where(eq(teachers.id, teacherId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
