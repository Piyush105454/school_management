"use client";

export type UserRole = "OFFICE" | "STUDENT_PARENT" | "TEACHER";

/**
 * Check if user has a specific role (for client-side checks)
 * This is a pure utility function - no server dependencies
 */
export function hasRole(userRole: string | undefined, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole as UserRole);
}

/**
 * Get the dashboard URL for a user role
 * This is a pure utility function - no server dependencies
 */
export function getDashboardUrl(role: UserRole): string {
  const dashboardMap: Record<UserRole, string> = {
    OFFICE: "/office/dashboard",
    STUDENT_PARENT: "/student/dashboard",
    TEACHER: "/teacher/dashboard",
  };
  return dashboardMap[role] || "/";
}
