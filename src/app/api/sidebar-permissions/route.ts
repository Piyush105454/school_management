import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sidebarPermissions } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");

    let userId = userIdParam;

    if (!userId) {
      // Fetch permissions for the logged-in user
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = session.user.id;
    }

    const permissionRecord = await db.query.sidebarPermissions.findFirst({
      where: eq(sidebarPermissions.userId, userId),
    });

    if (!permissionRecord) {
      return NextResponse.json({ permissions: {} });
    }

    try {
      const parsed = JSON.parse(permissionRecord.permissions);
      return NextResponse.json({ permissions: parsed });
    } catch {
      return NextResponse.json({ permissions: {} });
    }
  } catch (error: any) {
    console.error("Error in GET sidebar-permissions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Direct manual control is restricted to office and principal roles
    const userRole = (session.user.role as string || "").toUpperCase();
    if (userRole !== "OFFICE" && userRole !== "PRINCIPAL") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, permissions } = body;

    if (!userId || permissions === undefined) {
      return NextResponse.json({ error: "Missing userId or permissions" }, { status: 400 });
    }

    const permissionsString = typeof permissions === "string" ? permissions : JSON.stringify(permissions);

    const existing = await db.query.sidebarPermissions.findFirst({
      where: eq(sidebarPermissions.userId, userId),
    });

    if (existing) {
      await db
        .update(sidebarPermissions)
        .set({ permissions: permissionsString, updatedAt: new Date() })
        .where(eq(sidebarPermissions.userId, userId));
    } else {
      await db.insert(sidebarPermissions).values({
        userId,
        permissions: permissionsString,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in POST sidebar-permissions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
