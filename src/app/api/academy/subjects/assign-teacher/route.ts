import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { subjectId, teacherId } = await request.json();

    if (!subjectId) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 });
    }

    const subject = await db
      .update(subjects)
      .set({
        assignedTeacherId: teacherId || null,
      })
      .where(eq(subjects.id, subjectId));

    return NextResponse.json({ success: true, data: subject });
  } catch (error: any) {
    console.error("Error assigning teacher to subject:", error);
    return NextResponse.json(
      { error: error.message || "Failed to assign teacher" },
      { status: 500 }
    );
  }
}
