import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sidebarPermissions } from "@/db/schema";
import { eq } from "drizzle-orm";

export type UserRole = "OFFICE" | "STUDENT_PARENT" | "TEACHER" | "PRINCIPAL" | "ADMIN";

/**
 * Protect a page by checking user role and dynamic DB permission overrides
 * @param allowedRoles - Array of roles allowed to access this page
 * @param pathname - Optional page route to check custom DB permissions overrides
 * @returns session if authorized, otherwise redirects
 */
export async function protectRoute(allowedRoles: UserRole[], pathname?: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const userRole = session.user?.role as UserRole;
  const userId = session.user?.id;

  let isAllowed = 
    allowedRoles.includes(userRole) || 
    (userRole === "PRINCIPAL" && allowedRoles.includes("OFFICE")) ||
    (userRole === "ADMIN" && (allowedRoles.includes("OFFICE") || allowedRoles.includes("PRINCIPAL")));

  // If pathname is provided, check custom database overrides
  if (pathname && userId) {
    try {
      const permissionRecords = await db
        .select()
        .from(sidebarPermissions)
        .where(eq(sidebarPermissions.userId, userId))
        .limit(1);

      if (permissionRecords && permissionRecords.length > 0) {
        const permissionRecord = permissionRecords[0];
        try {
          const parsed = JSON.parse(permissionRecord.permissions as string);
          if (parsed && parsed.items) {
            const override = parsed.items[pathname];
            if (override !== undefined) {
              isAllowed = override;
            } else {
              // Check parent prefix paths (deepest matching path first)
              const matchingKey = Object.keys(parsed.items)
                .sort((a, b) => b.length - a.length)
                .find(itemPath => pathname.startsWith(itemPath + "/"));
              if (matchingKey !== undefined) {
                isAllowed = parsed.items[matchingKey];
              }
            }
          }
        } catch (parseErr) {
          console.error("Error parsing permission JSON:", parseErr);
        }
      }
    } catch (err) {
      // Silently skip if permissions table doesn't exist or user has no overrides
      // This is not a critical error - just means no custom overrides
    }
  }

  if (!isAllowed) {
    // Redirect to appropriate dashboard based on role
    const dashboardMap: Record<UserRole, string> = {
      OFFICE: "/office/dashboard",
      STUDENT_PARENT: "/student/dashboard",
      TEACHER: "/teacher/dashboard",
      PRINCIPAL: "/office/dashboard",
      ADMIN: "/office/dashboard",
    };

    redirect(dashboardMap[userRole] || "/");
  }

  return session;
}
