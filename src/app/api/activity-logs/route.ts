import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { desc, ilike, eq, and, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Strict access control: only OFFICE and ADMIN roles allowed
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "OFFICE" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin and Office access only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const moduleFilter = searchParams.get("module")?.trim() || "";
    const actionFilter = searchParams.get("action")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    // Build dynamic filters
    const filters: any[] = [];

    if (search) {
      filters.push(
        or(
          ilike(activityLogs.details, `%${search}%`),
          ilike(activityLogs.userName, `%${search}%`),
          ilike(activityLogs.userEmail, `%${search}%`)
        )
      );
    }

    if (moduleFilter && moduleFilter !== "All Modules") {
      filters.push(eq(activityLogs.module, moduleFilter));
    }

    if (actionFilter && actionFilter !== "All Actions") {
      filters.push(eq(activityLogs.action, actionFilter));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const logs = await db
      .select()
      .from(activityLogs)
      .where(whereClause)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);

    return NextResponse.json({ logs, total: logs.length }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
