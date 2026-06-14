import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { committeeMeetings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/committees/meetings?committee=<name>
export async function GET(req: NextRequest) {
  const committee = req.nextUrl.searchParams.get("committee");
  if (!committee) {
    return NextResponse.json({ error: "committee param required" }, { status: 400 });
  }
  try {
    const meetings = await db
      .select()
      .from(committeeMeetings)
      .where(eq(committeeMeetings.committeeName, committee))
      .orderBy(committeeMeetings.date);

    // Parse attendeeIds from comma-separated string to array
    const result = meetings.map((m) => ({
      ...m,
      attendeeIds: m.attendeeIds ? m.attendeeIds.split(",").filter(Boolean) : [],
    }));
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/committees/meetings – create a meeting
// body: { committee, title, date, month, time, venue, attendeeIds: string[] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { committee, title, date, month, time, venue, attendeeIds } = body;
    if (!committee || !title || !date) {
      return NextResponse.json({ error: "committee, title, date required" }, { status: 400 });
    }

    const [inserted] = await db
      .insert(committeeMeetings)
      .values({
        committeeName: committee,
        title,
        date,
        month: month || "",
        time: time || "",
        venue: venue || "",
        attendeeIds: Array.isArray(attendeeIds) ? attendeeIds.join(",") : "",
      })
      .returning();

    return NextResponse.json({
      success: true,
      meeting: {
        ...inserted,
        attendeeIds: inserted.attendeeIds ? inserted.attendeeIds.split(",").filter(Boolean) : [],
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/committees/meetings?id=<id>&committee=<name>
export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  try {
    await db.delete(committeeMeetings).where(eq(committeeMeetings.id, id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/committees/meetings – update attendees for a meeting
// body: { id, attendeeIds: string[] }
export async function PATCH(req: NextRequest) {
  try {
    const { id, attendeeIds } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    await db
      .update(committeeMeetings)
      .set({
        attendeeIds: Array.isArray(attendeeIds) ? attendeeIds.join(",") : "",
        updatedAt: new Date(),
      })
      .where(eq(committeeMeetings.id, id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
