import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role === "TEACHER" || role === "STUDENT_PARENT") {
      return NextResponse.json({ error: "Forbidden. Only admins and coordinators can create projects." }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, dueDate } = body;

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    await db.insert(projects).values({
      name,
      description: description || null,
      managerId: session.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: "ACTIVE",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allProjects = await db.query.projects.findMany({
      with: {
        manager: {
          columns: { email: true, role: true }
        },
        tasks: {
          columns: { id: true, status: true }
        }
      },
      orderBy: (projects, { desc }) => [desc(projects.createdAt)]
    });

    // Calculate progress for each project
    const projectsWithProgress = allProjects.map(p => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter(t => t.status === "COMPLETED").length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        ...p,
        totalTasks,
        completedTasks,
        progress
      };
    });

    return NextResponse.json({ projects: projectsWithProgress });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
