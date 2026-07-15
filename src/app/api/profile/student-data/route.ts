import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { 
  users, 
  studentProfiles, 
  admissionMeta, 
  studentBio, 
  studentAddress, 
  parentGuardianDetails, 
  siblingDetails, 
  previousAcademic,
  students,
  classes 
} from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT_PARENT") {
      return NextResponse.json({ error: "Forbidden: Not a student parent" }, { status: 403 });
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.email, session.user.email)
    });

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profileRecord = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.userId, userRecord.id)
    });

    if (!profileRecord || !profileRecord.admissionMetaId) {
      return NextResponse.json({ error: "Student profile or admission meta not found" }, { status: 404 });
    }

    const admission = await db.query.admissionMeta.findFirst({
      where: eq(admissionMeta.id, profileRecord.admissionMetaId),
      with: {
        studentBio: true,
        inquiry: true
      }
    });

    if (!admission) {
      return NextResponse.json({ error: "Admission details not found" }, { status: 404 });
    }

    // Fetch related details
    const bio = admission.studentBio;
    
    const address = await db.query.studentAddress.findFirst({
      where: eq(studentAddress.admissionId, admission.id)
    });

    const parents = await db.query.parentGuardianDetails.findMany({
      where: eq(parentGuardianDetails.admissionId, admission.id)
    });

    const siblings = await db.query.siblingDetails.findMany({
      where: eq(siblingDetails.admissionId, admission.id)
    });

    const academic = await db.query.previousAcademic.findFirst({
      where: eq(previousAcademic.admissionId, admission.id)
    });

    // Academy Details
    let academyData = null;
    if (admission.entryNumber) {
      const studentAcademy = await db.query.students.findFirst({
        where: eq(students.studentId, admission.entryNumber)
      });
      if (studentAcademy && studentAcademy.classId) {
        const classInfo = await db.query.classes.findFirst({
          where: eq(classes.id, studentAcademy.classId)
        });
        academyData = {
          ...studentAcademy,
          className: classInfo?.name,
          institute: classInfo?.institute
        };
      }
    }

    return NextResponse.json({ 
      success: true,
      data: {
        user: {
          email: userRecord.email,
          phone: userRecord.phone,
          profilePictureUrl: userRecord.profilePictureUrl
        },
        admission: {
          scholarNumber: admission.scholarNumber,
          entryNumber: admission.entryNumber,
          academicYear: admission.academicYear,
          status: profileRecord.isFullyAdmitted ? 'Admitted' : 'In Process'
        },
        bio,
        address,
        parents,
        siblings,
        academic,
        academyData
      }
    });
  } catch (error) {
    console.error("Student profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch student data" },
      { status: 500 }
    );
  }
}
