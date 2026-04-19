import "dotenv/config";
import postgres from "postgres";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// SOURCE DATABASE URL (from user request)
const SOURCE_DB_URL = "postgresql://neondb_owner:npg_GMHq6e9zEanu@ep-steep-truth-adyyasdg-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// S3 CONFIG
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "wes-files-123507875889-ap-south-1-an";
const ACADEMIC_YEAR = "2026-27";

const sql = postgres(SOURCE_DB_URL, { ssl: "require" });

async function uploadBase64ToS3(base64Data: string, studentName: string, docType: string, admissionId: string) {
  if (!base64Data || !base64Data.startsWith("data:")) return null;

  try {
    const mimeMatch = base64Data.match(/^data:(.*);base64,(.*)$/);
    if (!mimeMatch) return null;

    const contentType = mimeMatch[1];
    const base64String = mimeMatch[2];
    const buffer = Buffer.from(base64String, "base64");

    let extension = "bin";
    if (contentType === "application/pdf") extension = "pdf";
    else if (contentType.startsWith("image/")) extension = contentType.split("/")[1] || "jpg";

    const cleanName = studentName.replace(/[^a-zA-Z0-9]/g, "_");
    const key = `dps/${ACADEMIC_YEAR}/studentdocuments/${cleanName}/${docType}_${admissionId}.${extension}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));

    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${key}`;
  } catch (error) {
    console.error(`Error uploading ${docType} for ${studentName}:`, error);
    return null;
  }
}

async function migrate() {
  console.log("Starting migration...");

  try {
    // 1. Migrate student_documents
    console.log("Checking student_documents table...");
    const docs = await sql`
      SELECT sd.*, i.student_name 
      FROM student_documents sd
      JOIN admission_meta am ON sd.admission_id = am.id
      JOIN inquiries i ON am.inquiry_id = i.id
    `;

    const docFields = [
      "birth_certificate", "student_photo", "marksheet", 
      "caste_certificate", "affidavit", "transfer_certificate", "scholarship_slip"
    ];

    for (const row of docs) {
      const studentName = row.student_name || "Unknown";
      const admissionId = row.admission_id;
      
      for (const field of docFields) {
        const value = row[field];
        if (value && value.startsWith("data:")) {
          console.log(`Migrating ${field} for ${studentName}...`);
          const s3Url = await uploadBase64ToS3(value, studentName, field, admissionId);
          if (s3Url) {
            await sql`
              UPDATE student_documents 
              SET ${sql(field)} = ${s3Url}, updated_at = NOW() 
              WHERE admission_id = ${admissionId}
            `;
          }
        }
      }
    }

    // 2. Migrate student_bio
    console.log("Checking student_bio table...");
    const bios = await sql`
      SELECT sb.*, i.student_name 
      FROM student_bio sb
      JOIN admission_meta am ON sb.admission_id = am.id
      JOIN inquiries i ON am.inquiry_id = i.id
    `;

    for (const row of bios) {
      if (row.student_photo && row.student_photo.startsWith("data:")) {
        console.log(`Migrating student photo for ${row.student_name}...`);
        const s3Url = await uploadBase64ToS3(row.student_photo, row.student_name || "Unknown", "profile_photo", row.admission_id);
        if (s3Url) {
          await sql`UPDATE student_bio SET student_photo = ${s3Url} WHERE id = ${row.id}`;
        }
      }
    }

    // 3. Migrate parent_guardian_details
    console.log("Checking parent_guardian_details table...");
    const parents = await sql`
      SELECT pg.*, i.student_name 
      FROM parent_guardian_details pg
      JOIN admission_meta am ON pg.admission_id = am.id
      JOIN inquiries i ON am.inquiry_id = i.id
    `;

    for (const row of parents) {
      if (row.photo && row.photo.startsWith("data:")) {
        console.log(`Migrating parent photo (${row.person_type}) for student ${row.student_name}...`);
        const s3Url = await uploadBase64ToS3(row.photo, row.student_name || "Unknown", `parent_${row.person_type}`, row.admission_id);
        if (s3Url) {
          await sql`UPDATE parent_guardian_details SET photo = ${s3Url} WHERE id = ${row.id}`;
        }
      }
    }

    // 4. Migrate declarations
    console.log("Checking declarations table...");
    const decls = await sql`
      SELECT d.*, i.student_name 
      FROM declarations d
      JOIN admission_meta am ON d.admission_id = am.id
      JOIN inquiries i ON am.inquiry_id = i.id
    `;

    for (const row of decls) {
      if (row.signature_file && row.signature_file.startsWith("data:")) {
        console.log(`Migrating signature for ${row.student_name}...`);
        const s3Url = await uploadBase64ToS3(row.signature_file, row.student_name || "Unknown", "signature", row.admission_id);
        if (s3Url) {
          await sql`UPDATE declarations SET signature_file = ${s3Url} WHERE id = ${row.id}`;
        }
      }
    }

    // 5. Migrate home_visits
    console.log("Checking home_visits table...");
    const visits = await sql`
      SELECT hv.*, i.student_name 
      FROM home_visits hv
      JOIN admission_meta am ON hv.admission_id = am.id
      JOIN inquiries i ON am.inquiry_id = i.id
    `;

    for (const row of visits) {
      if (row.visit_image && row.visit_image.startsWith("data:")) {
        console.log(`Migrating visit image for ${row.student_name}...`);
        const s3Url = await uploadBase64ToS3(row.visit_image, row.student_name || "Unknown", "visit_image", row.admission_id);
        if (s3Url) {
          await sql`UPDATE home_visits SET visit_image = ${s3Url}, updated_at = NOW() WHERE id = ${row.id}`;
        }
      }
      if (row.home_photo && row.home_photo.startsWith("data:")) {
        console.log(`Migrating home photo for ${row.student_name}...`);
        const s3Url = await uploadBase64ToS3(row.home_photo, row.student_name || "Unknown", "home_photo", row.admission_id);
        if (s3Url) {
          await sql`UPDATE home_visits SET home_photo = ${s3Url}, updated_at = NOW() WHERE id = ${row.id}`;
        }
      }
    }

    // 6. Migrate entrance_tests
    console.log("Checking entrance_tests table...");
    const tests = await sql`
      SELECT et.*, i.student_name 
      FROM entrance_tests et
      JOIN admission_meta am ON et.admission_id = am.id
      JOIN inquiries i ON am.inquiry_id = i.id
    `;

    for (const row of tests) {
      if (row.report_link && row.report_link.startsWith("data:")) {
        console.log(`Migrating test report for ${row.student_name}...`);
        const s3Url = await uploadBase64ToS3(row.report_link, row.student_name || "Unknown", "test_report", row.admission_id);
        if (s3Url) {
          await sql`UPDATE entrance_tests SET report_link = ${s3Url}, updated_at = NOW() WHERE id = ${row.id}`;
        }
      }
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

migrate();
