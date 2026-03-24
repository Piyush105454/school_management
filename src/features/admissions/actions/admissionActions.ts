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
  studentProfiles,
  documentChecklists,
  studentDocuments
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function sanitizeBioData(data: any) {
  if (!data) return data;
  const sanitized = { ...data };
  
  if (sanitized.dob === "" || sanitized.dob === undefined || sanitized.dob === null) {
    sanitized.dob = null;
  } else {
    const d = new Date(sanitized.dob);
    sanitized.dob = isNaN(d.getTime()) ? null : d;
  }
  
  // Convert numeric fields from string to number or null
  const numericFields = ["age", "heightCm", "weightKg"];
  numericFields.forEach(field => {
    if (sanitized[field] === "" || sanitized[field] === undefined || sanitized[field] === null) {
      // Age is NOT NULL in DB, so provide fallback
      sanitized[field] = field === "age" ? 0 : null;
    } else if (typeof sanitized[field] === "string") {
      const val = field === "age" ? parseInt(sanitized[field]) : parseFloat(sanitized[field]);
      if (isNaN(val)) {
        sanitized[field] = field === "age" ? 0 : null;
      } else {
        sanitized[field] = val;
      }
    }
  });

  // Fallbacks for other NOT NULL fields if they are somehow missing
  if (!sanitized.firstName) sanitized.firstName = "-";
  if (!sanitized.lastName) sanitized.lastName = "-";
  if (!sanitized.gender) sanitized.gender = "M";
  if (!sanitized.caste) sanitized.caste = "GEN";

  return sanitized;
}

function sanitizeAcademicData(data: any) {
  if (!data) return data;
  const sanitized = { ...data };
  
  const numericFields = ["marksObtained", "totalMarks", "percentage"];
  numericFields.forEach(field => {
    if (sanitized[field] === "" || sanitized[field] === undefined || sanitized[field] === null) {
      sanitized[field] = null;
    } else if (typeof sanitized[field] === "string") {
      const val = parseFloat(sanitized[field]);
      sanitized[field] = isNaN(val) ? null : val;
    }
  });

  return sanitized;
}

function sanitizeSiblingData(data: any[]) {
  if (!data) return [];
  return data.map(s => {
    const sanitized = { ...s };
    if (sanitized.age === "" || sanitized.age === undefined || sanitized.age === null) {
      sanitized.age = null;
    } else if (typeof sanitized.age === "string") {
      const val = parseInt(sanitized.age);
      sanitized.age = isNaN(val) ? null : val;
    }
    return sanitized;
  });
}

function sanitizeDocuments(docs: any) {
  if (!docs) return docs;
  const sanitized = { ...docs };
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === "__EXISTING__") {
      delete sanitized[key];
    } else if (sanitized[key] === "") {
      sanitized[key] = null;
    }
  });
  return sanitized;
}


