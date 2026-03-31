"use server";

import { db } from "@/db";
import { teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
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

export async function createTeacher(data: {
  name: string;
  contactNumber?: string;
  classAssigned?: string;
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
    }).returning({ id: teachers.id });

    console.log("CREATE_TEACHER_PROFILE_CREATED:", teacher?.id);

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
      updatedAt: new Date(),
    }).where(eq(teachers.id, id));

    console.log("UPDATE_TEACHER_SUCCESS");
    revalidatePath("/office/school-management/teachers");
    return { success: true };
  } catch (error: any) {
    console.error("UPDATE_TEACHER_ERROR:", error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteTeacher(id: string, userId: string) {
  try {
    // Deleting the user will cascade delete the teacher profile due to ON DELETE CASCADE
    await db.delete(users).where(eq(users.id, userId));

    revalidatePath("/office/school-management/teachers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
