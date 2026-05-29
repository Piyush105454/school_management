import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { studentProfiles, students, transportStudents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT_PARENT") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { latitude, longitude, locationName } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 });
    }

    // 1. Resolve student profile
    const profile = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.userId, session.user.id),
      with: {
        admissionMeta: true,
      },
    });

    if (!profile || !profile.admissionMeta) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // 2. Resolve students record (academic student)
    const studentRecord = await db.query.students.findFirst({
      where: eq(students.studentId, profile.admissionMeta.entryNumber),
    });

    if (!studentRecord) {
      return NextResponse.json({ error: "Academic student record not found" }, { status: 404 });
    }

    // 3. Verify transport assignment
    const assigned = await db
      .select()
      .from(transportStudents)
      .where(eq(transportStudents.studentId, studentRecord.id))
      .limit(1);

    if (assigned.length === 0) {
      return NextResponse.json({
        error: "You are not currently assigned to any school transport routes. Please ask the school office to assign you first.",
      }, { status: 400 });
    }

    // 4. Update the coordinates and location text
    await db
      .update(transportStudents)
      .set({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        locationName: locationName || "Pinned Home Location",
        updatedAt: new Date(),
      })
      .where(eq(transportStudents.id, assigned[0].id));

    return NextResponse.json({
      success: true,
      message: "Your pick-up location has been registered successfully!",
    });
  } catch (error: any) {
    console.error("Error setting student location:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
