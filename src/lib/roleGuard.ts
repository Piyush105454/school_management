import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export type UserRole = "OFFICE" | "STUDENT_PARENT" | "TEACHER" | "PRINCIPAL" | "ADMIN";

/**
 * Protect a page by checking user role
 * @param allowedRoles - Array of roles allowed to access this page
 * @returns session if authorized, otherwise redirects
 */
export async function protectRoute(allowedRoles: UserRole[]) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const userRole = session.user?.role as UserRole;

  // Let PRINCIPAL and ADMIN access any page where OFFICE is allowed
  const isAllowed = 
    allowedRoles.includes(userRole) || 
    (userRole === "PRINCIPAL" && allowedRoles.includes("OFFICE")) ||
    (userRole === "ADMIN" && (allowedRoles.includes("OFFICE") || allowedRoles.includes("PRINCIPAL")));

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
