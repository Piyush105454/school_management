import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transportBuses } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const list = await db.select().from(transportBuses).orderBy(transportBuses.busName);
    return NextResponse.json({ success: true, buses: list });
  } catch (error: any) {
    console.error("Error fetching buses:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, busName, timingMorning, timingEvening, capacity, routes } = body;

    if (!busName || !timingMorning || !timingEvening) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payload = {
      busName,
      timingMorning,
      timingEvening,
      capacity: capacity ? parseInt(capacity) : 40,
      routes: typeof routes === "string" ? routes : JSON.stringify(routes || []),
      updatedAt: new Date(),
    };

    if (id) {
      // Update existing bus
      await db
        .update(transportBuses)
        .set(payload)
        .where(eq(transportBuses.id, parseInt(id)));

      return NextResponse.json({ success: true, message: "Bus updated successfully" });
    } else {
      // Insert new bus
      await db.insert(transportBuses).values({
        ...payload,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, message: "Bus created successfully" });
    }
  } catch (error: any) {
    console.error("Error saving bus:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
