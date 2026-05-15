import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, overallAttendance, studentAttendance, classes } from "@/db/schema";
import { parseAttendanceExcel } from "@/lib/attendance/excel-parser";
import { eq, and, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const records = await parseAttendanceExcel(file);
    if (records.length === 0) {
      return NextResponse.json({ error: "No valid records found in Excel" }, { status: 400 });
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const timeframes = Array.from(new Set(records.map(r => `${r.date.getMonth()}-${r.date.getFullYear()}`)));

    const normalizeClassName = (name: string) => {
      const n = name.trim().toUpperCase();
      if (n === "LKG") return "KG1";
      if (n === "UKG") return "KG2";
      return n;
    };

    // 2. Load all mapping data once (OUTSIDE TRANSACTION to keep it short)
    const allDbStudents = await db.select().from(students);
    const allDbClasses = await db.select().from(classes);
    const classMap = new Map(allDbClasses.map(c => [c.name.toUpperCase(), c.id]));

    const result = await db.transaction(async (tx) => {
      // 1. Clear existing for the target months
      for (const tf of timeframes) {
        const [mIdx, y] = tf.split("-").map(Number);
        const mName = monthNames[mIdx];
        await tx.delete(studentAttendance).where(
          and(eq(studentAttendance.month, mName), eq(studentAttendance.year, y))
        );
        await tx.delete(overallAttendance).where(
          and(eq(overallAttendance.month, mName), eq(overallAttendance.year, y))
        );
      }

      // 3. Identify New Students and Unique Students in Excel
      const excelStudentsMap = new Map<string, any>();
      records.forEach(r => {
        const key = `${r.scholarNumber || ""}-${r.rollNumber || ""}-${r.name}`;
        if (!excelStudentsMap.has(key)) {
          excelStudentsMap.set(key, r);
        }
      });

      const newStudentsToCreate: any[] = [];
      const studentLookupMap = new Map<string, number>();

      for (const [key, r] of excelStudentsMap) {
        let match = allDbStudents.find(s => 
          (r.scholarNumber && s.scholarNumber === r.scholarNumber) || 
          (r.rollNumber && s.rollNumber === r.rollNumber)
        );

        if (match) {
          studentLookupMap.set(key, match.id);
        } else {
          newStudentsToCreate.push({
            name: r.name,
            scholarNumber: r.scholarNumber,
            rollNumber: r.rollNumber,
            classId: classMap.get(normalizeClassName(r.className || "")) || null,
          });
        }
      }

      // 4. Batch Create New Students
      if (newStudentsToCreate.length > 0) {
        const created = await tx.insert(students).values(newStudentsToCreate).returning();
        created.forEach(s => {
          // Re-create the key to map the ID
          const key = `${s.scholarNumber || ""}-${s.rollNumber || ""}-${s.name}`;
          studentLookupMap.set(key, s.id);
        });
      }

      // 5. Prepare Attendance Records
      const attendanceToInsert: any[] = [];
      const dNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

      for (const r of records) {
        const key = `${r.scholarNumber || ""}-${r.rollNumber || ""}-${r.name}`;
        const sId = studentLookupMap.get(key);
        
        if (sId) {
          attendanceToInsert.push({
            studentId: sId,
            classId: classMap.get(normalizeClassName(r.className || "")) || null,
            date: r.date,
            day: dNames[r.date.getDay()],
            month: monthNames[r.date.getMonth()],
            year: r.date.getFullYear(),
            status: r.status
          });
        }
      }

      // 6. Final Batch Insert of Attendance
      if (attendanceToInsert.length > 0) {
        const chunkSize = 1000; // Increased chunk size for efficiency
        for (let i = 0; i < attendanceToInsert.length; i += chunkSize) {
          await tx.insert(studentAttendance).values(attendanceToInsert.slice(i, i + chunkSize));
        }
      }

      return {
        totalRecords: records.length,
        newStudents: newStudentsToCreate.length,
        attendanceInserted: attendanceToInsert.length
      };
    });

    return NextResponse.json({ success: true, summary: result });
  } catch (error: any) {
    console.error("Optimized Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
