import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { overallAttendance } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = parseInt(searchParams.get("year") || "0");

    if (!month || !year) {
      return NextResponse.json({ error: "Missing month or year" }, { status: 400 });
    }

    const data = await db.select()
      .from(overallAttendance)
      .where(
        and(
          eq(overallAttendance.month, month),
          eq(overallAttendance.year, year)
        )
      )
      .orderBy(overallAttendance.date);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
