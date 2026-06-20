import { NextResponse } from "next/server";
import { db } from "@/db";
import { classes, teachers, timetable, subjects } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, asc, and, inArray, or } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const institute = searchParams.get("institute");
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbClasses = await db.query.classes.findMany();

    let filtered = dbClasses;

    if (session.user.role === "TEACHER") {
      const teacherProfile = await db.query.teachers.findFirst({
        where: eq(teachers.userId, session.user.id)
      });
      
      if (teacherProfile) {
        const normalizeName = (name: string) => {
          if (!name) return "";
          const n = name.trim();
          if (/^kg\s*ii$/i.test(n)) return "kg2";
          if (/^kg\s*i$/i.test(n)) return "kg1";
          return n.toLowerCase().replace(/^class\s+/i, "").trim();
        };

        const assignedClassIds = new Set<number>();
        const assignedClassNames = new Set<string>();

        // Source 1: Subjects
        const assignedSubjects = await db.query.subjects.findMany({
          where: eq(subjects.assignedTeacherId, teacherProfile.id),
          columns: { classId: true }
        });
        for (const s of assignedSubjects) {
          if (s.classId) assignedClassIds.add(s.classId);
        }

        // Source 2: Timetable
        const teacherTimetable = await db.query.timetable.findMany({
          where: eq(timetable.teacherId, teacherProfile.id),
          columns: { classId: true, className: true }
        });
        for (const t of teacherTimetable) {
          if (t.classId) assignedClassIds.add(t.classId);
          if (t.className) assignedClassNames.add(normalizeName(t.className));
        }

        const teacherInstitute = teacherProfile.institute;

        filtered = dbClasses.filter(c => {
          const matchId = assignedClassIds.has(c.id);
          const matchName = assignedClassNames.has(normalizeName(c.name));
          const instituteMatch = !teacherInstitute || c.institute === teacherInstitute;
          return matchId || (matchName && instituteMatch);
        });
      } else {
        filtered = [];
      }
    }

    // Apply Global Institute Filter (if selected and not "ALL")
    if (institute && institute !== "ALL") {
      const target = institute.toLowerCase();
      filtered = filtered.filter(c => c.institute?.toLowerCase() === target);
    }

    // Sort by grade, then by name
    filtered.sort((a, b) => {
      const gradeDiff = (a.grade || 0) - (b.grade || 0);
      if (gradeDiff !== 0) return gradeDiff;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
