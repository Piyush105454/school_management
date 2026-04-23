"use server";

import { db } from "@/db";
import { 
  inquiries,
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
  studentDocuments,
  entranceTests,
  homeVisits
} from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadToS3, getSignedDownloadUrl, getPresignedUploadUrl, deleteFromS3 } from "@/lib/s3-service";

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
  if (!sanitized.dob) sanitized.dob = new Date("2000-01-01"); // Safe fallback for NOT NULL constraint

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
    if (sanitized[key] === "") {
      sanitized[key] = null;
    }
  });
  return sanitized;
}


/**
 * Fetches human-readable metadata for S3 path construction
 */
export async function getS3UploadContext(admissionId: string) {
  const meta = await db.query.admissionMeta.findFirst({
    where: eq(admissionMeta.id, admissionId),
    with: {
      inquiry: {
        columns: {
          appliedClass: true
        }
      }
    }
  });
  
  return {
    studentId: meta?.entryNumber || admissionId,
    appliedClass: meta?.inquiry?.appliedClass || "General"
  };
}

/**
 * Generates a presigned URL for direct client-side upload to S3
 */
export async function getDirectUploadUrl(
  admissionId: string, 
  fileName: string, 
  contentType: string, 
  category: string = "student-documents"
) {
  try {
    const s3Context = await getS3UploadContext(admissionId);
    const academicYear = "2026-27";
    const studentFolder = s3Context.studentId;
    
    // Determine extension
    let extension = fileName.split('.').pop()?.toLowerCase() || "";
    if (!extension || extension === fileName.toLowerCase()) {
      if (contentType === "application/pdf") extension = "pdf";
      else if (contentType.includes("jpeg") || contentType.includes("jpg")) extension = "jpg";
      else if (contentType.includes("png")) extension = "png";
      else if (contentType.includes("webp")) extension = "webp";
      else if (contentType.startsWith("image/")) extension = contentType.split('/')[1] || "jpg";
      else extension = "bin";
    }

    // Map common phone extensions to standard ones
    if (extension === "heic") extension = "jpg"; // After compression we convert to jpg
    if (extension === "jpeg") extension = "jpg";

    // Sanitize fileName (remove spaces and special chars)
    const baseName = fileName.split('.')[0].replace(/[^a-z0-9]/gi, '_');
    const key = `dps/${academicYear}/${category}/${studentFolder}/${baseName}.${extension}`;
    
    const uploadUrl = await getPresignedUploadUrl(key, contentType);
    const cleanUrl = `https://${process.env.S3_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${key}`;
    
    // Sign the URL for immediate preview in the UI
    const previewUrl = await getSignedDownloadUrl(cleanUrl) || cleanUrl;

    return { 
      success: true, 
      uploadUrl, 
      publicUrl: cleanUrl,   // THE CLEAN URL FOR STORAGE
      previewUrl: previewUrl, // THE SIGNED URL FOR PREVIEW
      key
    };
  } catch (error: any) {
    console.error("getDirectUploadUrl error:", error);
    return { success: false, error: error.message };
  }
}

