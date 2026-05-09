import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studentAttendance, students, classes } from "@/db/schema";
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
    let assignedClassNames: string[] = [];
    if (session.user.role === "TEACHER") {
      const teacherProfile = await db.query.teachers.findFirst({
        where: (t, { eq }) => eq(t.userId, session.user.id)
      });
      if (!teacherProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      
      teacherInstitute = teacherProfile.institute || "";
      assignedClassNames = teacherProfile.classAssigned 
        ? teacherProfile.classAssigned.split(",").map(c => c.trim()) 
        : [];
    }

    // 1. Fetch the class to check institute and assignment

    const academyClass = await db.query.classes.findFirst({
      where: (c, { and, eq, inArray }) => {
        const conditions = [eq(c.id, classId)];
        if (session.user.role === "TEACHER") {
          if (teacherInstitute) conditions.push(eq(c.institute, teacherInstitute));
          
          const allPotentialNames = [
            ...assignedClassNames,
            ...assignedClassNames.map(n => `Class ${n}`),
            ...assignedClassNames.map(n => `CLASS ${n}`),
            ...assignedClassNames.map(n => n.replace(/^Class\s+/i, ""))
          ];
          conditions.push(inArray(c.name, allPotentialNames));
        }
        return and(...conditions);
      }
    });

    if (!academyClass) {
      return NextResponse.json({ error: "Class not found or access denied" }, { status: 404 });
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
