import { S3Client, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3";
import { db } from "../src/db";
import { studentDocuments, studentBio, parentGuardianDetails, admissionMeta, inquiries, homeVisits, entranceTests } from "../src/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

const DRY_RUN = process.env.DRY_RUN !== "false"; // Default to true for safety
const BUCKET = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME || "wes-files-123507875889-ap-south-1-an";
const ROOT_PREFIX = "dps/2026-27/";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

async function migrate() {
  console.log(`--- S3 Path Simplification (V3) - Removing Class Level ---`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "REAL EXECUTION"}`);

  // 1. Fetch Students to match IDs
  const students = await db.query.admissionMeta.findMany({
    with: { inquiry: true }
  });

  // 2. List all objects in S3
  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: ROOT_PREFIX,
  });

  const { Contents } = await s3Client.send(listCommand);
  if (!Contents) {
    console.log("No objects found.");
    return;
  }

  console.log(`Found ${Contents.length} objects in S3 bucket.`);

  const migrationResults: any[] = [];

  for (const obj of Contents) {
    if (!obj.Key || obj.Key.endsWith("/")) continue;

    const oldKey = obj.Key;
    const parts = oldKey.split("/");
    
    // Pattern: dps/2026-27/[CATEGORY]/[POSSIBLE_CLASS]/[STUDENT_ID]/[FILE]
    // index:    0       1         2              3               4          5
    
    // We only care about paths that have at least 5 segments (meaning a class level exists)
    if (parts.length < 5) continue;

    const category = parts[2];
    const classFolderCandidate = parts[3];
    const studentIdCandidate = parts[4];
    const fileName = parts.slice(5).join("/");

    // We only migrate the known categories
    const validCategories = ["student-documents", "entrance-tests", "home-visits"];
    if (!validCategories.includes(category)) continue;

    // Find student in DB by checking parts[4] (the expected ID location if class is present)
    // or parts[3] (if class is already gone, we check it to avoid double-migrating)
    const student = students.find(s => s.id === studentIdCandidate || s.entryNumber === studentIdCandidate);
    
    if (!student) {
        // If we didn't find the student at parts[4], maybe they are at parts[3]?
        // If they are at parts[3], it means the path is already simplified.
        const alreadySimplified = students.find(s => s.id === classFolderCandidate || s.entryNumber === classFolderCandidate);
        if (alreadySimplified) continue; // Already minimal path
        
        console.log(`[WARN] No student match for candidate ID: ${studentIdCandidate} in path: ${oldKey}`);
        continue;
    }

    // If we reach here, 'student' was found using parts[4] as the ID.
    // This means parts[3] is an extra level (the Class folder) that we want to remove.
    const newKey = `dps/2026-27/${category}/${studentIdCandidate}/${fileName}`;
    
    if (!student) {
        console.log(`[WARN] Could not find student record for ID/UUID: ${studentIdCandidate}`);
        // We might still want to move the file in S3, but we can't update DB.
        // For safety, we'll skip DB but still plan the S3 move.
    }

    // Determine DB Column
    let targetTable = "";
    let targetColumn = "";
    const lowerFile = fileName.toLowerCase();

    if (category === "student-documents") {
        targetTable = "student_documents";
        if (lowerFile.includes("affidavit")) targetColumn = "affidavit";
        else if (lowerFile.includes("birth")) targetColumn = "birthCertificate";
        else if (lowerFile.includes("caste")) targetColumn = "casteCertificate";
        else if (lowerFile.includes("marksheet")) targetColumn = "marksheet";
        else if (lowerFile.includes("transfer")) targetColumn = "transferCertificate";
        else if (lowerFile.includes("photo") || lowerFile.includes("student_photo")) {
            targetTable = "student_bio";
            targetColumn = "studentPhoto";
        } else if (lowerFile.includes("parent_")) {
            targetTable = "parent_guardian_details";
            targetColumn = "photo";
        }
    } else if (category === "entrance-tests") {
        targetTable = "entrance_tests";
        targetColumn = "reportLink";
    } else if (category === "home-visits") {
        targetTable = "home_visits";
        targetColumn = "visitImage";
    }

    if (targetTable && targetColumn && student) {
        console.log(`        DB:   Update ${targetTable}.${targetColumn} for Admission ID ${student.id}`);
    }

    if (!DRY_RUN) {
        // 1. S3 Copy
        await s3Client.send(new CopyObjectCommand({
            Bucket: BUCKET,
            CopySource: `${BUCKET}/${oldKey}`,
            Key: newKey,
        }));
        
        // 2. DB Update
        if (targetTable && targetColumn && student) {
            const newUrl = `https://${BUCKET}.s3.ap-south-1.amazonaws.com/${newKey}`;
            
            if (targetTable === "student_documents") {
                await db.update(studentDocuments).set({ [targetColumn]: newUrl }).where(eq(studentDocuments.admissionId, student.id));
            } else if (targetTable === "student_bio") {
                await db.update(studentBio).set({ studentPhoto: newUrl }).where(eq(studentBio.admissionId, student.id));
            } else if (targetTable === "parent_guardian_details") {
                const personTypeMatch = fileName.match(/parent_([^_]+)/);
                if (personTypeMatch) {
                    const personType = personTypeMatch[1].toUpperCase();
                    await db.update(parentGuardianDetails).set({ photo: newUrl })
                        .where(eq(parentGuardianDetails.admissionId, student.id));
                }
            } else if (targetTable === "home_visits") {
                await db.update(homeVisits).set({ visitImage: newUrl }).where(eq(homeVisits.admissionId, student.id));
            } else if (targetTable === "entrance_tests") {
                await db.update(entranceTests).set({ reportLink: newUrl }).where(eq(entranceTests.admissionId, student.id));
            }
        }
    }

    migrationResults.push({ oldKey, newKey, studentIdCandidate });
  }

  console.log(`\n--- Migration Summary ---`);
  console.log(`Total Planned: ${migrationResults.length}`);
  if (DRY_RUN) console.log(`Run with DRY_RUN=false to execute.`);
}

migrate().catch(console.error);
