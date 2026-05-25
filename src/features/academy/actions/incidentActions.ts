"use server";

import { db } from "@/db";
import { incidents, teachers, classes, students, admissionMeta } from "@/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
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
    return { success: true, data };
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
      where: eq(incidents.studentId, acadStudent.id),
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
      where: eq(incidents.teacherId, teacherId),
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
