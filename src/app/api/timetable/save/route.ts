import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { timetable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { dayOfWeek, entries } = await req.json();

    if (!dayOfWeek || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: "dayOfWeek and entries array are required" },
        { status: 400 }
      );
    }

    // Transactionally update the timetable for the given day
    await db.transaction(async (tx) => {
      // 1. Delete all existing entries for this day of the week
      await tx.delete(timetable).where(eq(timetable.dayOfWeek, dayOfWeek));

      // 2. Insert new entries if any exist
      if (entries.length > 0) {
        const insertPayload = entries.map((entry: any) => ({
          dayOfWeek,
          classId: entry.classId ? parseInt(entry.classId) : null,
          className: entry.className,
          periodName: entry.periodName,
          startTime: entry.startTime,
          endTime: entry.endTime,
          subjectId: entry.subjectId && String(entry.subjectId) !== "CUSTOM" ? parseInt(entry.subjectId) : null,
          customSubject: entry.customSubject || null,
          teacherId: entry.teacherId && entry.teacherId !== "CUSTOM" ? entry.teacherId : null,
          customTeacher: entry.customTeacher || null,
        }));

        await tx.insert(timetable).values(insertPayload);
      }
    });

    return NextResponse.json({
      success: true,
      message: `Timetable for ${dayOfWeek} saved successfully`,
    });
  } catch (error: any) {
    console.error("Error saving timetable:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
