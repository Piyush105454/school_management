import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { holidays } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db.select().from(holidays).orderBy(holidays.date);
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

    const { date, title, action, type, startTime, endTime } = await req.json();

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    if (action === "delete") {
      await db.delete(holidays).where(eq(holidays.date, date));
      return NextResponse.json({ success: true, message: "Holiday removed successfully" });
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Upsert logic
    const existing = await db.select().from(holidays).where(eq(holidays.date, date)).limit(1);
    if (existing.length > 0) {
      await db.update(holidays).set({ 
        title: title.trim(), 
        type: type || "FULL_DAY",
        startTime: type === "HALF_DAY" ? startTime || null : null,
        endTime: type === "HALF_DAY" ? endTime || null : null,
        updatedAt: new Date() 
      }).where(eq(holidays.date, date));
    } else {
      await db.insert(holidays).values({ 
        date, 
        title: title.trim(),
        type: type || "FULL_DAY",
        startTime: type === "HALF_DAY" ? startTime || null : null,
        endTime: type === "HALF_DAY" ? endTime || null : null,
      });
    }

    return NextResponse.json({ success: true, message: "Holiday saved successfully" });
  } catch (error: any) {
    console.error("Error setting holiday:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
