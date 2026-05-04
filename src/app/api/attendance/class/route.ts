import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studentAttendance, students } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = parseInt(searchParams.get("class_id") || "0");
    const month = searchParams.get("month");
    const year = parseInt(searchParams.get("year") || "0");

    if (!classId || !month || !year) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 1. Fetch ALL students in this class first
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
