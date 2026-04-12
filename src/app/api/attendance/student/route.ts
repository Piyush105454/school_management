import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studentAttendance, students, classes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentIdStr = searchParams.get("student_id"); // e.g. 125961
    const month = searchParams.get("month");
    const year = parseInt(searchParams.get("year") || "0");

    if (!studentIdStr || !month || !year) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // First find the student's internal ID
    const student = await db.query.students.findFirst({
      where: eq(students.studentId, studentIdStr),
      with: {
        // Need relations if defined, if not we join. 
        // Let's use join for safety as relations might not be fully configured in legacy schema.ts
      }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const data = await db.select({
      id: studentAttendance.id,
      date: studentAttendance.date,
      status: studentAttendance.status,
      className: classes.name
    })
    .from(studentAttendance)
    .leftJoin(classes, eq(studentAttendance.classId, classes.id))
    .where(
      and(
        eq(studentAttendance.studentId, student.id),
        eq(studentAttendance.month, month),
        eq(studentAttendance.year, year)
      )
    )
    .orderBy(studentAttendance.date);

    return NextResponse.json({
      student: {
        studentId: student.studentId,
        name: student.name
      },
      attendance: data
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
