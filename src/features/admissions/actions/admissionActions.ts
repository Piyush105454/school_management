"use server";

import { db } from "@/db";
import { 
  admissionMeta, 
  studentBio, 
  studentAddress, 
  studentBankDetails, 
  previousAcademic, 
  siblingDetails, 
  parentGuardianDetails, 
  declarations,
  studentProfiles 
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitFullAdmissionForm(admissionId: string, data: any, step?: number) {
  try {
    return await db.transaction(async (tx) => {
      // 1. Student Bio
      if (data.studentBio) {
        const bioData = { ...data.studentBio };
        if (bioData.dob) bioData.dob = new Date(bioData.dob);
        if (bioData.age) bioData.age = parseInt(bioData.age);
        if (bioData.heightCm) bioData.heightCm = parseFloat(bioData.heightCm);
        if (bioData.weightKg) bioData.weightKg = parseFloat(bioData.weightKg);

        await tx.insert(studentBio).values({
          ...bioData,
          admissionId,
        }).onConflictDoUpdate({
          target: studentBio.admissionId,
          set: bioData
        });
      }

      // 2. Student Address
      if (data.address) {
        await tx.insert(studentAddress).values({
          ...data.address,
          admissionId,
        }).onConflictDoUpdate({
          target: studentAddress.admissionId,
          set: data.address
        });
      }

      // 3. Bank Details
      if (data.bankDetails) {
        await tx.insert(studentBankDetails).values({
          ...data.bankDetails,
          admissionId,
        }).onConflictDoUpdate({
          target: studentBankDetails.admissionId,
          set: data.bankDetails
        });
      }

      // 4. Previous Academic
      if (data.previousAcademic) {
        const academicData = { ...data.previousAcademic };
        if (academicData.marksObtained) academicData.marksObtained = parseFloat(academicData.marksObtained);
        if (academicData.totalMarks) academicData.totalMarks = parseFloat(academicData.totalMarks);
        if (academicData.percentage) academicData.percentage = parseFloat(academicData.percentage);

        await tx.insert(previousAcademic).values({
          ...academicData,
          admissionId,
        }).onConflictDoUpdate({
          target: previousAcademic.admissionId,
          set: academicData
        });
      }

      // 5. Siblings (Delete existing and re-insert)
      if (data.siblings) {
        await tx.delete(siblingDetails).where(eq(siblingDetails.admissionId, admissionId));
        if (data.siblings.length > 0) {
          await tx.insert(siblingDetails).values(
            data.siblings.map((s: any, i: number) => ({ ...s, admissionId, siblingNumber: i + 1 }))
          );
        }
      }

      // 6. Parents/Guardians (Delete existing and re-insert)
      if (data.parentsGuardians) {
        await tx.delete(parentGuardianDetails).where(eq(parentGuardianDetails.admissionId, admissionId));
        if (data.parentsGuardians.length > 0) {
          await tx.insert(parentGuardianDetails).values(
            data.parentsGuardians.map((p: any) => ({ ...p, admissionId }))
          );
        }
      }

      // 7. Declaration
      if (data.declaration) {
        await tx.insert(declarations).values({
          ...data.declaration,
          admissionId,
        }).onConflictDoUpdate({
          target: declarations.admissionId,
          set: data.declaration
        });
      }

      // 8. Update Profile Step
      if (step) {
        await tx.update(studentProfiles)
          .set({ admissionStep: step, isFullyAdmitted: step === 8 })
          .where(eq(studentProfiles.admissionMetaId, admissionId));
      }

      revalidatePath("/office/inquiries");
      return { success: true };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAdmissionData(admissionId: string) {
  try {
    const [bio, address, academic, parents, bank, declaration] = await Promise.all([
      db.query.studentBio.findFirst({ where: eq(studentBio.admissionId, admissionId) }),
      db.query.studentAddress.findFirst({ where: eq(studentAddress.admissionId, admissionId) }),
      db.query.previousAcademic.findFirst({ where: eq(previousAcademic.admissionId, admissionId) }),
      db.query.parentGuardianDetails.findMany({ where: eq(parentGuardianDetails.admissionId, admissionId) }),
      db.query.studentBankDetails.findFirst({ where: eq(studentBankDetails.admissionId, admissionId) }),
      db.query.declarations.findFirst({ where: eq(declarations.admissionId, admissionId) })
    ]);

    return {
      success: true,
      data: {
        studentBio: bio,
        address,
        previousAcademic: academic,
        parentsGuardians: parents,
        bankDetails: bank,
        declaration
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveAdmissionStep(admissionId: string, data: any, step: number) {
  try {
    return await db.transaction(async (tx) => {
      // Partially update based on step
      switch (step) {
        case 1:
        case 2:
          if (data.studentBio) {
            const bioData = { ...data.studentBio };
            if (bioData.dob) bioData.dob = new Date(bioData.dob);
            if (bioData.age) bioData.age = parseInt(bioData.age);
            if (bioData.heightCm) bioData.heightCm = parseFloat(bioData.heightCm);
            if (bioData.weightKg) bioData.weightKg = parseFloat(bioData.weightKg);

            await tx.insert(studentBio).values({ ...bioData, admissionId }).onConflictDoUpdate({
              target: studentBio.admissionId,
              set: bioData
            });
          }
          break;
        case 3:
          if (data.address) {
            await tx.insert(studentAddress).values({ ...data.address, admissionId }).onConflictDoUpdate({
              target: studentAddress.admissionId,
              set: data.address
            });
          }
          break;
        case 4:
          if (data.previousAcademic) {
            const academicData = { ...data.previousAcademic };
            if (academicData.marksObtained) academicData.marksObtained = parseFloat(academicData.marksObtained);
            if (academicData.totalMarks) academicData.totalMarks = parseFloat(academicData.totalMarks);
            if (academicData.percentage) academicData.percentage = parseFloat(academicData.percentage);

            await tx.insert(previousAcademic).values({ ...academicData, admissionId }).onConflictDoUpdate({
              target: previousAcademic.admissionId,
              set: academicData
            });
          }
          break;
        case 5:
          if (data.siblings) {
            await tx.delete(siblingDetails).where(eq(siblingDetails.admissionId, admissionId));
            if (data.siblings.length > 0) {
              await tx.insert(siblingDetails).values(
                data.siblings.map((s: any, i: number) => ({ ...s, admissionId, siblingNumber: i + 1 }))
              );
            }
          }
          break;
        case 6:
          if (data.parentsGuardians) {
            await tx.delete(parentGuardianDetails).where(eq(parentGuardianDetails.admissionId, admissionId));
            if (data.parentsGuardians.length > 0) {
              await tx.insert(parentGuardianDetails).values(
                data.parentsGuardians.map((p: any) => ({ ...p, admissionId }))
              );
            }
          }
          break;
        case 7:
          if (data.bankDetails) {
            await tx.insert(studentBankDetails).values({ ...data.bankDetails, admissionId }).onConflictDoUpdate({
              target: studentBankDetails.admissionId,
              set: data.bankDetails
            });
          }
          break;
        case 8:
          if (data.declaration) {
            await tx.insert(declarations).values({ ...data.declaration, admissionId }).onConflictDoUpdate({
              target: declarations.admissionId,
              set: data.declaration
            });
          }
          break;
      }

      // Update current step in profile
      await tx.update(studentProfiles)
        .set({ admissionStep: step + 1, isFullyAdmitted: step === 8 })
        .where(eq(studentProfiles.admissionMetaId, admissionId));

      return { success: true };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
