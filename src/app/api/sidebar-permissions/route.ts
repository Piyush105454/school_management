import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sidebarPermissions, users, students, studentProfiles, admissionMeta } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

function getDefaultPermissions(role: string) {
  if (role === "TEACHER") {
    return {
      sections: {
        "Admissions": true,
        "Academy Management": true,
        "Incident Management": true,
        "Scholarship": true,
        "Reports": true
      },
      items: {
        "/teacher/dashboard": true,
        "/office/academy-management/classes": true,
        "/office/academy-management/attendance": true,
        "/office/academy-management/lesson-plan": true,
        "/office/academy-management/homework": true,
        "/office/academy-management/lesson-plan/review": true,
        "/teacher/incident-management": true,
        "/office/inquiries": true,
        "/office/admissions-progress": true,
        "/office/document-verification": true,
        "/office/entrance-tests": true,
        "/office/home-visits": true,
        "/teacher/scholarship-criteria": true,
        "/office/scholarship/reports": true,
        "/office/scholarship/reports/students": true
      }
    };
  }
  
  if (role === "STUDENT_PARENT") {
    return {
      sections: {
        "Admissions": true,
        "Scholarship": true,
        "Academy Management": true,
        "Leave Management": true,
        "Incident Management": true
      },
      items: {
        "/student/dashboard": true,
        "/student/admission": true,
        "/student/admission?step=10": true,
        "/student/entrance-test": true,
        "/student/home-visit": true,
        "/student/scholarship": true,
        "/student/incident-management": true,
        "/student/homework": true,
        "/student/attendance": true,
        "/student/leave": true
      }
    };
  }

  // DEFAULT FOR OFFICE, PRINCIPAL, ADMIN
  return {
    sections: {
      "Admissions": true,
      "Scholarship": true,
      "Academy Management": true,
      "Leave Management": true,
      "Lab, Library & Resource Management": true,
      "Incident Management": true,
      "School Health Program": true,
      "Time Table Management": true,
      "Transport Management": true,
      "People Management": true,
      "Access Module Management": true,
      "Committee Management": true,
      "Reports": true
    },
    items: {
      "/office/dashboard": true,
      "/office/inquiries": true,
      "/office/admissions-progress": true,
      "/office/document-verification": true,
      "/office/entrance-tests": true,
      "/office/home-visits": true,
      "/office/final-admissions": true,
      "/office/scholarship/award": true,
      "/office/scholarship/students": true,
      "/office/scholarship/reports": true,
      "/office/scholarship/reports/students": true,
      "/office/scholarship/settings": true,
      "/office/academy-management/attendance": true,
      "/office/academy-management/classes": true,
      "/office/academy-management/lesson-plan": true,
      "/office/academy-management/lesson-plan/review": true,
      "/office/academy-management/homework": true,
      "/office/academy-management/exams": true,
      "/office/academy-management/leaves": true,
      "/office/academy-management/library": true,
      "/office/labs": true,
      "/office/leaver-management/tc": true,
      "/office/incident-management": true,
      "/office/school-health/dashboard": true,
      "/office/school-health/records": true,
      "/office/school-health/daily-check": true,
      "/office/school-health/wellness": true,
      "/office/school-health/settings": true,
      "/office/timetable": true,
      "/office/transport/students": true,
      "/office/admin-management": true,
      "/office/school-management/teachers": true,
      "/office/school-management/principal": true,
      "/office/access-management": true,
      "/office/committees": true
    }
  };
}

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

    // Return default/saved permissions when configuring bulk group options or multiselected users
    if (
      userId === "ALL_STUDENTS" || 
      userId === "ALL_TEACHERS" || 
      userId === "ALL_PRINCIPALS" || 
      userId === "ALL_OFFICE" || 
      userId === "ALL_ADMINS" || 
      userId.startsWith("ALL_CLASS_") ||
      userId.includes(",")
    ) {
      let role = "STUDENT_PARENT";
      if (userId === "ALL_TEACHERS") role = "TEACHER";
      if (userId === "ALL_PRINCIPALS") role = "PRINCIPAL";
      if (userId === "ALL_OFFICE") role = "OFFICE";
      if (userId === "ALL_ADMINS") role = "ADMIN";

      // 1. Resolve targeted user IDs in this bulk group
      let groupUserIds: string[] = [];

      if (userId.includes(",")) {
        groupUserIds = userId.split(",").filter(Boolean);
      } else if (userId === "ALL_STUDENTS") {
        const studentUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, "STUDENT_PARENT"));
        groupUserIds = studentUsers.map(u => u.id);
      } else if (userId === "ALL_TEACHERS") {
        const teacherUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, "TEACHER"));
        groupUserIds = teacherUsers.map(u => u.id);
      } else if (userId === "ALL_PRINCIPALS") {
        const principalUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, "PRINCIPAL"));
        groupUserIds = principalUsers.map(u => u.id);
      } else if (userId === "ALL_OFFICE") {
        const officeUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, "OFFICE"));
        groupUserIds = officeUsers.map(u => u.id);
      } else if (userId === "ALL_ADMINS") {
        const adminUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, "ADMIN"));
        groupUserIds = adminUsers.map(u => u.id);
      } else if (userId.startsWith("ALL_CLASS_")) {
        const classId = parseInt(userId.replace("ALL_CLASS_", ""));
        if (!isNaN(classId)) {
          const studentList = await db
            .select({
              userId: studentProfiles.userId,
            })
            .from(students)
            .innerJoin(admissionMeta, eq(students.studentId, admissionMeta.entryNumber))
            .innerJoin(studentProfiles, eq(admissionMeta.id, studentProfiles.admissionMetaId))
            .where(eq(students.classId, classId));
          groupUserIds = studentList.map(s => s.userId).filter(Boolean) as string[];
        }
      }

      // 2. Query saved override of the first user in this group to read current active state
      if (groupUserIds.length > 0) {
        const firstRecord = await db.query.sidebarPermissions.findFirst({
          where: inArray(sidebarPermissions.userId, groupUserIds),
        });

        if (firstRecord) {
          try {
            const parsed = JSON.parse(firstRecord.permissions);
            return NextResponse.json({ permissions: parsed });
          } catch {}
        }
      }
      
      // Fallback if no records have been saved yet
      return NextResponse.json({ permissions: getDefaultPermissions(role) });
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
      return new NextResponse("Unauthorized", { status: 401 });
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

    // Resolve the list of user IDs to update
    let targetUserIds: string[] = [];

    if (userId.includes(",")) {
      targetUserIds = userId.split(",").filter(Boolean);
    } else if (userId === "ALL_STUDENTS") {
      const studentUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "STUDENT_PARENT"));
      targetUserIds = studentUsers.map(u => u.id);
    } else if (userId === "ALL_TEACHERS") {
      const teacherUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "TEACHER"));
      targetUserIds = teacherUsers.map(u => u.id);
    } else if (userId === "ALL_PRINCIPALS") {
      const principalUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "PRINCIPAL"));
      targetUserIds = principalUsers.map(u => u.id);
    } else if (userId === "ALL_OFFICE") {
      const officeUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "OFFICE"));
      targetUserIds = officeUsers.map(u => u.id);
    } else if (userId === "ALL_ADMINS") {
      const adminUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "ADMIN"));
      targetUserIds = adminUsers.map(u => u.id);
    } else if (userId.startsWith("ALL_CLASS_")) {
      const classId = parseInt(userId.replace("ALL_CLASS_", ""));
      if (isNaN(classId)) {
        return NextResponse.json({ error: "Invalid classId in bulk request" }, { status: 400 });
      }

      const studentList = await db
        .select({
          userId: studentProfiles.userId,
        })
        .from(students)
        .innerJoin(admissionMeta, eq(students.studentId, admissionMeta.entryNumber))
        .innerJoin(studentProfiles, eq(admissionMeta.id, studentProfiles.admissionMetaId))
        .where(eq(students.classId, classId));
      
      targetUserIds = studentList.map(s => s.userId).filter(Boolean) as string[];
    } else {
      targetUserIds = [userId];
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No target users found to update." });
    }

    // Update target users' custom overrides in database using high-performance bulk operations
    // 1. Delete all existing records for the targets in a single fast query
    await db
      .delete(sidebarPermissions)
      .where(inArray(sidebarPermissions.userId, targetUserIds));

    // 2. Perform bulk insert in a single fast query
    const insertChunks = targetUserIds.map((targetId) => ({
      userId: targetId,
      permissions: permissionsString,
    }));

    await db.insert(sidebarPermissions).values(insertChunks);

    return NextResponse.json({ success: true, count: targetUserIds.length });
  } catch (error: any) {
    console.error("Error in POST sidebar-permissions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
