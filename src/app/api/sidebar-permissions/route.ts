import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sidebarPermissions, users, teachers, students, studentProfiles, admissionMeta } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

const isValidUUID = (str: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ permissions: { sections: {}, items: {} } }, { status: 200 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || session.user.id;

    if (!isValidUUID(targetUserId)) {
      // Return empty configuration for batch groups in GET to prevent UUID type errors
      return NextResponse.json({ permissions: { sections: {}, items: {} } }, { status: 200 });
    }

    const record = await db.query.sidebarPermissions.findFirst({
      where: eq(sidebarPermissions.userId, targetUserId)
    });

    if (record) {
      try {
        const parsed = JSON.parse(record.permissions);
        return NextResponse.json({ permissions: parsed }, { status: 200 });
      } catch (e) {
        console.error("Error parsing sidebar permissions:", e);
      }
    }

    return NextResponse.json({ permissions: { sections: {}, items: {} } }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching sidebar permissions:", error);
    return NextResponse.json({ permissions: { sections: {}, items: {} } }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OFFICE" && session.user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, permissions } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const permissionsStr = JSON.stringify(permissions);

    // Helper to save permissions for a specific user ID
    const saveForUser = async (uId: string) => {
      if (!isValidUUID(uId)) return;
      const existing = await db.query.sidebarPermissions.findFirst({
        where: eq(sidebarPermissions.userId, uId)
      });
      if (existing) {
        await db.update(sidebarPermissions)
          .set({ permissions: permissionsStr, updatedAt: new Date() })
          .where(eq(sidebarPermissions.id, existing.id));
      } else {
        await db.insert(sidebarPermissions)
          .values({
            userId: uId,
            permissions: permissionsStr
          });
      }
    };

    // Handle batch operations or single user save
    if (userId === "ALL_TEACHERS") {
      const teacherUsers = await db
        .select({ userId: users.id })
        .from(users)
        .where(eq(users.role, "TEACHER"));
      for (const t of teacherUsers) {
        if (t.userId) await saveForUser(t.userId);
      }

      const teacherList = await db
        .select({ userId: teachers.userId })
        .from(teachers)
        .where(isNotNull(teachers.userId));
      for (const t of teacherList) {
        if (t.userId) await saveForUser(t.userId);
      }
    } else if (userId === "ALL_PRINCIPALS") {
      const principalList = await db
        .select({ userId: users.id })
        .from(users)
        .where(eq(users.role, "PRINCIPAL"));
      for (const p of principalList) {
        await saveForUser(p.userId);
      }
    } else if (userId === "ALL_OFFICE") {
      const officeList = await db
        .select({ userId: users.id })
        .from(users)
        .where(eq(users.role, "OFFICE"));
      for (const o of officeList) {
        await saveForUser(o.userId);
      }
    } else if (userId === "ALL_ADMINS") {
      const adminList = await db
        .select({ userId: users.id })
        .from(users)
        .where(eq(users.role, "ADMIN"));
      for (const a of adminList) {
        await saveForUser(a.userId);
      }
    } else if (userId === "ALL_STUDENTS") {
      const studentList = await db
        .select({ userId: studentProfiles.userId })
        .from(studentProfiles)
        .where(isNotNull(studentProfiles.userId));
      for (const s of studentList) {
        if (s.userId) await saveForUser(s.userId);
      }
    } else if (userId.startsWith("ALL_CLASS_")) {
      const classId = parseInt(userId.replace("ALL_CLASS_", ""));
      if (!isNaN(classId)) {
        const studentList = await db
          .select({ userId: studentProfiles.userId })
          .from(students)
          .innerJoin(admissionMeta, eq(students.studentId, admissionMeta.entryNumber))
          .innerJoin(studentProfiles, eq(admissionMeta.id, studentProfiles.admissionMetaId))
          .where(and(eq(students.classId, classId), isNotNull(studentProfiles.userId)));
        for (const s of studentList) {
          if (s.userId) await saveForUser(s.userId);
        }
      }
    } else {
      // Individual user UUID
      await saveForUser(userId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving sidebar permissions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
