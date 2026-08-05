import { db } from "@/db";
import { activityLogs, adminProfiles, teachers } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

export type ActivityAction = "CREATE" | "UPDATE" | "DELETE" | "ADD" | "LOGIN" | "SQL" | "SYSTEM";

export interface LogActivityParams {
  userId?: string | null;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  action: ActivityAction;
  module: string;
  details: string;
}

/**
 * Logs a platform action to the activity_logs table.
 * Auto-resolves the current user session if userId/userRole are not explicitly provided.
 * Safe to call — catches all errors internally so it never breaks the caller.
 */
export async function logActivity(params: LogActivityParams) {
  try {
    let { userId, userEmail, userName, userRole } = params;

    // Auto-resolve session if not explicitly supplied
    if (!userId || !userRole) {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        userId = userId || session.user.id;
        userEmail = userEmail || session.user.email || undefined;
        userRole = userRole || (session.user as any).role;
      }
    }

    // Auto-resolve display name if not provided
    if (userId && !userName) {
      try {
        const adminProf = await db.query.adminProfiles.findFirst({
          where: eq(adminProfiles.userId, userId),
        });
        if (adminProf) {
          userName = adminProf.name;
        } else {
          const teacherProf = await db.query.teachers.findFirst({
            where: eq(teachers.userId, userId),
          });
          if (teacherProf) {
            userName = teacherProf.name;
          }
        }
      } catch {
        // Name resolution is best-effort
      }
    }

    await db.insert(activityLogs).values({
      userId: userId || null,
      userEmail: userEmail || "system",
      userName: userName || "System User",
      userRole: userRole || "SYSTEM",
      action: params.action,
      module: params.module,
      details: params.details,
    });
  } catch (error) {
    // Always silent — logging must never break the main workflow
    console.error("[logActivity] Failed to write activity log:", error);
  }
}
