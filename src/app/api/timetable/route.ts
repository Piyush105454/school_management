import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { timetable, classes, subjects, teachers } from "@/db/schema";
import { isNotNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const timetableList = await db.select().from(timetable);
    const classesList = await db.select().from(classes).orderBy(classes.name);
    const subjectsList = await db.select().from(subjects).orderBy(subjects.name);
    const teachersList = await db
      .select({
        id: teachers.id,
        name: teachers.name,
        userId: teachers.userId,
      })
      .from(teachers)
      .where(isNotNull(teachers.userId))
      .orderBy(teachers.name);

    return NextResponse.json({
      timetable: timetableList,
      classes: classesList,
      subjects: subjectsList,
      teachers: teachersList,
    });
  } catch (error: any) {
    console.error("Error fetching timetable data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
