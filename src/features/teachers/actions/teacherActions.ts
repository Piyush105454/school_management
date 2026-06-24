"use server";

import { db } from "@/db";
import { teachers, subjects, timetable, classes } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import bcrypt from "bcryptjs";
import { users } from "@/db/schema";

export async function getTeachers() {
  try {
    const data = await db.select().from(teachers).orderBy(teachers.name);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncTeacherSpecializationsToSubjects(teacherId: string, specializationString: string | null, institute: string) {
  try {
    if (!institute) return { success: true };
    
    // 1. Parse new specializations
    const newSpecs = specializationString
      ? specializationString.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
      : [];
      
    // 2. Fetch all subjects where this teacher is currently Reviewer 1 or Reviewer 2
    const currentReviewedSubjects = await db.query.subjects.findMany({
      where: or(
        eq(subjects.reviewerId1, teacherId),
        eq(subjects.reviewerId2, teacherId)
      ),
      with: {
        class: true
      }
    });
    
    // 3. For each currently reviewed subject, if it's NOT in the new specializations list, clear their reviewer ID!
    for (const subject of currentReviewedSubjects) {
      if (!subject.class) continue;
      const specKey = `${subject.class.name} - ${subject.name}`.toLowerCase();
      if (!newSpecs.includes(specKey)) {
        const updateObj: any = {};
        if (subject.reviewerId1 === teacherId) updateObj.reviewerId1 = null;
        if (subject.reviewerId2 === teacherId) updateObj.reviewerId2 = null;
        
        await db.update(subjects)
          .set(updateObj)
          .where(eq(subjects.id, subject.id));
      }
    }
    
    // 4. For each new specialization, ensure the teacher is assigned as reviewer if not already
    for (const spec of newSpecs) {
      if (!spec.includes(" - ")) continue;
      const [className, subjectName] = spec.split(" - ").map(s => s.trim());
      
      // Find class in the same institute
      const classRecord = await db.query.classes.findFirst({
        where: and(
          eq(classes.name, className),
          eq(classes.institute, institute)
        )
      });
      if (!classRecord) continue;
      
      // Find subject
      const subjectRecord = await db.query.subjects.findFirst({
        where: and(
          eq(subjects.classId, classRecord.id),
          eq(subjects.name, subjectName)
        )
      });
      if (!subjectRecord) continue;
      
      // If the teacher is not Reviewer 1 and not Reviewer 2, assign them to one of the empty slots
      if (subjectRecord.reviewerId1 !== teacherId && subjectRecord.reviewerId2 !== teacherId) {
        if (!subjectRecord.reviewerId1) {
          await db.update(subjects)
            .set({ reviewerId1: teacherId })
            .where(eq(subjects.id, subjectRecord.id));
        } else if (!subjectRecord.reviewerId2) {
          await db.update(subjects)
            .set({ reviewerId2: teacherId })
            .where(eq(subjects.id, subjectRecord.id));
        }
      }
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error syncing specializations to subjects:", error);
    return { success: false, error: error.message };
  }
}

export async function createTeacher(data: {
  name: string;
  contactNumber?: string;
  classAssigned?: string;
  institute?: string;
  responsibility?: string;
  incharge?: string;
  specialization?: string;
  assignedRole?: string;
  committees?: string;
  email: string;
  password?: string;
}) {
  try {
    console.log("CREATE_TEACHER_START:", data.email);
    if (!data.name || !data.email) {
      return { success: false, error: "Name and Email are required" };
    }

    const email = data.email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existingUser) {
      console.log("CREATE_TEACHER_USER_EXISTS:", email);
      return { success: false, error: "User with this email already exists" };
    }

    // Default password if not provided
    const password = data.password || "Teacher@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("CREATE_TEACHER_INSERTING_USER...");
    // Create user first
    const [user] = await db.insert(users).values({
      email: email,
      password: hashedPassword,
      role: "TEACHER",
      phone: data.contactNumber || null,
    }).returning({ id: users.id });

    console.log("CREATE_TEACHER_USER_CREATED:", user?.id);

    // Create teacher profile
    const [teacher] = await db.insert(teachers).values({
      userId: user.id,
      name: data.name,
      contactNumber: data.contactNumber || null,
      classAssigned: data.classAssigned || null,
      institute: data.institute || null,
      responsibility: data.responsibility || null,
      incharge: data.incharge || null,
      specialization: data.specialization || null,
      assignedRole: data.assignedRole || null,
      committees: data.committees || null,
    }).returning({ id: teachers.id });

    console.log("CREATE_TEACHER_PROFILE_CREATED:", teacher?.id);

    if (teacher?.id && data.institute) {
      await syncTeacherSpecializationsToSubjects(teacher.id, data.specialization || null, data.institute);
    }

    revalidatePath("/office/school-management/teachers");
    return { success: true };
  } catch (error: any) {
    console.error("CREATE_TEACHER_ERROR:", error.message);
    return { success: false, error: error.message };
  }
}

export async function updateTeacher(id: string, data: {
  userId?: string;
  name: string;
  email: string;
  password?: string;
  contactNumber?: string;
  classAssigned?: string;
  institute?: string;
  responsibility?: string;
  incharge?: string;
  specialization?: string;
  assignedRole?: string;
  committees?: string;
}) {
  try {
    const email = data.email.trim().toLowerCase();
    let currentUserId = data.userId;

    console.log(`UPDATE_TEACHER_START: ${id}, Email: ${email}`);

    // If no userId, try to find by email
    if (!currentUserId) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
      });
      if (existingUser) {
        currentUserId = existingUser.id;
        console.log("UPDATE_TEACHER: Found existing user by email:", currentUserId);
      } else {
        // Create user if doesn't exist
        console.log("UPDATE_TEACHER: Creating missing user account...");
        const defaultPassword = data.password || "Teacher@123";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        const [newUser] = await db.insert(users).values({
          email: email,
          password: hashedPassword,
          role: "TEACHER",
          phone: data.contactNumber || null,
        }).returning({ id: users.id });
        currentUserId = newUser.id;
        console.log("UPDATE_TEACHER: Created new user account:", currentUserId);
      }
    }

    // Update user table
    const userUpdate: any = {
      email: email,
      phone: data.contactNumber || null,
    };
    if (data.password) {
      userUpdate.password = await bcrypt.hash(data.password, 10);
    }

    await db.update(users).set(userUpdate).where(eq(users.id, currentUserId));

    // Update teachers table AND link to user
    await db.update(teachers).set({
      userId: currentUserId,
      name: data.name,
      contactNumber: data.contactNumber || null,
      classAssigned: data.classAssigned || null,
      institute: data.institute || null,
      responsibility: data.responsibility || null,
      incharge: data.incharge || null,
      specialization: data.specialization || null,
      assignedRole: data.assignedRole || null,
      committees: data.committees || null,
      updatedAt: new Date(),
    }).where(eq(teachers.id, id));

    if (data.institute) {
      await syncTeacherSpecializationsToSubjects(id, data.specialization || null, data.institute);
    }

    console.log("UPDATE_TEACHER_SUCCESS");
    revalidatePath("/office/school-management/teachers");
    return { success: true };
  } catch (error: any) {
    console.error("UPDATE_TEACHER_ERROR:", error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteTeacher(id: string, userId: string | null) {
  try {
    // ── Guard: block deletion if teacher has active assignments ─────────────────
    // 1. Check if teacher has classAssigned set
    const teacherRecord = await db.query.teachers.findFirst({
      where: eq(teachers.id, id),
    });

    if (teacherRecord?.classAssigned && teacherRecord.classAssigned.trim() !== "") {
      return {
        success: false,
        error: `Cannot delete: teacher is still assigned to class(es) "${teacherRecord.classAssigned}". Remove class assignments first.`,
      };
    }

    if (teacherRecord?.institute && teacherRecord.institute.trim() !== "") {
      return {
        success: false,
        error: `Cannot delete: teacher is assigned to institute "${teacherRecord.institute}". Remove institute assignment first.`,
      };
    }

    // 2. Check if teacher is assigned to any subject
    const assignedSubject = await db.query.subjects.findFirst({
      where: eq(subjects.assignedTeacherId, id),
    });
    if (assignedSubject) {
      return {
        success: false,
        error: `Cannot delete: teacher is assigned to subject "${assignedSubject.name}". Unassign from subjects first.`,
      };
    }

    // 3. Check if teacher is assigned to any timetable slot
    const assignedTimetable = await db.query.timetable.findFirst({
      where: eq(timetable.teacherId, id),
    });
    if (assignedTimetable) {
      return {
        success: false,
        error: `Cannot delete: teacher has active timetable entries. Remove timetable assignments first.`,
      };
    }

    // ── Safe to delete ──────────────────────────────────────────────────────────
    // Delete the teacher profile first (in case userId is null/unlinked)
    await db.delete(teachers).where(eq(teachers.id, id));

    // If a linked user account exists, delete that too (this will also cascade)
    if (userId) {
      await db.delete(users).where(eq(users.id, userId));
    }

    revalidatePath("/office/school-management/teachers");
    return { success: true };
  } catch (error: any) {
    console.error("DELETE_TEACHER_ERROR:", error.message);
    return { success: false, error: error.message };
  }
}
