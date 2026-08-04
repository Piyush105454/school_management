import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { holidays, studentAttendance, students, classes } from "@/db/schema";
import { eq, and, inArray, isNull, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    
    let baseQuery = db.select().from(holidays);
    if (year) {
      baseQuery = baseQuery.where(sql`${holidays.date} LIKE ${`${year}-%`}`) as any;
    }
    
    const list = await baseQuery.orderBy(holidays.date);
    return NextResponse.json(list);
  } catch (error: any) {
    console.error("Error fetching holidays:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OFFICE", "PRINCIPAL", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, date, title, action, type, startTime, endTime, institute } = await req.json();

    if (action === "delete") {
      // 1. Resolve date and institute of the holiday being deleted
      let targetDate = date;
      let targetInst = institute;
      
      if (id) {
        const record = await db.query.holidays.findFirst({
          where: eq(holidays.id, id)
        });
        if (record) {
          targetDate = record.date;
          targetInst = record.institute;
        }
      }

      if (!targetDate) {
        return NextResponse.json({ error: "Date or ID is required for deletion" }, { status: 400 });
      }

      // 2. Delete the holiday from holidays table
      if (id) {
        await db.delete(holidays).where(eq(holidays.id, id));
      } else {
        await db.delete(holidays).where(
          and(
            eq(holidays.date, targetDate),
            targetInst && targetInst !== "ALL" ? eq(holidays.institute, targetInst) : isNull(holidays.institute)
          )
        );
      }

      // 3. Background job to clean up student attendance records
      removeAttendanceForHoliday(targetDate, targetInst).catch(err => {
        console.error("Background holiday attendance cleanup failed:", err);
      });

      return NextResponse.json({ success: true, message: "Holiday removed successfully" });
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const instValue = (institute === "ALL" || !institute) ? null : institute;

    // 1. Save/Upsert holiday
    let savedHolidayId: number | null = null;
    const existing = await db.select().from(holidays).where(
      and(
        eq(holidays.date, date),
        instValue ? eq(holidays.institute, instValue) : isNull(holidays.institute)
      )
    ).limit(1);

    if (existing.length > 0) {
      savedHolidayId = existing[0].id;
      await db.update(holidays).set({ 
        title: title.trim(), 
        type: type || "FULL_DAY",
        startTime: type === "HALF_DAY" ? startTime || null : null,
        endTime: type === "HALF_DAY" ? endTime || null : null,
        updatedAt: new Date() 
      }).where(eq(holidays.id, existing[0].id));
    } else {
      const inserted = await db.insert(holidays).values({ 
        date, 
        title: title.trim(),
        type: type || "FULL_DAY",
        startTime: type === "HALF_DAY" ? startTime || null : null,
        endTime: type === "HALF_DAY" ? endTime || null : null,
        institute: instValue,
      }).returning({ id: holidays.id });
      if (inserted.length > 0) {
        savedHolidayId = inserted[0].id;
      }
    }

    // 2. Trigger background attendance sync so it doesn't block loading speed
    syncAttendanceForHoliday(date, type || "FULL_DAY", instValue).catch(err => {
      console.error("Background holiday attendance sync failed:", err);
    });

    return NextResponse.json({ success: true, message: "Holiday saved successfully", id: savedHolidayId });
  } catch (error: any) {
    console.error("Error setting holiday:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// === Background Optimization Helpers ===

async function syncAttendanceForHoliday(dateStr: string, type: string, institute: string | null) {
  const attendanceDate = new Date(dateStr);
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const day = dayNames[attendanceDate.getDay()];
  const month = monthNames[attendanceDate.getMonth()];
  const year = attendanceDate.getFullYear();
  const targetStatus = type === "HALF_DAY" ? "HD" : "H";

  // 1. Fetch matching student list
  let studentQuery = db.select({
    id: students.id,
    classId: students.classId,
  })
  .from(students)
  .innerJoin(classes, eq(students.classId, classes.id));

  let studentRows = [];
  if (institute) {
    studentRows = await studentQuery.where(eq(classes.institute, institute));
  } else {
    studentRows = await studentQuery;
  }

  if (studentRows.length === 0) return;

  const studentIds = studentRows.map(s => s.id);

  // 2. Run batch transaction for speed
  await db.transaction(async (tx) => {
    const existingRecords = await tx.select()
      .from(studentAttendance)
      .where(
        and(
          inArray(studentAttendance.studentId, studentIds),
          eq(studentAttendance.date, attendanceDate)
        )
      );

    const existingMap = new Map<number, number>();
    existingRecords.forEach(r => {
      if (r.studentId !== null && r.id !== null) {
        existingMap.set(r.studentId, r.id);
      }
    });

    const toInsert = [];
    const toUpdate = [];

    for (const student of studentRows) {
      if (!student.classId) continue;
      const existingId = existingMap.get(student.id);
      if (existingId) {
        toUpdate.push(existingId);
      } else {
        toInsert.push({
          studentId: student.id,
          classId: student.classId,
          date: attendanceDate,
          day,
          month,
          year,
          status: targetStatus
        });
      }
    }

    // Bulk update in single query
    if (toUpdate.length > 0) {
      await tx.update(studentAttendance)
        .set({ status: targetStatus })
        .where(inArray(studentAttendance.id, toUpdate));
    }

    // Bulk insert in chunks of 100
    if (toInsert.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        await tx.insert(studentAttendance).values(chunk);
      }
    }
  });
}

async function removeAttendanceForHoliday(dateStr: string, institute: string | null | undefined) {
  const attendanceDate = new Date(dateStr);
  
  if (institute) {
    const studentRows = await db.select({ id: students.id })
      .from(students)
      .innerJoin(classes, eq(students.classId, classes.id))
      .where(eq(classes.institute, institute));

    if (studentRows.length > 0) {
      const ids = studentRows.map(s => s.id);
      await db.delete(studentAttendance).where(
        and(
          eq(studentAttendance.date, attendanceDate),
          inArray(studentAttendance.status, ["H", "HD"]),
          inArray(studentAttendance.studentId, ids)
        )
      );
    }
  } else {
    await db.delete(studentAttendance).where(
      and(
        eq(studentAttendance.date, attendanceDate),
        inArray(studentAttendance.status, ["H", "HD"])
      )
    );
  }
}
