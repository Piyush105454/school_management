"use server";

import { db } from "@/db";
import { teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTeachers() {
  try {
    const data = await db.select().from(teachers).orderBy(teachers.name);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTeacher(data: { name: string; contactNumber?: string; classAssigned?: string }) {
  try {
    if (!data.name) {
       return { success: false, error: "Name is required" };
    }

    await db.insert(teachers).values({
      name: data.name,
      contactNumber: data.contactNumber || null,
      classAssigned: data.classAssigned || null,
    });
    
    revalidatePath("/office/school-management/teachers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
