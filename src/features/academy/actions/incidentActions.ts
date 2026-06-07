"use server";

import { db } from "@/db";
import { incidents, teachers, classes, students, admissionMeta } from "@/db/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateIncidentInput {
  title: string;
  type: "INCIDENT" | "COMPLAIN" | "FEEDBACK";
  note: string;
  category: string;
  priority: string;
  status: string;
  classId?: number | null;
  studentId?: number | null;
  teacherId?: string | null;
  studentIds?: string | null;
  teacherIds?: string | null;
}

// Fetch all logged items (Incidents, Complaints, Feedbacks) with relational joins
export async function getIncidentsAction() {
  try {
    const data = await db.query.incidents.findMany({
      orderBy: [desc(incidents.createdAt)],
      with: {
        class: true,
        student: true,
        teacher: true,
      }
    });

    // Hydrate multiple student and teacher records
    const allTeachers = await db.select().from(teachers);
    const allStudents = await db.select().from(students);

    const hydratedData = data.map((incident) => {
      let taggedTeachers: typeof teachers.$inferSelect[] = [];
      let taggedStudents: typeof students.$inferSelect[] = [];

      if (incident.teacherIds) {
        try {
          const ids: string[] = JSON.parse(incident.teacherIds);
          taggedTeachers = allTeachers.filter((t) => ids.includes(t.id));
        } catch (e) {
          if (incident.teacher) taggedTeachers = [incident.teacher];
        }
      } else if (incident.teacher) {
        taggedTeachers = [incident.teacher];
      }

      if (incident.studentIds) {
        try {
          const ids: number[] = JSON.parse(incident.studentIds);
          taggedStudents = allStudents.filter((s) => ids.includes(s.id));
        } catch (e) {
          if (incident.student) taggedStudents = [incident.student];
        }
      } else if (incident.student) {
        taggedStudents = [incident.student];
      }

      return {
        ...incident,
        taggedTeachers,
        taggedStudents,
      };
    });

    return { success: true, data: hydratedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Fetch metadata for dropdown selection (Teachers & Classes)
export async function getIncidentMetadataAction() {
  try {
    const allClasses = await db.select().from(classes).orderBy(classes.name);
    const allTeachers = await db.select().from(teachers).orderBy(teachers.name);
    return { success: true, classes: allClasses, teachers: allTeachers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Dynamically fetch students belonging to a specific class
export async function getStudentsByClassAction(classId: number) {
  try {
    const classStudents = await db
      .select()
      .from(students)
      .where(eq(students.classId, classId))
      .orderBy(students.name);
    return { success: true, students: classStudents };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Insert a new incident record into the database
export async function createIncidentAction(input: CreateIncidentInput) {
  try {
    if (!input.title || !input.type || !input.note) {
      throw new Error("Missing required fields (Title, Type, Note)");
    }

    const [newRecord] = await db
      .insert(incidents)
      .values({
        title: input.title,
        type: input.type,
        note: input.note,
        category: input.category || "General",
        priority: input.priority || "Medium",
        status: input.status || "Open",
        classId: input.classId || null,
        studentId: input.studentId || null,
        teacherId: input.teacherId || null,
        studentIds: input.studentIds || null,
        teacherIds: input.teacherIds || null,
      })
      .returning();

    revalidatePath("/office/incident-management");
    // Also revalidate the profile paths just in case
    if (input.studentId) {
      revalidatePath(`/office/scholarship/students/${input.studentId}`);
    }
    if (input.teacherId) {
      revalidatePath(`/office/school-management/teachers`);
    }

    return { success: true, record: newRecord };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Resolve academic student metadata for the student role
export async function getStudentMetadataByAdmissionIdAction(admissionId: string) {
  try {
    const meta = await db.query.admissionMeta.findFirst({
      where: eq(admissionMeta.id, admissionId)
    });

    if (!meta) return { success: false, error: "Admission profile not found" };

    const acadStudent = await db.query.students.findFirst({
      where: or(
        eq(students.studentId, meta.scholarNumber || ""),
        eq(students.studentId, meta.admissionNumber || ""),
        eq(students.studentId, meta.entryNumber || "")
      ),
      with: {
        class: true
      }
    });

    if (!acadStudent) return { success: false, error: "Academic student profile not found" };

    return { 
      success: true, 
      studentId: acadStudent.id, 
      classId: acadStudent.classId,
      className: acadStudent.class?.name || ""
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Fetch logged incidents/complaints/feedbacks for a specific student's profile page
export async function getStudentIncidentsAction(admissionId: string) {
  try {
    const meta = await db.query.admissionMeta.findFirst({
      where: eq(admissionMeta.id, admissionId)
    });

    if (!meta) return { success: true, data: [] };

    // Resolve academic student record using admission numbers
    const acadStudent = await db.query.students.findFirst({
      where: or(
        eq(students.studentId, meta.scholarNumber || ""),
        eq(students.studentId, meta.admissionNumber || ""),
        eq(students.studentId, meta.entryNumber || "")
      )
    });

    if (!acadStudent) return { success: true, data: [] };

    const data = await db.query.incidents.findMany({
      where: or(
        eq(incidents.studentId, acadStudent.id),
        sql`${incidents.studentIds}::jsonb @> ${JSON.stringify([acadStudent.id])}::jsonb`
      ),
      orderBy: [desc(incidents.createdAt)],
      with: {
        teacher: true,
        class: true
      }
    });

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Fetch logged incidents/complaints/feedbacks for a specific teacher's profile row
export async function getTeacherIncidentsAction(teacherId: string) {
  try {
    const data = await db.query.incidents.findMany({
      where: or(
        eq(incidents.teacherId, teacherId),
        sql`${incidents.teacherIds}::jsonb @> ${JSON.stringify([teacherId])}::jsonb`
      ),
      orderBy: [desc(incidents.createdAt)],
      with: {
        student: true,
        class: true
      }
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete an incident/complaint/feedback record from the database
export async function deleteIncidentAction(id: string) {
  try {
    const [deletedRecord] = await db
      .delete(incidents)
      .where(eq(incidents.id, id))
      .returning();

    if (!deletedRecord) {
      throw new Error("Record not found or already deleted");
    }

    revalidatePath("/office/incident-management");
    // Also revalidate student and teacher profile views
    if (deletedRecord.studentId) {
      revalidatePath(`/office/scholarship/students/${deletedRecord.studentId}`);
    }
    if (deletedRecord.teacherId) {
      revalidatePath(`/office/school-management/teachers`);
    }

    return { success: true, record: deletedRecord };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update incident status (e.g. Open, Pending, Teacher Approved, Principal Approved, Closed)
export async function updateIncidentStatusAction(id: string, status: string) {
  try {
    const [updated] = await db
      .update(incidents)
      .set({ status, updatedAt: new Date() })
      .where(eq(incidents.id, id))
      .returning();

    if (!updated) {
      throw new Error("Incident not found");
    }

    revalidatePath("/office/incident-management");
    return { success: true, record: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
