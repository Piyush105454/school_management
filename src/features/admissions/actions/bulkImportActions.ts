"use server";

import * as xlsx from "xlsx";
import { db } from "@/db";
import { 
  users, 
  inquiries, 
  admissionMeta, 
  studentProfiles, 
  studentBio, 
  parentGuardianDetails 
} from "@/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function bulkImportStudentsAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    const bytes = await file.arrayBuffer();
    const workbook = xlsx.read(bytes, { type: "array" });
    
    // Find the best sheet (prefer "All" or the one with most data)
    let sheetName = workbook.SheetNames.find(n => n.toLowerCase() === "all") || workbook.SheetNames[0];
    let sheet = workbook.Sheets[sheetName];
    
    // Try to find the header row by looking for "Name" or "Scholar"
    let data = xlsx.utils.sheet_to_json(sheet) as any[];
    
    // If first row doesn't have Name, try starting from row 1 or 2
    if (data.length > 0 && !data[0]["Name"] && !data[0]["student_name"]) {
      for (let r = 1; r < 5; r++) {
        const testData = xlsx.utils.sheet_to_json(sheet, { range: r }) as any[];
        if (testData.length > 0 && (testData[0]["Name"] || testData[0]["student_name"] || testData[0]["Scholar"])) {
          data = testData;
          break;
        }
      }
    }

    const academicYear = "2026-27";
    const defaultPassword = "123456";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const defaultInstitute = "Dhanpuri Public School";

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    console.log(`Starting import of ${data.length} rows...`);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // 1. Extract and map data
        const name = row["Name"] || row["student_name"] || "";
        if (!name) continue;

        const aadhaar = String(row["Aadhar Card"] || row["Aadhaar Card"] || row["Aadhar"] || row["Aadhaar Number"] || "").trim();
        const phone = String(row["Father Mobile"] || row["Phone Number"] || row["Mobile"] || row["Father Number"] || "").trim();

        // 2. SKIP IF AADHAAR EXISTS
        if (aadhaar && aadhaar.length >= 12) {
          const existing = await db.query.inquiries.findFirst({
            where: eq(inquiries.aadhaarNumber, aadhaar),
          });
          if (existing) {
            console.log(`[SKIP] Student ${name} already exists with Aadhaar ${aadhaar}`);
            skipCount++;
            continue;
          }
        }

        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "N/A";

        const parentName = row["Father Name"] || row["Parent Name"] || row["Guardian Name"] || "";
        const appliedClass = row["Class"] || "";
        const dobRaw = row["DOB"] || row["Date of Birth"] || "";
        const scholarNumber = String(row["Scholar"] || row["Scholar Number"] || "").trim();

        // Generate Email
        let email = "";
        if (aadhaar && aadhaar.length >= 12) {
          email = `${aadhaar}@gmail.com`;
        } else if (phone && phone.length >= 10) {
          email = `${phone}@gmail.com`;
        } else {
          continue;
        }

        // Check for Email existence too
        const existingEmail = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (existingEmail) {
          console.log(`[SKIP] Student ${name} already exists with Email ${email}`);
          skipCount++;
          continue;
        }

        // Format DOB
        let dob: Date;
        if (dobRaw instanceof Date) {
          dob = dobRaw;
        } else if (typeof dobRaw === 'number') {
          dob = new Date((dobRaw - 25569) * 86400 * 1000);
        } else {
          dob = new Date(dobRaw);
        }
        if (isNaN(dob.getTime())) {
          dob = new Date("2000-01-01");
        }

        const age = new Date().getFullYear() - dob.getFullYear();

        await db.transaction(async (tx) => {
          // 3. Create User
          const [user] = await tx.insert(users).values({
            email,
            password: hashedPassword,
            role: "STUDENT_PARENT",
            phone,
          }).returning();

          // 4. Create Inquiry
          const yearSuffix = academicYear.replace("20", "").replace("-", "");
          const lastInquiry = await tx.query.inquiries.findFirst({
            where: eq(inquiries.academicYear, academicYear),
            orderBy: (inquiries, { desc }) => [desc(inquiries.entryNumber)],
          });
          let nextVal = 1;
          if (lastInquiry?.entryNumber) {
            const match = lastInquiry.entryNumber.match(/\d+$/);
            if (match) nextVal = parseInt(match[0], 10) + 1;
          }
          const nextNumStr = nextVal.toString().padStart(4, '0');
          const entryNumberENQ = `ENQ-${yearSuffix}-${nextNumStr}`;

          const [inquiry] = await tx.insert(inquiries).values({
            firstName,
            lastName,
            studentName: name,
            parentName,
            email,
            phone,
            appliedClass,
            school: defaultInstitute,
            academicYear,
            entryNumber: entryNumberENQ,
            aadhaarNumber: aadhaar,
            passwordPlain: defaultPassword,
            status: "SHORTLISTED",
          }).returning();

          // 5. Create AdmissionMeta
          const lastMeta = await tx.query.admissionMeta.findFirst({
            where: eq(admissionMeta.academicYear, academicYear),
            orderBy: (admissionMeta, { desc }) => [desc(admissionMeta.entryNumber)],
          });
          let nextMetaVal = 1;
          if (lastMeta?.entryNumber) {
            const match = lastMeta.entryNumber.match(/\d+$/);
            if (match) nextMetaVal = parseInt(match[0], 10) + 1;
          }
          const nextMetaNumStr = nextMetaVal.toString().padStart(4, '0');
          const entryNumberADM = `ADM-${yearSuffix}-${nextMetaNumStr}`;

          const [meta] = await tx.insert(admissionMeta).values({
            inquiryId: inquiry.id,
            academicYear,
            entryNumber: entryNumberADM,
            scholarNumber,
            admissionType: "NEW",
          }).returning();

          // 6. Create Profile, Bio, Parent
          await tx.insert(studentProfiles).values({
            userId: user.id,
            admissionMetaId: meta.id,
            admissionStep: 1,
          });

          await tx.insert(studentBio).values({
            admissionId: meta.id,
            firstName,
            lastName,
            gender: (row["Gender"]?.startsWith("F") || row["Sex"]?.startsWith("F")) ? "F" : "M",
            dob,
            age,
            caste: "GEN",
            aadhaarNumber: aadhaar,
          });

          await tx.insert(parentGuardianDetails).values({
            admissionId: meta.id,
            personType: "FATHER",
            name: parentName,
            mobileNumber: phone,
            relation: "Father",
          });
        });

        successCount++;
        if (successCount % 10 === 0) console.log(`Processed ${successCount} students...`);
      } catch (err) {
        console.error(`Error row ${i}:`, err);
        errorCount++;
      }
    }

    console.log(`Import finished: ${successCount} success, ${skipCount} skipped, ${errorCount} errors.`);
    revalidatePath("/office/inquiries");
    return { 
      success: true, 
      message: `Import Completed! \n✅ Success: ${successCount} \n⏭️ Skipped: ${skipCount} (Already in database) \n❌ Errors: ${errorCount}` 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
