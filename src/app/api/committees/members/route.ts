import { NextResponse } from "next/server";
import { db } from "@/db";
import { committeeMembers } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { teacherId, committeeName, roleId } = data;

    if (!teacherId || !committeeName) {
      return NextResponse.json({ error: "teacherId and committeeName are required" }, { status: 400 });
    }

    const [inserted] = await db.insert(committeeMembers).values({
      teacherId,
      committeeName,
      roleId: roleId || null

    }).returning();

    return NextResponse.json({ success: true, data: inserted });
  } catch (error: any) {
    console.error("Failed to add committee member mapping:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const teacherId = url.searchParams.get("teacherId");
    const committeeName = url.searchParams.get("committeeName");

    if (!teacherId || !committeeName) {
      return NextResponse.json({ error: "teacherId and committeeName are required" }, { status: 400 });
    }

    await db.delete(committeeMembers)
      .where(and(eq(committeeMembers.teacherId, teacherId), eq(committeeMembers.committeeName, committeeName)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete committee member mapping:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
