import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;
    const body = await req.json();
    const { status, comments } = body;

    const existingTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId)
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Role checks
    const role = session.user.role;
    // Teachers can only update tasks assigned to them, and can't usually delete or rename official tasks.
    if (role === "TEACHER" && existingTask.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden. You can only update tasks assigned to you." }, { status: 403 });
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (comments !== undefined) updates.comments = comments;
    updates.updatedAt = new Date();

    await db.update(tasks).set(updates).where(eq(tasks.id, taskId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role === "TEACHER" || role === "STUDENT_PARENT") {
      return NextResponse.json({ error: "Forbidden. You cannot delete tasks." }, { status: 403 });
    }

    await db.delete(tasks).where(eq(tasks.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