export async function submitFullAdmissionForm(admissionId: string, data: any, step?: number) {
  try {
    const s3Context = await getS3UploadContext(admissionId);
    
    return await db.transaction(async (tx) => {
      // 1. Student Bio
      if (data.studentBio) {
        const bioData = sanitizeBioData(data.studentBio);

        if (bioData.studentPhoto && bioData.studentPhoto.startsWith("data:")) {
          bioData.studentPhoto = await uploadToS3(bioData.studentPhoto, {
            fileName: "studentPhoto", // Unified naming with documents
            admissionId,
            ...s3Context,
            category: "student-documents"
          });
        }

        await tx.insert(studentBio).values({
          ...bioData,
          admissionId,
        }).onConflictDoUpdate({
          target: studentBio.admissionId,
          set: bioData
        });

        // Sync back to Inquiry for consistency
        const meta = await tx.query.admissionMeta.findFirst({
          where: eq(admissionMeta.id, admissionId)
        });
        if (meta?.inquiryId) {
          await tx.update(inquiries)
            .set({ 
              firstName: bioData.firstName, 
              lastName: bioData.lastName,
              studentName: `${bioData.firstName} ${bioData.lastName}`,
              aadhaarNumber: bioData.aadhaarNumber,
            })
            .where(eq(inquiries.id, meta.inquiryId));
        }
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
        const processedParents = await Promise.all(data.parentsGuardians.map(async (p: any) => {
          if (p.photo && p.photo.startsWith("data:")) {
            const s3Url = await uploadToS3(p.photo, {
              fileName: `parent_${p.personType}`,
              admissionId,
              ...s3Context,
              category: "student-documents"
            });
            return { ...p, photo: s3Url };
          }
          return p;
        }));

        await tx.insert(parentGuardianDetails).values(
          processedParents.map((p: any) => ({ ...p, admissionId }))
        );
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
        const folderDocs: any = {};
        
        for (const [key, value] of Object.entries(sanitizedDocs)) {
          if (value && typeof value === 'string' && value.startsWith("data:")) {
            folderDocs[key] = await uploadToS3(value, {
              fileName: key,
              admissionId,
              ...s3Context,
              category: "student-documents"
            });
          } else {
            folderDocs[key] = value;
          }
        }

        if (Object.keys(folderDocs).length > 0) {
          await tx.insert(studentDocuments).values({
            ...folderDocs,
            admissionId,
          }).onConflictDoUpdate({
            target: studentDocuments.admissionId,
            set: folderDocs
          });
        }
      }

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
    await db.insert(documentChecklists).values({
      admissionId,
      formReceivedComplete: true,
      parentAffidavit: "VERIFIED" as any,
      verifiedAt: new Date()
    }).onConflictDoUpdate({
      target: documentChecklists.admissionId,
      set: {
        formReceivedComplete: true, 
        parentAffidavit: "VERIFIED" as any,
        verifiedAt: new Date()
      }
    });

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
    // 1. Fetch status of previous steps for strict validation
    const [checklist, test, visit] = await Promise.all([
      db.query.documentChecklists.findFirst({ where: eq(documentChecklists.admissionId, admissionId) }),
      db.query.entranceTests.findFirst({ where: eq(entranceTests.admissionId, admissionId) }),
      db.query.homeVisits.findFirst({ where: eq(homeVisits.admissionId, admissionId) })
    ]);

    // Validation checks
    if (checklist?.parentAffidavit !== "VERIFIED") {
      return { success: false, error: "Documents are NOT VERIFIED. Please complete document verification first." };
    }
    if (test?.status !== "PASS") {
      return { success: false, error: "Entrance Test NOT PASSED. Student must pass the test first." };
    }
    if (visit?.status !== "PASS") {
      return { success: false, error: "Home Visit NOT COMPLETED. Please complete the home visit first." };
    }

    return await db.transaction(async (tx) => {
      await tx.update(studentProfiles)
        .set({ isFullyAdmitted: true, admissionStep: 13 })
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

export async function revokeScholarshipDirect(admissionId: string) {
  try {
    await db.update(admissionMeta)
      .set({ awardedScholarship: false, scholarshipAmount: 0, updatedAt: new Date() })
      .where(eq(admissionMeta.id, admissionId));

    revalidatePath("/student/dashboard");
    revalidatePath("/office/scholarship/award");
    revalidatePath("/office/inquiries");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function undoAdmissionStep(admissionId: string) {
  try {
    const profile = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.admissionMetaId, admissionId),
      columns: { admissionStep: true }
    });

    if (!profile) throw new Error("Student profile not found");

    const newStep = Math.max(1, profile.admissionStep - 1);

    await db.transaction(async (tx) => {
      // 1. Update Student Profile
      await tx.update(studentProfiles)
        .set({ admissionStep: newStep, isFullyAdmitted: false }) 
        .where(eq(studentProfiles.admissionMetaId, admissionId));

      // 2. Reset Fee choice and scholarship status
      await tx.update(admissionMeta)
        .set({ 
          appliedScholarship: null, 
          awardedScholarship: false, 
          scholarshipAmount: 0,
          updatedAt: new Date()
        })
        .where(eq(admissionMeta.id, admissionId));
    });

    revalidatePath("/office/inquiries");
    revalidatePath("/student/dashboard");
    revalidatePath("/student/admission");
    revalidatePath("/office/final-admissions");
    revalidatePath("/office/scholarship/award");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * ONE-TIME REPAIR: Syncs admissionStep to 13 for all students who are already 'isFullyAdmitted'.
 * This fixes the 'Not Verified' issue for students approved in the past.
 */
export async function syncFinalAdmissions() {
  try {
    const admitted = await db.query.studentProfiles.findMany({
      where: eq(studentProfiles.isFullyAdmitted, true),
      with: {
        admissionMeta: true
      }
    });

    if (admitted.length === 0) return { success: true, count: 0 };

    await db.transaction(async (tx) => {
      for (const profile of admitted) {
        const admissionId = profile.admissionMetaId;
        if (!admissionId) continue;

        // 1. Force Step 13
        await tx.update(studentProfiles)
          .set({ admissionStep: 13 })
          .where(eq(studentProfiles.id, profile.id));

        // 2. Ensure Document Checklist is 'VERIFIED'
        await tx.insert(documentChecklists).values({
          admissionId,
          parentAffidavit: "VERIFIED",
          formReceivedComplete: true,
          verifiedAt: new Date()
        }).onConflictDoUpdate({
          target: documentChecklists.admissionId,
          set: { parentAffidavit: "VERIFIED", formReceivedComplete: true }
        });

        // 3. Ensure Entrance Test is 'PASS' (legacy sync)
        await tx.update(entranceTests)
          .set({ status: "PASS" })
          .where(and(
            eq(entranceTests.admissionId, admissionId),
            eq(entranceTests.status, "NOT_SCHEDULED")
          ));
      }
    });

    revalidatePath("/student/dashboard");
    revalidatePath("/office/inquiries");
    return { success: true, count: admitted.length };
  } catch (error: any) {
    console.error("Sync error:", error);
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

export async function resetFeeRoute(admissionId: string) {
  try {
    return await db.transaction(async (tx) => {
      // 1. Reset the scholarship application status
      await tx.update(admissionMeta)
        .set({ appliedScholarship: null, updatedAt: new Date() })
        .where(eq(admissionMeta.id, admissionId));

      // 2. Set the student's progress back to Step 9 (Declaration)
      await tx.update(studentProfiles)
        .set({ admissionStep: 9 })
        .where(eq(studentProfiles.admissionMetaId, admissionId));

      revalidatePath("/office/inquiries");
      revalidatePath("/student/dashboard");
      revalidatePath("/student/admission");
      return { success: true };
    });
  } catch (error: any) {
    console.error("resetFeeRoute error:", error);
    return { success: false, error: error.message };
  }
}


export async function getDocumentContent(admissionId: string, fieldName: string) {
  try {
    let content: string | null = null;

    // Special handling for Parent/Guardian photos which are in a separate table
    if (fieldName.startsWith("parent_")) {
      const personType = fieldName.replace("parent_", ""); // e.g. FATHER, MOTHER, GUARDIAN
      const parent = await db.query.parentGuardianDetails.findFirst({
        where: (pg, { and, eq }) => and(eq(pg.admissionId, admissionId), eq(pg.personType, personType as any)),
        columns: { photo: true }
      });
      content = parent?.photo || null;
    } else {
      // Standard student documents
      const doc = await db.query.studentDocuments.findFirst({
        where: eq(studentDocuments.admissionId, admissionId),
        columns: {
          [fieldName as any]: true
        }
      });
      content = (doc as any)?.[fieldName] || null;
    }

    const secureUrl = content ? await getSignedDownloadUrl(content) : null;
    return { success: true, content: secureUrl };
  } catch (error: any) {
    console.error("getDocumentContent error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteDocument(admissionId: string, fieldName: string) {
  try {
    // 1. Fetch existing document to find the S3 URL
    const doc = await db.query.studentDocuments.findFirst({
      where: eq(studentDocuments.admissionId, admissionId),
      columns: { [fieldName as any]: true }
    });
    
    const s3Url = (doc as any)?.[fieldName];

    // 2. Perform hard delete from S3
    if (s3Url) {
      await deleteFromS3(s3Url);
    }

    // 3. Clear DB field
    await db.update(studentDocuments)
      .set({ [fieldName]: null, updatedAt: new Date() })
      .where(eq(studentDocuments.admissionId, admissionId));
    
    revalidatePath("/office/admissions/[id]", "page");
    return { success: true };
  } catch (error: any) {
    console.error("deleteDocument error:", error);
    return { success: false, error: error.message };
  }
}

export async function saveOfficeRemark(admissionId: string, remark: string, unlockDocs: boolean = false) {
  try {
    return await db.transaction(async (tx) => {
      await tx.update(admissionMeta)
        .set({ officeRemarks: remark, updatedAt: new Date() })
        .where(eq(admissionMeta.id, admissionId));
      
      if (unlockDocs) {
        // If we are unlocking, set the student's progress back to Step 8 (Docs)
        await tx.update(studentProfiles)
          .set({ admissionStep: 8 })
          .where(eq(studentProfiles.admissionMetaId, admissionId));

        // Reset checklist so student can re-upload/edit
        await tx.update(documentChecklists)
          .set({ 
            parentAffidavit: "NOT_SUBMITTED", 
            formReceivedComplete: false,
            verifiedAt: null 
          })
          .where(eq(documentChecklists.admissionId, admissionId));
      }
      
      revalidatePath("/office/inquiries");
      revalidatePath("/office/document-verification");
      revalidatePath("/student/dashboard");
      revalidatePath("/student/document-verification");
      revalidatePath("/student/admission");
      return { success: true };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAdmissionData(admissionId: string, lite: boolean = false) {
  try {
    const [bio, address, academic, parents, bank, documents, declaration, siblings, checklist, entranceTest, homeVisit] = await Promise.all([
      db.query.studentBio.findFirst({ where: eq(studentBio.admissionId, admissionId) }),
      db.query.studentAddress.findFirst({ where: eq(studentAddress.admissionId, admissionId) }),
      db.query.previousAcademic.findFirst({ where: eq(previousAcademic.admissionId, admissionId) }),
      db.query.parentGuardianDetails.findMany({ where: eq(parentGuardianDetails.admissionId, admissionId) }),
      db.query.studentBankDetails.findFirst({ where: eq(studentBankDetails.admissionId, admissionId) }),
      db.query.studentDocuments.findFirst({ 
        where: eq(studentDocuments.admissionId, admissionId),
      }),
      db.query.declarations.findFirst({ where: eq(declarations.admissionId, admissionId) }),
      db.query.siblingDetails.findMany({ where: eq(siblingDetails.admissionId, admissionId) }),
      db.query.documentChecklists.findFirst({ where: eq(documentChecklists.admissionId, admissionId) }),
      db.query.entranceTests.findFirst({ where: eq(entranceTests.admissionId, admissionId) }),
      db.query.homeVisits.findFirst({ where: eq(homeVisits.admissionId, admissionId) })
    ]);

    const sanitizedDocs = documents;

    // Fetch admissionMeta and its linked inquiry/profile using simpler join
    const metaRaw = await db
      .select({
        admissionMeta: admissionMeta,
        inquiry: inquiries,
        studentProfile: studentProfiles
      })
      .from(admissionMeta)
      .leftJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .leftJoin(studentProfiles, eq(admissionMeta.id, studentProfiles.admissionMetaId))
      .where(eq(admissionMeta.id, admissionId))
      .limit(1);

    const firstRow = metaRaw?.[0];
    const meta = firstRow ? {
      ...firstRow.admissionMeta,
      inquiry: firstRow.inquiry,
      studentProfile: firstRow.studentProfile
    } : null;

    // Pre-fill studentBio from Inquiry if fields are empty
    let enrichedBio = bio;
    if (meta?.inquiry) {
      enrichedBio = {
        ...(bio || {}),
        firstName: bio?.firstName || meta.inquiry.firstName,
        lastName: bio?.lastName || meta.inquiry.lastName,
        aadhaarNumber: bio?.aadhaarNumber || meta.inquiry.aadhaarNumber,
      } as any;
    }

    // --- SECURITY: Sign all private S3 URLs before sending to client ---
    if (sanitizedDocs) {
      const docFields = ['birthCertificate', 'studentPhoto', 'marksheet', 'casteCertificate', 'affidavit', 'transferCertificate', 'scholarshipSlip'];
      for (const f of docFields) {
        const val = (sanitizedDocs as any)[f];
        if (val && val !== "__EXISTING__" && !val.startsWith("data:")) {
          (sanitizedDocs as any)[f] = await getSignedDownloadUrl(val) || val;
        }
      }
    }

    if (enrichedBio?.studentPhoto && !enrichedBio.studentPhoto.startsWith("data:")) {
      enrichedBio.studentPhoto = await getSignedDownloadUrl(enrichedBio.studentPhoto) || enrichedBio.studentPhoto;
    }

    if (parents && parents.length > 0) {
      for (const p of parents) {
        if (p.photo && !p.photo.startsWith("data:")) {
          p.photo = await getSignedDownloadUrl(p.photo) || p.photo;
        }
      }
    }

    if (homeVisit) {
      if (homeVisit.visitImage) {
        homeVisit.visitImage = await getSignedDownloadUrl(homeVisit.visitImage) || homeVisit.visitImage;
      }
      if (homeVisit.homePhoto) {
        try {
          const photos = JSON.parse(homeVisit.homePhoto);
          if (Array.isArray(photos)) {
            const signed = await Promise.all(photos.map(p => getSignedDownloadUrl(p)));
            homeVisit.homePhoto = JSON.stringify(signed);
          }
        } catch (e) {
          homeVisit.homePhoto = await getSignedDownloadUrl(homeVisit.homePhoto) || homeVisit.homePhoto;
        }
      }
    }

    if (entranceTest && entranceTest.reportLink) {
      entranceTest.reportLink = await getSignedDownloadUrl(entranceTest.reportLink) || entranceTest.reportLink;
    }

    return {
      success: true,
      data: {
        studentBio: enrichedBio,
        address,
        previousAcademic: academic,
        parentsGuardians: parents,
        bankDetails: bank,
        documents: sanitizedDocs,
        declaration,
        siblings: siblings || [],
        admissionMeta: meta,
        documentChecklist: checklist,
        studentProfile: meta?.studentProfile,
        entranceTest,
        homeVisit
      }
    };
  } catch (error: any) {
    console.error("getAdmissionData error:", error);
    return { success: false, error: error.message };
  }
}



export async function saveAdmissionStep(admissionId: string, step: number, data: any) {
  try {
    const s3Context = await getS3UploadContext(admissionId);
    
    return await db.transaction(async (tx) => {
      let stepResult = null;
      // Partially update based on step
      switch (step) {
        case 1:
        case 2:
          if (data.studentBio) {
            const bioData = sanitizeBioData(data.studentBio);

            // Handle studentPhoto upload if it's base64
            if (bioData.studentPhoto && bioData.studentPhoto.startsWith("data:")) {
              bioData.studentPhoto = await uploadToS3(bioData.studentPhoto, {
                fileName: "studentPhoto", // Unified naming
                admissionId,
                ...s3Context,
                category: "student-documents"
              });
            } else if (bioData.studentPhoto && bioData.studentPhoto.startsWith("http")) {
              // Extract raw S3 URL if a signed one is passed (strips signature)
              bioData.studentPhoto = bioData.studentPhoto.split('?')[0];
            }

            await tx.insert(studentBio).values({ ...bioData, admissionId }).onConflictDoUpdate({
              target: studentBio.admissionId,
              set: bioData
            });

            // Sync back to Inquiry for consistency
            const meta = await tx.query.admissionMeta.findFirst({
              where: eq(admissionMeta.id, admissionId)
            });
            if (meta?.inquiryId) {
              await tx.update(inquiries)
                .set({ 
                  firstName: bioData.firstName, 
                  lastName: bioData.lastName,
                  studentName: `${bioData.firstName} ${bioData.lastName}`,
                  aadhaarNumber: bioData.aadhaarNumber,
                })
                .where(eq(inquiries.id, meta.inquiryId));
            }
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
              const processedParents = await Promise.all(data.parentsGuardians.map(async (p: any) => {
                if (p.photo && p.photo.startsWith("data:")) {
                  const s3Url = await uploadToS3(p.photo, {
                    fileName: `parent_${p.personType}`,
                    admissionId,
                    ...s3Context,
                    category: "student-documents"
                  });
                  return { ...p, photo: s3Url };
                } else if (p.photo && p.photo.startsWith("http")) {
                  // Clean signature if present
                  return { ...p, photo: p.photo.split('?')[0] };
                }
                return p;
              }));
                
              await tx.insert(parentGuardianDetails).values(
                processedParents.map((p: any) => ({ ...p, admissionId }))
              );
              // Sign for client preview
              stepResult = await Promise.all(processedParents.map(async (p: any) => {
                if (p.photo && p.photo.startsWith("http")) {
                  return { ...p, photo: await getSignedDownloadUrl(p.photo) || p.photo };
                }
                return p;
              }));
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
            const folderDocs: any = {};
            
            for (const [key, value] of Object.entries(sanitizedDocs)) {
              if (value && typeof value === 'string' && value.startsWith("data:")) {
                folderDocs[key] = await uploadToS3(value, {
                  fileName: key,
                  admissionId,
                  ...s3Context,
                  category: "student-documents"
                });
              } else if (value === "" || value === null) {
                // Manual Removal Logic: Fetch existing to see if we should delete from S3
                const existing = await tx.query.studentDocuments.findFirst({
                  where: eq(studentDocuments.admissionId, admissionId),
                  columns: { [key as any]: true }
                });
                const oldUrl = (existing as any)?.[key];
                if (oldUrl) {
                  await deleteFromS3(oldUrl);
                }
                folderDocs[key] = null;
              } else if (value && typeof value === 'string' && value.startsWith("http")) {
                folderDocs[key] = value.split('?')[0];
              } else {
                folderDocs[key] = value;
              }
            }

            if (Object.keys(folderDocs).length > 0) {
              await tx.insert(studentDocuments).values({ ...folderDocs, admissionId }).onConflictDoUpdate({
                target: studentDocuments.admissionId,
                set: folderDocs
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

      return { success: true, error: null, updatedData: stepResult };
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
