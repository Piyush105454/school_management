"use server";

import { db } from "@/db";
import { resources, resourceIssuances, students, teachers } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface ResourceInput {
  name: string;
  type: string;
  totalQuantity: number;
  cost: number;
}

interface IssueInput {
  resourceId: number;
  recipientType: "STUDENT" | "TEACHER";
  studentId?: number;
  teacherId?: string; // UUID string
  quantityIssued: number;
}

/**
 * Action to add/register a new resource.
 */
export async function addResourceAction(data: ResourceInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OFFICE", "TEACHER", "PRINCIPAL"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized." };
    }

    if (!data.name.trim() || !data.type) {
      return { success: false, error: "Name and Type are required." };
    }

    if (data.totalQuantity <= 0 || data.cost < 0) {
      return { success: false, error: "Invalid quantity or cost values." };
    }

    await db.insert(resources).values({
      name: data.name.trim(),
      type: data.type,
      totalQuantity: data.totalQuantity,
      availableQuantity: data.totalQuantity, // available initially equals total
      cost: data.cost,
    });

    revalidatePath("/office/academy-management/library");
    return { success: true };
  } catch (error: any) {
    console.error("addResourceAction error:", error);
    return { success: false, error: error.message || "Failed to add resource." };
  }
}

/**
 * Action to issue a resource. Includes subtraction logic.
 */
export async function issueResourceAction(data: IssueInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OFFICE", "TEACHER", "PRINCIPAL"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized." };
    }

    if (data.quantityIssued <= 0) {
      return { success: false, error: "Quantity issued must be greater than zero." };
    }

    if (data.recipientType === "STUDENT" && !data.studentId) {
      return { success: false, error: "Please select a student." };
    }

    if (data.recipientType === "TEACHER" && !data.teacherId) {
      return { success: false, error: "Please select a teacher." };
    }

    // 1. Fetch current resource to check availability
    const resourceRecords = await db
      .select()
      .from(resources)
      .where(eq(resources.id, data.resourceId))
      .limit(1);

    if (!resourceRecords.length) {
      return { success: false, error: "Resource not found." };
    }

    const resource = resourceRecords[0];

    // 2. Validate availability
    if (resource.availableQuantity < data.quantityIssued) {
      return {
        success: false,
        error: `Insufficient stock. Only ${resource.availableQuantity} units available.`,
      };
    }

    // 3. Atomically decrement stock and insert issuance
    await db.transaction(async (tx) => {
      // Decrement availableQuantity
      await tx
        .update(resources)
        .set({
          availableQuantity: sql`available_quantity - ${data.quantityIssued}`,
          updatedAt: new Date(),
        })
        .where(eq(resources.id, data.resourceId));

      // Insert issuance record
      await tx.insert(resourceIssuances).values({
        resourceId: data.resourceId,
        recipientType: data.recipientType,
        studentId: data.recipientType === "STUDENT" ? data.studentId : null,
        teacherId: data.recipientType === "TEACHER" ? data.teacherId : null,
        quantityIssued: data.quantityIssued,
        status: "ISSUED",
      });
    });

    revalidatePath("/office/academy-management/library");
    return { success: true };
  } catch (error: any) {
    console.error("issueResourceAction error:", error);
    return { success: false, error: error.message || "Failed to issue resource." };
  }
}

/**
 * Action to return an issued resource. Includes addition logic.
 */
export async function returnResourceAction(issuanceId: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OFFICE", "TEACHER", "PRINCIPAL"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized." };
    }

    // 1. Fetch issuance record
    const issuanceRecords = await db
      .select()
      .from(resourceIssuances)
      .where(eq(resourceIssuances.id, issuanceId))
      .limit(1);

    if (!issuanceRecords.length) {
      return { success: false, error: "Issuance record not found." };
    }

    const issuance = issuanceRecords[0];

    if (issuance.status === "RETURNED") {
      return { success: false, error: "This item has already been marked as returned." };
    }

    // 2. Atomically increment stock and update issuance
    await db.transaction(async (tx) => {
      // Restore availableQuantity
      await tx
        .update(resources)
        .set({
          availableQuantity: sql`available_quantity + ${issuance.quantityIssued}`,
          updatedAt: new Date(),
        })
        .where(eq(resources.id, issuance.resourceId));

      // Mark issuance as returned
      await tx
        .update(resourceIssuances)
        .set({
          status: "RETURNED",
          returnedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(resourceIssuances.id, issuanceId));
    });

    revalidatePath("/office/academy-management/library");
    return { success: true };
  } catch (error: any) {
    console.error("returnResourceAction error:", error);
    return { success: false, error: error.message || "Failed to return resource." };
  }
}

/**
 * Action to permanently delete a resource catalog item.
 */
export async function deleteResourceAction(resourceId: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OFFICE", "TEACHER", "PRINCIPAL"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized." };
    }

    await db.delete(resources).where(eq(resources.id, resourceId));

    revalidatePath("/office/academy-management/library");
    return { success: true };
  } catch (error: any) {
    console.error("deleteResourceAction error:", error);
    return { success: false, error: error.message || "Failed to delete resource." };
  }
}