export async function submitFullAdmissionForm(admissionId: string, data: any, step?: number) {
  try {
    return await db.transaction(async (tx) => {
      // 1. Student Bio
      if (data.studentBio) {
        const bioData = sanitizeBioData(data.studentBio);

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
        const academicData = sanitizeAcademicData(data.previousAcademic);

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
          const sanitizedSiblings = sanitizeSiblingData(data.siblings);
          await tx.insert(siblingDetails).values(
            sanitizedSiblings.map((s: any, i: number) => ({ ...s, admissionId, siblingNumber: i + 1 }))
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

        if (data.declaration.appliedScholarship !== undefined) {
          await tx.update(admissionMeta)
            .set({ appliedScholarship: data.declaration.appliedScholarship === "true" })
            .where(eq(admissionMeta.id, admissionId));
        }
      }

      // 8. Documents
      if (data.documents) {
        const sanitizedDocs = sanitizeDocuments(data.documents);
        if (Object.keys(sanitizedDocs).length > 0) {
          await tx.insert(studentDocuments).values({
            ...sanitizedDocs,
            admissionId,
          }).onConflictDoUpdate({
            target: studentDocuments.admissionId,
            set: sanitizedDocs
          });
        }
      }

      // 9. Update Profile Step
      if (step) {
        await tx.update(studentProfiles)
          .set({ 
            admissionStep: step === 9 ? 10 : step
          })
          .where(eq(studentProfiles.admissionMetaId, admissionId));
      }

      revalidatePath("/office/inquiries");
      return { success: true };
    });
  } catch (error: any) {
    console.error("submitFullAdmissionForm error:", error);
    return { success: false, error: error.message };
  }
}

export async function verifyAdmission(admissionId: string) {
  try {
    const existing = await db.query.documentChecklists.findFirst({
      where: eq(documentChecklists.admissionId, admissionId)
    });

    if (existing) {
      await db.update(documentChecklists)
        .set({ 
          formReceivedComplete: true, 
          verifiedAt: new Date() 
        })
        .where(eq(documentChecklists.admissionId, admissionId));
    } else {
      await db.insert(documentChecklists).values({
        admissionId,
        formReceivedComplete: true,
        verifiedAt: new Date()
      });
    }

    await db.update(studentProfiles)
      .set({ admissionStep: 11 })
      .where(eq(studentProfiles.admissionMetaId, admissionId));

    revalidatePath("/office/inquiries");
    revalidatePath("/student/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function finalizeFinalAdmission(admissionId: string, approveScholarship?: boolean, amount: number = 36000) {
  try {
    return await db.transaction(async (tx) => {
      await tx.update(studentProfiles)
        .set({ isFullyAdmitted: true })
        .where(eq(studentProfiles.admissionMetaId, admissionId));

      if (approveScholarship) {
        await tx.update(admissionMeta)
          .set({ awardedScholarship: true, scholarshipAmount: amount, updatedAt: new Date() })
          .where(eq(admissionMeta.id, admissionId));
      }

      revalidatePath("/office/inquiries");
      revalidatePath("/student/dashboard");
      revalidatePath("/office/final-admissions");
      return { success: true };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function awardScholarshipDirect(admissionId: string, amount: number = 36000) {
  try {
    await db.update(admissionMeta)
      .set({ awardedScholarship: true, scholarshipAmount: amount, updatedAt: new Date() })
      .where(eq(admissionMeta.id, admissionId));

    revalidatePath("/student/dashboard");
    revalidatePath("/office/inquiries");
    revalidatePath("/office/scholarship/award");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function applyScholarship(admissionId: string, applied: boolean) {
  try {
    await db.update(admissionMeta)
      .set({ appliedScholarship: applied, updatedAt: new Date() })
      .where(eq(admissionMeta.id, admissionId));

    revalidatePath("/student/dashboard");
    revalidatePath("/office/inquiries");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function getDocumentContent(admissionId: string, fieldName: string) {
  try {
    const doc = await db.query.studentDocuments.findFirst({
      where: eq(studentDocuments.admissionId, admissionId),
      columns: {
        [fieldName as any]: true
      }
    });
    return { success: true, content: (doc as any)?.[fieldName] || null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAdmissionData(admissionId: string, lite: boolean = false) {
  try {
    const [bio, address, academic, parents, bank, documents, declaration, siblings] = await Promise.all([
      db.query.studentBio.findFirst({ where: eq(studentBio.admissionId, admissionId) }),
      db.query.studentAddress.findFirst({ where: eq(studentAddress.admissionId, admissionId) }),
      db.query.previousAcademic.findFirst({ where: eq(previousAcademic.admissionId, admissionId) }),
      db.query.parentGuardianDetails.findMany({ where: eq(parentGuardianDetails.admissionId, admissionId) }),
      db.query.studentBankDetails.findFirst({ where: eq(studentBankDetails.admissionId, admissionId) }),
      db.query.studentDocuments.findFirst({ 
        where: eq(studentDocuments.admissionId, admissionId),
        columns: lite ? {
          admissionId: true,
          birthCertificate: false,
          studentPhoto: false,
          marksheet: false,
          casteCertificate: false,
          affidavit: false,
          transferCertificate: false,
          scholarshipSlip: false
        } : undefined
      }),
      db.query.declarations.findFirst({ where: eq(declarations.admissionId, admissionId) }),
      db.query.siblingDetails.findMany({ where: eq(siblingDetails.admissionId, admissionId) })
    ]);

    // If lite mode, we still need to know IF a document exists
    let sanitizedDocs = documents;
    if (lite && documents) {
      // Re-fetch only keys to check nullability without fetching massive text data
      const docRaw = await db.execute(
        `SELECT 
          (birth_certificate IS NOT NULL) as "birthCertificate",
          (student_photo IS NOT NULL) as "studentPhoto",
          (marksheet IS NOT NULL) as "marksheet",
          (caste_certificate IS NOT NULL) as "casteCertificate",
          (affidavit IS NOT NULL) as "affidavit",
          (transfer_certificate IS NOT NULL) as "transferCertificate",
          (scholarship_slip IS NOT NULL) as "scholarshipSlip"
         FROM student_documents WHERE admission_id = '${admissionId}'`
      );
      
      const rows = (docRaw as any).rows || (Array.isArray(docRaw) ? docRaw : []);
      const existsMap = rows?.[0] || {};
      sanitizedDocs = {} as any;
      Object.keys(existsMap).forEach(key => {
        // If it exists in DB, we put a placeholder "EXISTS" to trigger the UI "DONE" state
        (sanitizedDocs as any)[key] = (existsMap as any)[key] ? "__EXISTING__" : "";
      });
    }

    return {
      success: true,
      data: {
        studentBio: bio,
        address,
        previousAcademic: academic,
        parentsGuardians: parents,
        bankDetails: bank,
        documents: sanitizedDocs,
        declaration,
        siblings: siblings || []
      }
    };
  } catch (error: any) {
    console.error("getAdmissionData error:", error);
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
            const bioData = sanitizeBioData(data.studentBio);

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
            const academicData = sanitizeAcademicData(data.previousAcademic);

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
              const sanitizedSiblings = sanitizeSiblingData(data.siblings);
              await tx.insert(siblingDetails).values(
                sanitizedSiblings.map((s: any, i: number) => ({ ...s, admissionId, siblingNumber: i + 1 }))
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
          if (data.documents) {
            const sanitizedDocs = sanitizeDocuments(data.documents);
            if (Object.keys(sanitizedDocs).length > 0) {
              await tx.insert(studentDocuments).values({ ...sanitizedDocs, admissionId }).onConflictDoUpdate({
                target: studentDocuments.admissionId,
                set: sanitizedDocs
              });
            }
          }
          break;
        case 9:
          if (data.declaration) {
            await tx.insert(declarations).values({ ...data.declaration, admissionId }).onConflictDoUpdate({
              target: declarations.admissionId,
              set: data.declaration
            });

            if (data.declaration.appliedScholarship !== undefined) {
              await tx.update(admissionMeta)
                .set({ appliedScholarship: data.declaration.appliedScholarship === "true" })
                .where(eq(admissionMeta.id, admissionId));
            }
          }
          break;
      }

      // Only advance if step + 1 is greater than existing step to prevent regression on edits
      const currentProfile = await tx.select({ currentStep: studentProfiles.admissionStep })
        .from(studentProfiles)
        .where(eq(studentProfiles.admissionMetaId, admissionId))
        .limit(1);

      const existingStep = currentProfile?.[0]?.currentStep || 0;

      if (step + 1 > existingStep) {
        await tx.update(studentProfiles)
          .set({ admissionStep: step + 1 })
          .where(eq(studentProfiles.admissionMetaId, admissionId));
      }

      return { success: true };
    });
  } catch (error: any) {
    console.error("saveAdmissionStep error:", error);
    return { success: false, error: error.message };
  }
}

export async function getAdmissionsForList() {
  try {
    const admissions = await db.query.admissionMeta.findMany({
      with: { 
        inquiry: {
          columns: {
            studentName: true,
            appliedClass: true,
            email: true
          }
        } 
      },
      orderBy: [desc(admissionMeta.createdAt)]
    });
    return { success: true, data: admissions };
  } catch (error: any) {
    console.error("getAdmissionsForList error:", error);
    return { success: false, error: error.message, data: [] };
  }
}
