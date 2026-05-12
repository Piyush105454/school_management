import { NextResponse } from "next/server";
import { db } from "@/db";
import { classes, teachers } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, asc, and, inArray, or } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const institute = searchParams.get("institute");
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let filter = undefined;
    
    // Base filter by institute if provided
    if (institute && institute !== "ALL") {
      filter = eq(classes.institute, institute);
    }
    if (session.user.role === "TEACHER") {
      const teacherProfile = await db.query.teachers.findFirst({
        where: (t, { eq }) => eq(t.userId, session.user.id)
      });
      
      if (teacherProfile) {
        const assignedNames = teacherProfile.classAssigned 
          ? teacherProfile.classAssigned.split(",").map(c => c.trim()) 
          : [];
        
        if (assignedNames.length === 0) {
          return NextResponse.json([]);
        }

        const allPotentialNames = [
          ...assignedNames,
          ...assignedNames.map(n => `Class ${n}`),
          ...assignedNames.map(n => `CLASS ${n}`),
          ...assignedNames.map(n => n.replace(/^Class\s+/i, ""))
        ];

        const teacherFilter = and(
          teacherProfile.institute ? eq(classes.institute, teacherProfile.institute) : undefined,
          inArray(classes.name, allPotentialNames)
        );

        // Combine with existing institute filter if present
        filter = filter ? and(filter, teacherFilter) : teacherFilter;
      } else {
        return NextResponse.json([]);
      }
    }

    const data = await db
      .select()
      .from(classes)
      .where(filter)
      .orderBy(asc(classes.grade), asc(classes.name));
      
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
