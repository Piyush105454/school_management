import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { timetable, classes, subjects, teachers } from "@/db/schema";
import { isNotNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Normalize class name: "KG I" → "kg1", "KG II" → "kg2", "Class 3" → "3"
function normalizeClassName(name: string): string {
  if (!name) return "";
  const n = name.trim();
  if (/^kg\s*ii$/i.test(n)) return "kg2";
  if (/^kg\s*i$/i.test(n)) return "kg1";
  return n.toLowerCase().replace(/^class\s+/i, "").trim();
}

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

    // Patch missing classId by resolving from className
    const patchedTimetable = timetableList.map(entry => {
      if (entry.classId) return entry;
      const matched = classesList.find(
        c => normalizeClassName(c.name) === normalizeClassName(entry.className)
      );
      return matched ? { ...entry, classId: matched.id } : entry;
    });

    return NextResponse.json({
      timetable: patchedTimetable,
      classes: classesList,
      subjects: subjectsList,
      teachers: teachersList,
    });
  } catch (error: any) {
    console.error("Error fetching timetable data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
