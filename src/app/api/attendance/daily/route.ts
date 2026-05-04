import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studentAttendance } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = parseInt(searchParams.get("class_id") || "0");
    const dateStr = searchParams.get("date");

    if (!classId || !dateStr) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const attendanceDate = new Date(dateStr);
    
    const records = await db.select({
      studentId: studentAttendance.studentId,
      status: studentAttendance.status
    })
    .from(studentAttendance)
    .where(
      and(
        eq(studentAttendance.classId, classId),
        eq(studentAttendance.date, attendanceDate)
      )
    );

    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
