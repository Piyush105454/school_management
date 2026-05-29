import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transportStudents, students, transportBuses, classes } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch active assignments with fully joined details
    const assignmentsList = await db
      .select({
        id: transportStudents.id,
        studentId: transportStudents.studentId,
        studentName: students.name,
        scholarNumber: students.scholarNumber,
        className: classes.name,
        busId: transportStudents.busId,
        busName: transportBuses.busName,
        routeStop: transportStudents.routeStop,
        locationName: transportStudents.locationName,
        latitude: transportStudents.latitude,
        longitude: transportStudents.longitude,
      })
      .from(transportStudents)
      .innerJoin(students, eq(transportStudents.studentId, students.id))
      .innerJoin(classes, eq(students.classId, classes.id))
      .innerJoin(transportBuses, eq(transportStudents.busId, transportBuses.id))
      .orderBy(students.name);

    // 2. Fetch students who are not assigned to any bus yet
    const unassignedList = await db
      .select({
        id: students.id,
        name: students.name,
        scholarNumber: students.scholarNumber,
        className: classes.name,
      })
      .from(students)
      .innerJoin(classes, eq(students.classId, classes.id))
      .leftJoin(transportStudents, eq(students.id, transportStudents.studentId))
      .where(isNull(transportStudents.id))
      .orderBy(students.name);

    return NextResponse.json({
      success: true,
      assignments: assignmentsList,
      unassigned: unassignedList,
    });
  } catch (error: any) {
    console.error("Error fetching transport students:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, busId, routeStop, locationName, latitude, longitude } = body;

    if (!studentId || !busId || !routeStop) {
      return NextResponse.json({ error: "Missing required fields (studentId, busId, routeStop)" }, { status: 400 });
    }

    const sId = parseInt(studentId);
    const bId = parseInt(busId);

    // Check if the student is already assigned to a transport
    const existing = await db
      .select()
      .from(transportStudents)
      .where(eq(transportStudents.studentId, sId))
      .limit(1);

    const payload = {
      studentId: sId,
      busId: bId,
      routeStop,
      locationName: locationName || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      // Update existing mapping
      await db
        .update(transportStudents)
        .set(payload)
        .where(eq(transportStudents.id, existing[0].id));

      return NextResponse.json({ success: true, message: "Student transport updated successfully" });
    } else {
      // Create new mapping
      await db.insert(transportStudents).values({
        ...payload,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, message: "Student assigned to transport successfully" });
    }
  } catch (error: any) {
    console.error("Error saving student transport assignment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
