import { NextResponse } from "next/server";
import { db } from "@/db";
import { committeeRoles, committeeMembers } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const roleId = parseInt(id, 10);
    if (isNaN(roleId)) {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 });
    }

    // Check if the role is a default role
    const existingRole = await db.select().from(committeeRoles).where(eq(committeeRoles.id, roleId)).limit(1);
    if (existingRole.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    if (existingRole[0].isDefault) {
      return NextResponse.json({ error: "Cannot delete default roles" }, { status: 403 });
    }

    // The committee_members table has ON DELETE SET NULL for role_id
    // So deleting the role will just revert those members to a "Member" role (null role_id)
    await db.delete(committeeRoles).where(eq(committeeRoles.id, roleId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete committee role:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
