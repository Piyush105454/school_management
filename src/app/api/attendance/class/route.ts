import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studentAttendance, students, classes, teachers, timetable, subjects } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = parseInt(searchParams.get("class_id") || "0");
    const month = searchParams.get("month");
    const year = parseInt(searchParams.get("year") || "0");

    if (!classId || !month || !year) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let teacherInstitute = "";
    const assignedClassIds = new Set<number>();
    const assignedClassNames = new Set<string>();

    const normalizeName = (name: string) => {
      if (!name) return "";
      const n = name.trim();
      if (/^kg\s*ii$/i.test(n)) return "kg2";
      if (/^kg\s*i$/i.test(n)) return "kg1";
      return n.toLowerCase().replace(/^class\s+/i, "").trim();
    };

    if (session.user.role === "TEACHER") {
      const teacherProfile = await db.query.teachers.findFirst({
        where: (t, { eq }) => eq(t.userId, session.user.id)
      });
      if (!teacherProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      
      teacherInstitute = teacherProfile.institute || "";

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

      // Source 3: Profile classAssigned
      if (teacherProfile.classAssigned) {
        const profileClasses = teacherProfile.classAssigned
          .split(",")
          .map(s => normalizeName(s))
          .filter(Boolean);
        for (const pc of profileClasses) {
          assignedClassNames.add(pc);
        }
      }
    }

    // 1. Fetch the class to check institute and assignment
    const academyClass = await db.query.classes.findFirst({
      where: (c, { eq }) => eq(c.id, classId)
    });

    if (!academyClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (session.user.role === "TEACHER") {
      const matchId = assignedClassIds.has(academyClass.id);
      const matchName = assignedClassNames.has(normalizeName(academyClass.name));
      const instituteMatch = !teacherInstitute || academyClass.institute === teacherInstitute;

      if (!(matchId || (matchName && instituteMatch))) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // 2. Fetch ALL students in this class
    const classStudents = await db.select().from(students).where(eq(students.classId, classId));

    // 2. Fetch their attendance records
    const attendanceRecords = await db.select({
      status: studentAttendance.status,
      date: studentAttendance.date,
      studentId: studentAttendance.studentId // This is the ID from the students table
    })
    .from(studentAttendance)
    .where(
      and(
        eq(studentAttendance.classId, classId),
        eq(studentAttendance.month, month),
        eq(studentAttendance.year, year)
      )
    );

    // 3. Merge them so ALL students show up even with no attendance
    const attendanceMap = new Map();
    attendanceRecords.forEach(r => {
      if (!attendanceMap.has(r.studentId)) attendanceMap.set(r.studentId, {});
      const day = new Date(r.date).getDate();
      attendanceMap.get(r.studentId)[day] = r.status;
    });

    const result = classStudents.map(s => ({
      studentId: s.studentId, // The entry number
      name: s.name,
      rollNumber: s.rollNumber,
      attendance: attendanceMap.get(s.id) || {}
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Grid API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
