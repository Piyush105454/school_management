import { NextResponse } from "next/server";
import { db } from "@/db";
import { committeeRoles } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { roleName, canApproveAcademy, canManageTimetable } = data;

    if (!roleName) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const [inserted] = await db.insert(committeeRoles).values({
      roleName,
      canApproveAcademy: !!canApproveAcademy,
      canManageTimetable: !!canManageTimetable,
      isDefault: false
    }).returning();

    return NextResponse.json({ success: true, data: inserted });
  } catch (error: any) {
    console.error("Failed to create committee role:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
