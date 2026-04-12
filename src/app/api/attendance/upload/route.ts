import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { classes, students, overallAttendance, studentAttendance } from "@/db/schema";
import { parseAttendanceExcel } from "@/lib/attendance/excel-parser";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const password = formData.get("password") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedData = parseAttendanceExcel(buffer);

    // Business Logic: Transaction for Idempotency
    const result = await db.transaction(async (tx) => {
      // 1. Clear existing records for this month/year
      await tx.delete(overallAttendance).where(
        and(
          eq(overallAttendance.month, parsedData.month),
          eq(overallAttendance.year, parsedData.year)
        )
      );

      await tx.delete(studentAttendance).where(
        and(
          eq(studentAttendance.month, parsedData.month),
          eq(studentAttendance.year, parsedData.year)
        )
      );

      // 2. Upsert Classes
      const uniqueClasses = Array.from(new Set(parsedData.classAttendance.map(c => c.className)));
      for (const name of uniqueClasses) {
        const grade = parseInt(name.replace("CLASS ", "")) || 0;
        await tx.insert(classes).values({ name, grade }).onConflictDoUpdate({
          target: classes.id, // This might be tricky if we don't have the ID. 
          // Better to use name as unique and upsert on name. 
          // Let's check schema.ts for unique constraint on classes.name.
          set: { grade }
        });
      }
      
      // Wait, classes table doesn't have unique constraint on name in schema.ts.
      // I should probably find or create.
      const dbClasses = await tx.select().from(classes);
      const classMap = new Map(dbClasses.map(c => [c.name, c.id]));

      for (const name of uniqueClasses) {
        if (!classMap.has(name)) {
          const [newClass] = await tx.insert(classes).values({ name, grade: parseInt(name.replace("CLASS ", "")) || 0 }).returning();
          classMap.set(name, newClass.id);
        }
      }

      // 3. Upsert Students
      for (const s of parsedData.students) {
        if (!s.name || !s.studentId) continue;

        // Resolve classId for student
        const studentClassName = parsedData.classAttendance.find(ca => ca.studentId === s.studentId)?.className;
        const classId = studentClassName ? classMap.get(studentClassName) : null;

        await tx.insert(students).values({
          studentId: s.studentId,
          name: s.name,
          classId: classId
        }).onConflictDoUpdate({
          target: students.studentId,
          set: { name: s.name, classId: classId }
        });
      }

      const dbStudents = await tx.select().from(students);
      const studentMap = new Map(dbStudents.map(s => [s.studentId, s.id]));

      // 4. Insert Overall Attendance
      if (parsedData.overall.length > 0) {
        await tx.insert(overallAttendance).values(parsedData.overall);
      }

      // 5. Insert Student Attendance (Batch)
      const attendanceToInsert = parsedData.classAttendance.map(ca => ({
        studentId: studentMap.get(ca.studentId),
        classId: classMap.get(ca.className),
        date: ca.date,
        day: ca.day,
        month: ca.month,
        year: ca.year,
        status: ca.status
      })).filter(a => a.studentId && a.classId);

      if (attendanceToInsert.length > 0) {
        // Drizzle batch insert
        await tx.insert(studentAttendance).values(attendanceToInsert);
      }

      return {
        overall: parsedData.overall.length,
        students: parsedData.students.length,
        attendance: attendanceToInsert.length,
        sheetNames: parsedData.sheetNames
      };
    });

    return NextResponse.json({ success: true, summary: result });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
