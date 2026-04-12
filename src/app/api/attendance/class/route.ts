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

    const data = await db.select({
      id: studentAttendance.id,
      date: studentAttendance.date,
      status: studentAttendance.status,
      studentId: students.studentId,
      studentName: students.name,
      dbStudentId: students.id
    })
    .from(studentAttendance)
    .innerJoin(students, eq(studentAttendance.studentId, students.id))
    .where(
      and(
        eq(studentAttendance.classId, classId),
        eq(studentAttendance.month, month),
        eq(studentAttendance.year, year)
      )
    );

    // Group by student for better grid consumption
    const grouped = data.reduce((acc: any, curr) => {
      if (!acc[curr.dbStudentId]) {
        acc[curr.dbStudentId] = {
          studentId: curr.studentId,
          name: curr.studentName,
          attendance: {}
        };
      }
      const day = new Date(curr.date).getDate();
      acc[curr.dbStudentId].attendance[day] = curr.status;
      return acc;
    }, {});

    return NextResponse.json(Object.values(grouped));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
