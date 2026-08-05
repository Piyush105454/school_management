import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { schoolEvents, schoolEventOwners, schoolEventMilestones } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const isTeam = ["ADMIN", "OFFICE", "PRINCIPAL", "TEACHER"].includes(role);

    // Fetch all events along with their owners and milestones
    const events = await db.query.schoolEvents.findMany({
      with: {
        owners: {
          with: {
            teacher: true
          }
        },
        milestones: true
      },
      orderBy: (se, { desc }) => [desc(se.createdAt)]
    });

    // If caller is NOT team, strip out milestones and owners
    const formattedEvents = events.map(event => {
      if (!isTeam) {
        return {
          id: event.id,
          title: event.title,
          detail: event.detail,
          meetLink: event.meetLink,
          date: event.date,
          createdAt: event.createdAt,
          owners: [],
          milestones: []
        };
      }
      return {
        ...event,
        owners: event.owners.map(o => o.teacher)
      };
    });

    return NextResponse.json({ success: true, data: formattedEvents });
  } catch (error: any) {
    console.error("GET events error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const isTeam = ["ADMIN", "OFFICE", "PRINCIPAL", "TEACHER"].includes(role);
    if (!isTeam) {
      return NextResponse.json({ success: false, error: "Forbidden: Only staff can manage events" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "DELETE") {
      const { eventId } = body;
      if (!eventId) {
        return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
      }

      await db.delete(schoolEvents).where(eq(schoolEvents.id, eventId));
      return NextResponse.json({ success: true, message: "Event deleted successfully" });
    }

    // CREATE ACTION
    const { title, detail, date, meetLink, owners, milestones } = body;
    if (!title || !date) {
      return NextResponse.json({ success: false, error: "Title and Date are required" }, { status: 400 });
    }

    // Wrap in db transaction
    const result = await db.transaction(async (tx) => {
      // 1. Insert school event
      const [newEvent] = await tx.insert(schoolEvents).values({
        title,
        detail: detail || null,
        date,
        meetLink: meetLink || null,
      }).returning();

      // 2. Insert owners (teachers) if selected
      if (owners && Array.isArray(owners) && owners.length > 0) {
        const ownerValues = owners.map((teacherId: string) => ({
          eventId: newEvent.id,
          teacherId,
        }));
        await tx.insert(schoolEventOwners).values(ownerValues);
      }

      // 3. Insert milestones if added
      if (milestones && Array.isArray(milestones) && milestones.length > 0) {
        const milestoneValues = milestones.map((ms: { title: string; date: string }) => ({
          eventId: newEvent.id,
          title: ms.title,
          date: ms.date,
        }));
        await tx.insert(schoolEventMilestones).values(milestoneValues);
      }

      return newEvent;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("POST events error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
