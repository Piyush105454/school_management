"use server";

import { db } from "@/db";
import { inquiries, users, studentProfiles, admissionMeta } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createInquiry(data: any) {
  try {
    if (!data.studentName || !data.email || !data.phone) {
       throw new Error("Missing required fields: Student Name, Email, and Phone are mandatory.");
    }

    const entryNumber = `INQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = await db.insert(inquiries).values({
      studentName: data.studentName,
      parentName: data.parentName || "",
      email: data.email,
      phone: data.phone,
      appliedClass: data.appliedClass || "",
      academicYear: data.academicYear || "2026-27",
      entryNumber,
    }).returning();
    
    revalidatePath("/office/inquiries");
    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function shortlistInquiry(id: string) {
  try {
    const inquiry = await db.query.inquiries.findFirst({
      where: eq(inquiries.id, id),
    });

    if (!inquiry) throw new Error("Inquiry not found");
    if (inquiry.status === "SHORTLISTED") throw new Error("Already shortlisted");

    // 1. Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, inquiry.email),
    });
    if (existingUser) throw new Error("User with this email already exists");

    const password = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(password, 10);

    return await db.transaction(async (tx) => {
      // 2. Create User
      const [user] = await tx.insert(users).values({
        email: inquiry.email,
        password: hashedPassword,
        role: "STUDENT_PARENT",
        phone: inquiry.phone,
      }).returning();

      // 3. Create AdmissionMeta
      const [meta] = await tx.insert(admissionMeta).values({
        inquiryId: inquiry.id,
        academicYear: inquiry.academicYear,
        entryNumber: inquiry.entryNumber!,
        admissionType: "NEW",
      }).returning();

      // 4. Create StudentProfile
      await tx.insert(studentProfiles).values({
        userId: user.id,
        admissionMetaId: meta.id,
        admissionStep: 1,
      });

      // 5. Update Inquiry Status
      await tx.update(inquiries)
        .set({ status: "SHORTLISTED" })
        .where(eq(inquiries.id, inquiry.id));

      revalidatePath("/office/inquiries");
      return { 
        success: true, 
        message: "Shortlisted successfully",
        credentials: { email: user.email, password } // In a real app, send via email
      };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetStudentPassword(email: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) throw new Error("User not found");

    const newPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));

    return { 
      success: true, 
      message: "Password reset successfully",
      credentials: { email: user.email, password: newPassword }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInquiry(id: string) {
  try {
    const inquiry = await db.query.inquiries.findFirst({
      where: eq(inquiries.id, id),
    });

    if (!inquiry) throw new Error("Inquiry not found");

    await db.delete(inquiries).where(eq(inquiries.id, id));

    revalidatePath("/office/inquiries");
    return { success: true, message: "Inquiry deleted successfully" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

