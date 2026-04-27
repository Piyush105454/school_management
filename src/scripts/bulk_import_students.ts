import "dotenv/config";
import * as xlsx from "xlsx";
import { db } from "../db";
import { 
  users, 
  inquiries, 
  admissionMeta, 
  studentProfiles, 
  studentBio, 
  parentGuardianDetails,
  classes 
} from "../db/schema";
import { eq, or, sql } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import * as fs from "fs";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Please provide the path to the Excel file.");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Reading Excel file: ${filePath}`);
  const workbook = xlsx.readFile(filePath);
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

  console.log(`Found ${data.length} rows in the sheet.`);

  const academicYear = "2026-27";
  const defaultPassword = "123456";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  const defaultInstitute = "Dhanpuri Public School";

  // Cache classes for faster lookup
  const allClasses = await db.select().from(classes);
  const classMap = new Map(allClasses.map(c => [c.name.toLowerCase(), c.id]));

  for (const row of data) {
    try {
      // 1. Extract and map data
      const name = row["Name"] || row["student_name"] || "";
      if (!name) {
        console.log("Skipping row: Missing Student Name");
        continue;
      }

      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "N/A";

      const aadhaar = String(row["Aadhar Card"] || row["Aadhaar Card"] || row["Aadhar"] || row["Aadhaar Number"] || "").trim();
      const phone = String(row["Father Mobile"] || row["Phone Number"] || row["Mobile"] || row["Father Number"] || "").trim();
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
        console.log(`Skipping row: No Aadhaar or Phone to generate email for ${name}`);
        continue;
      }

      // Format DOB
      let dob: Date;
      if (dobRaw instanceof Date) {
        dob = dobRaw;
      } else if (typeof dobRaw === 'number') {
        // Excel date serial
        dob = new Date((dobRaw - 25569) * 86400 * 1000);
      } else {
        dob = new Date(dobRaw);
      }
      if (isNaN(dob.getTime())) {
        dob = new Date("2000-01-01"); // Default if invalid
      }

      // Calculate Age
      const age = new Date().getFullYear() - dob.getFullYear();

      console.log(`Processing student: ${name} (${email})`);

      await db.transaction(async (tx) => {
        // Check for existing inquiry or user
        const existingInquiry = await tx.query.inquiries.findFirst({
          where: or(
            eq(inquiries.email, email),
            aadhaar ? eq(inquiries.aadhaarNumber, aadhaar) : undefined
          ),
        });

        const existingUser = await tx.query.users.findFirst({
          where: eq(users.email, email),
        });

        let userId: string;
        let inquiryId: string;
        let admissionId: string;

        // 2. Handle User
        if (existingUser) {
          userId = existingUser.id;
          await tx.update(users).set({ phone, updatedAt: new Date() }).where(eq(users.id, userId));
        } else {
          const [newUser] = await tx.insert(users).values({
            email,
            password: hashedPassword,
            role: "STUDENT_PARENT",
            phone,
          }).returning();
          userId = newUser.id;
        }

        // 3. Handle Inquiry
        if (existingInquiry) {
          inquiryId = existingInquiry.id;
          await tx.update(inquiries).set({
            firstName,
            lastName,
            studentName: name,
            parentName,
            phone,
            appliedClass,
            school: defaultInstitute,
            aadhaarNumber: aadhaar,
            updatedAt: new Date(),
          }).where(eq(inquiries.id, inquiryId));
        } else {
          // Generate entry numbers
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

          const [newInquiry] = await tx.insert(inquiries).values({
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
          inquiryId = newInquiry.id;
        }

        // 4. Handle Admission Meta
        const existingMeta = await tx.query.admissionMeta.findFirst({
          where: eq(admissionMeta.inquiryId, inquiryId),
        });

        if (existingMeta) {
          admissionId = existingMeta.id;
          await tx.update(admissionMeta).set({
            scholarNumber,
            updatedAt: new Date(),
          }).where(eq(admissionMeta.id, admissionId));
        } else {
          const yearSuffix = academicYear.replace("20", "").replace("-", "");
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

          const [newMeta] = await tx.insert(admissionMeta).values({
            inquiryId,
            academicYear,
            entryNumber: entryNumberADM,
            scholarNumber,
            admissionType: "NEW",
          }).returning();
          admissionId = newMeta.id;
        }

        // 5. Handle Student Profile
        const existingProfile = await tx.query.studentProfiles.findFirst({
          where: eq(studentProfiles.userId, userId),
        });
        if (!existingProfile) {
          await tx.insert(studentProfiles).values({
            userId,
            admissionMetaId: admissionId,
            admissionStep: 1,
            isFullyAdmitted: false,
          });
        }

        // 6. Handle Student Bio
        const existingBio = await tx.query.studentBio.findFirst({
          where: eq(studentBio.admissionId, admissionId),
        });
        if (existingBio) {
          await tx.update(studentBio).set({
            firstName,
            lastName,
            dob,
            age,
            aadhaarNumber: aadhaar,
          }).where(eq(studentBio.id, existingBio.id));
        } else {
          await tx.insert(studentBio).values({
            admissionId,
            firstName,
            lastName,
            gender: (row["Gender"]?.startsWith("F") || row["Sex"]?.startsWith("F")) ? "F" : "M", // Guessing
            dob,
            age,
            caste: "GEN",
            aadhaarNumber: aadhaar,
          });
        }

        // 7. Handle Parent Details
        const existingParent = await tx.query.parentGuardianDetails.findFirst({
          where: eq(parentGuardianDetails.admissionId, admissionId),
        });
        if (existingParent) {
          await tx.update(parentGuardianDetails).set({
            name: parentName,
            mobileNumber: phone,
          }).where(eq(parentGuardianDetails.id, existingParent.id));
        } else {
          await tx.insert(parentGuardianDetails).values({
            admissionId,
            personType: "FATHER",
            name: parentName,
            mobileNumber: phone,
            relation: "Father",
          });
        }
      });

      console.log(`Successfully processed ${name}`);
    } catch (err) {
      console.error(`Error processing row for ${row["Name"]}:`, err);
    }
  }

  console.log("Import finished.");
  process.exit(0);
}

main().catch(console.error);
