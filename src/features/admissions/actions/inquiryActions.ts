"use server";

import { db } from "@/db";
import { inquiries, users, studentProfiles, admissionMeta } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createInquiry(data: any) {
  try {
    if (!data.studentName || !data.email || !data.phone || !data.aadhaarNumber || !data.password) {
       throw new Error("Missing required fields: Student Name, Email, Phone, Aadhaar, and Password are mandatory.");
    }

    if (!/^\d{12}$/.test(data.aadhaarNumber)) {
      throw new Error("Aadhaar Number must be exactly 12 digits.");
    }

    // 1. Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });
    if (existingUser) throw new Error("A user with this email already exists.");

    const academicYear = data.academicYear || "2026-27";
    
    // 2. Generate Sequential ID: E[Year] [Sequence] (e.g., E2026-27 001)
    const inquiryCount = await db.select({ value: count() })
      .from(inquiries)
      .where(eq(inquiries.academicYear, academicYear));
    
    const nextNumber = (inquiryCount[0].value + 1).toString().padStart(3, '0');
    const entryNumberE = `E${academicYear} ${nextNumber}`;
    const entryNumberA = `A${academicYear} ${nextNumber}`;

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await db.transaction(async (tx) => {
      // 3. Create Inquiry
      const [inquiry] = await tx.insert(inquiries).values({
        studentName: data.studentName,
        parentName: data.parentName || "",
        email: data.email,
        phone: data.phone,
        appliedClass: data.appliedClass || "",
        academicYear,
        entryNumber: entryNumberE,
        aadhaarNumber: data.aadhaarNumber,
        passwordPlain: data.password,
        status: "SHORTLISTED",
      }).returning();

      // 3. Create User
      const [user] = await tx.insert(users).values({
        email: data.email,
        password: hashedPassword,
        role: "STUDENT_PARENT",
        phone: data.phone,
      }).returning();

      // 4. Create AdmissionMeta
      const [meta] = await tx.insert(admissionMeta).values({
        inquiryId: inquiry.id,
        academicYear: inquiry.academicYear,
        entryNumber: entryNumberA,
        admissionType: "NEW",
      }).returning();

      // 5. Create StudentProfile
      await tx.insert(studentProfiles).values({
        userId: user.id,
        admissionMetaId: meta.id,
        admissionStep: 1,
      });

      revalidatePath("/office/inquiries");
      return { success: true, data: inquiry };
    });
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
        entryNumber: inquiry.entryNumber?.startsWith('E') ? inquiry.entryNumber.replace('E', 'A') : (inquiry.entryNumber || ""),
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
        .set({ status: "SHORTLISTED", passwordPlain: password })
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

    await db.update(inquiries)
      .set({ passwordPlain: newPassword })
      .where(eq(inquiries.email, email));

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

    // 1. Find admissionMeta
    const meta = await db.query.admissionMeta.findFirst({
      where: eq(admissionMeta.inquiryId, id),
    });

    if (meta) {
      // 2. Find studentProfile
      const profile = await db.query.studentProfiles.findFirst({
        where: eq(studentProfiles.admissionMetaId, meta.id),
      });

      if (profile && profile.userId) {
        // 3. Delete from users (cascades to studentProfiles)
        await db.delete(users).where(eq(users.id, profile.userId));
      }
    }

    // 4. Delete the inquiry (cascades to admissionMeta & forms)
    await db.delete(inquiries).where(eq(inquiries.id, id));

    revalidatePath("/office/inquiries");
    return { success: true, message: "Inquiry deleted successfully" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

