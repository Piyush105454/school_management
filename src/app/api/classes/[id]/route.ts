import { NextResponse } from "next/server";
import { db } from "@/db";
import { classes, teachers } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

// PATCH /api/classes/[id] — Admin-only: rename a class and sync teacher assignments
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Only management roles can rename classes
    const ALLOWED_ROLES = ["ADMIN", "OFFICE", "PRINCIPAL"];
    if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden. Only Admin/Office/Principal can rename classes." },
        { status: 403 }
      );
    }

    const { id: idParam } = await params;
    const classId = parseInt(idParam, 10);
    if (isNaN(classId)) {
      return NextResponse.json({ error: "Invalid class ID." }, { status: 400 });
    }

    const body = await request.json();
    const newName: string | undefined = body?.newName?.trim();

    if (!newName) {
      return NextResponse.json(
        { error: "newName is required and cannot be empty." },
        { status: 400 }
      );
    }

    // 1. Fetch the existing class to get the old name
    const existingClass = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    const oldName = existingClass.name;

    // Nothing to do if the name hasn't changed
    if (oldName === newName) {
      return NextResponse.json({ success: true, newName, message: "No change needed." });
    }

    // 2. Update classes.name
    await db.update(classes).set({ name: newName }).where(eq(classes.id, classId));

    // 3. Sync teachers.classAssigned — this field stores a comma-separated list of class names (text)
    //    We need to find all teachers whose classAssigned contains the old class name and replace it
    const allTeachers = await db.query.teachers.findMany();

    const teachersToUpdate = allTeachers.filter((teacher) => {
      if (!teacher.classAssigned) return false;
      const assignedNames = teacher.classAssigned.split(",").map((c) => c.trim());
      return assignedNames.some(
        (n) =>
          n.toLowerCase() === oldName.toLowerCase() ||
          n.toLowerCase() === `class ${oldName}`.toLowerCase() ||
          `class ${n}`.toLowerCase() === oldName.toLowerCase()
      );
    });

    for (const teacher of teachersToUpdate) {
      const assignedNames = teacher.classAssigned!.split(",").map((c) => c.trim());
      const updatedNames = assignedNames.map((n) => {
        if (
          n.toLowerCase() === oldName.toLowerCase() ||
          n.toLowerCase() === `class ${oldName}`.toLowerCase() ||
          `class ${n}`.toLowerCase() === oldName.toLowerCase()
        ) {
          return newName;
        }
        return n;
      });
      await db
        .update(teachers)
        .set({ classAssigned: updatedNames.join(", ") })
        .where(eq(teachers.id, teacher.id));
    }

    return NextResponse.json({
      success: true,
      oldName,
      newName,
      teachersUpdated: teachersToUpdate.length,
      message: `Class renamed from "${oldName}" to "${newName}". ${teachersToUpdate.length} teacher assignment(s) updated.`,
    });
  } catch (error: any) {
    console.error("PATCH /api/classes/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
