import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, priority, assignedToId, projectId, institute, classId, studentId, dueDate } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Role check: Teachers might be restricted from assigning to others, but we'll allow basic creation for now
    
    await db.insert(tasks).values({
      title,
      description: description || null,
      priority: priority || "MEDIUM",
      assignedById: session.user.id,
      assignedToId: assignedToId || null,
      projectId: projectId || null,
      institute: institute || null,
      classId: classId ? parseInt(classId) : null,
      studentId: studentId ? parseInt(studentId) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: "TO_DO",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    let whereClause = undefined;

    // Role-based visibility
    if (role === "TEACHER") {
      whereClause = eq(tasks.assignedToId, session.user.id);
    } else if (role === "OFFICE" && session.user.institute) {
      // Coordinator sees tasks for their institute OR tasks assigned to them
      whereClause = or(
        eq(tasks.institute, session.user.institute),
        eq(tasks.assignedToId, session.user.id)
      );
    }
    // ADMIN and PRINCIPAL see all (whereClause remains undefined)

    const allTasks = await db.query.tasks.findMany({
      where: whereClause,
      with: {
        assignedTo: {
          columns: { email: true, role: true }
        },
        assignedBy: {
          columns: { email: true }
        },
        project: {
          columns: { name: true }
        }
      },
      orderBy: (tasks, { desc }) => [desc(tasks.createdAt)]
    });

    return NextResponse.json({ tasks: allTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
