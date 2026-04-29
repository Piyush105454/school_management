"use server";

import { db } from "@/db";
import { 
  studentBio, 
  studentAddress, 
  previousAcademic, 
  parentGuardianDetails, 
  studentBankDetails 
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

function parseExcelDate(excelDate: any) {
  if (!excelDate) return null;
  if (typeof excelDate === 'number') {
    // Excel dates are days since 1900-01-01
    // 25569 is the number of days between 1900-01-01 and 1970-01-01
    return new Date((excelDate - 25569) * 86400 * 1000);
  }
  if (typeof excelDate === 'string') {
    const parsed = new Date(excelDate);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function parseAddressString(addressStr: string) {
  // E.g., "Ward No. 17 Dhanpuri Distt Shahdol Madhya Pradesh 484114"
  if (!addressStr) return {};
  
  const updates: any = {};
  
  const pinMatch = addressStr.match(/\b\d{6}\b/);
  if (pinMatch) {
    updates.pinCode = pinMatch[0];
  }
  
  const wardMatch = addressStr.match(/Ward No\.?\s*(\d+)/i);
  if (wardMatch) {
    updates.wardNo = wardMatch[1];
  }

  const disttMatch = addressStr.match(/Distt\.?\s+([A-Za-z]+)/i);
  if (disttMatch) {
    updates.district = disttMatch[1];
  }

  // Just store the whole thing in street as a fallback/full address reference
  updates.street = addressStr;
  
  // We need to provide dummy or extracted values for not-null columns if they don't exist
  // Wait, these tables should already exist, we are just updating, so not-null is not an issue for updates.
  return updates;
}

export async function importBulkStudentData(rows: any[]) {
  let processed = 0;
  let skipped = 0;

  console.log(`[Bulk Import] Starting import of ${rows.length} rows...`);

  for (const rawRow of rows) {
    const row: any = {};
    for (const key of Object.keys(rawRow)) {
      row[key.trim()] = rawRow[key];
    }

    const aadhar = row["Aadhar Card"] || row["Aadhar No"] || row["Aadhar No."];
    if (!aadhar) {
      console.log(`[Bulk Import] Skipped row: No Aadhar found.`);
      skipped++;
      continue;
    }

    console.log(`[Bulk Import] Processing Aadhar: ${aadhar}...`);

    // Find the student bio record
    const bio = await db.query.studentBio.findFirst({
      where: eq(studentBio.aadhaarNumber, String(aadhar).trim())
    });

    if (!bio) {
      console.log(`[Bulk Import] Skipped: Aadhar ${aadhar} not found in database.`);
      skipped++;
      continue; 
    }

    console.log(`[Bulk Import] Found match for Aadhar ${aadhar} (Admission ID: ${bio.admissionId}). Updating records...`);

    const admissionId = bio.admissionId;

    // 1. Update Bio Info
    const bioUpdates: any = {};
    if (row["DOB"]) {
      const dob = parseExcelDate(row["DOB"]);
      if (dob) bioUpdates.dob = dob;
    }
    if (row["Age"]) bioUpdates.age = parseInt(row["Age"], 10);
    
    if (row["Gender"]) {
      const g = String(row["Gender"]).trim().toUpperCase();
      if (g.startsWith("M")) bioUpdates.gender = "M";
      else if (g.startsWith("F")) bioUpdates.gender = "F";
      else bioUpdates.gender = "O";
    }

    if (row["Caste"]) {
      const c = String(row["Caste"]).trim().toUpperCase();
      if (["GEN", "OBC", "ST", "SC"].includes(c)) {
        bioUpdates.caste = c as any;
      }
    }

    if (row["Religion"]) bioUpdates.religion = String(row["Religion"]).trim();
    if (row["Samagra ID"]) bioUpdates.samagraId = String(row["Samagra ID"]).trim();
    if (row["Blood Group"]) bioUpdates.bloodGroup = String(row["Blood Group"]).trim();

    const [existingAddress, existingAcademic, existingFather, existingMother, existingBank] = await Promise.all([
      db.query.studentAddress.findFirst({ where: eq(studentAddress.admissionId, admissionId) }),
      db.query.previousAcademic.findFirst({ where: eq(previousAcademic.admissionId, admissionId) }),
      db.query.parentGuardianDetails.findFirst({ where: and(eq(parentGuardianDetails.admissionId, admissionId), eq(parentGuardianDetails.personType, "FATHER")) }),
      db.query.parentGuardianDetails.findFirst({ where: and(eq(parentGuardianDetails.admissionId, admissionId), eq(parentGuardianDetails.personType, "MOTHER")) }),
      db.query.studentBankDetails.findFirst({ where: eq(studentBankDetails.admissionId, admissionId) })
    ]);

    const updatePromises: Promise<any>[] = [];

    if (Object.keys(bioUpdates).length > 0) {
      console.log(`[Bulk Import] -> Updating Bio Info:`, Object.keys(bioUpdates));
      updatePromises.push(
        db.update(studentBio).set(bioUpdates).where(eq(studentBio.id, bio.id))
      );
    }

    // 2. Update Address
    const addressStr = row["Address (House, Street, City/Town, District, State PIN)"];
    if (addressStr) {
      const addressUpdates = parseAddressString(String(addressStr));
      if (Object.keys(addressUpdates).length > 0) {
        if (existingAddress) {
          console.log(`[Bulk Import] -> Updating Address`);
          updatePromises.push(
            db.update(studentAddress).set(addressUpdates).where(eq(studentAddress.id, existingAddress.id))
          );
        } else {
          console.log(`[Bulk Import] -> Inserting Address`);
          updatePromises.push(
            db.insert(studentAddress).values({
              admissionId,
              houseNo: "N/A",
              street: addressUpdates.street || "N/A",
              village: "N/A",
              ...addressUpdates
            })
          );
        }
      }
    }

    // 3. Update Previous Academic
    const prevSchool = row["Previous School Name"];
    const apaarId = row["APAAR ID"];
    const penNo = row["PEN NO"];

    if (prevSchool || apaarId || penNo) {
      const academicUpdates: any = {};
      if (prevSchool) academicUpdates.schoolName = String(prevSchool).trim();
      if (apaarId) academicUpdates.apaarId = String(apaarId).trim();
      if (penNo) academicUpdates.penNumber = String(penNo).trim();

      if (existingAcademic) {
        console.log(`[Bulk Import] -> Updating Academic Info`);
        updatePromises.push(
          db.update(previousAcademic).set(academicUpdates).where(eq(previousAcademic.id, existingAcademic.id))
        );
      } else {
        console.log(`[Bulk Import] -> Inserting Academic Info`);
        updatePromises.push(
          db.insert(previousAcademic).values({
            admissionId,
            schoolName: academicUpdates.schoolName || "N/A",
            schoolType: "N/A",
            ...academicUpdates
          })
        );
      }
    }

    // 4. Update Parents Details
    // Father
    if (row["Father Name"] || row["Father Mobile"] || row["Father Occupation"] || row["Aadhar of Father"]) {
      const fatherUpdates: any = {
        name: row["Father Name"] ? String(row["Father Name"]).trim() : "N/A",
        mobileNumber: row["Father Mobile"] ? String(row["Father Mobile"]).trim() : "N/A",
      };
      if (row["Father Occupation"]) fatherUpdates.occupation = String(row["Father Occupation"]).trim();
      if (row["Aadhar of Father"]) fatherUpdates.aadhaarNumber = String(row["Aadhar of Father"]).trim();

      if (existingFather) {
        const updatesToApply: any = {};
        if (row["Father Name"]) updatesToApply.name = fatherUpdates.name;
        if (row["Father Mobile"]) updatesToApply.mobileNumber = fatherUpdates.mobileNumber;
        if (row["Father Occupation"]) updatesToApply.occupation = fatherUpdates.occupation;
        if (row["Aadhar of Father"]) updatesToApply.aadhaarNumber = fatherUpdates.aadhaarNumber;

        if (Object.keys(updatesToApply).length > 0) {
            console.log(`[Bulk Import] -> Updating Father Details:`, Object.keys(updatesToApply));
            updatePromises.push(
              db.update(parentGuardianDetails).set(updatesToApply).where(eq(parentGuardianDetails.id, existingFather.id))
            );
        }
      } else {
        console.log(`[Bulk Import] -> Inserting Father Details`);
        updatePromises.push(
          db.insert(parentGuardianDetails).values({
            admissionId,
            personType: "FATHER",
            ...fatherUpdates
          })
        );
      }
    }

    // Mother
    if (row["Mother Name"] || row["Mobile Mother"] || row["Mother Occupation"] || row["Aadhar of Mother"]) {
      const motherUpdates: any = {
        name: row["Mother Name"] ? String(row["Mother Name"]).trim() : "N/A",
        mobileNumber: row["Mobile Mother"] ? String(row["Mobile Mother"]).trim() : "N/A",
      };
      if (row["Mother Occupation"]) motherUpdates.occupation = String(row["Mother Occupation"]).trim();
      if (row["Aadhar of Mother"]) motherUpdates.aadhaarNumber = String(row["Aadhar of Mother"]).trim();

      if (existingMother) {
        const updatesToApply: any = {};
        if (row["Mother Name"]) updatesToApply.name = motherUpdates.name;
        if (row["Mobile Mother"]) updatesToApply.mobileNumber = motherUpdates.mobileNumber;
        if (row["Mother Occupation"]) updatesToApply.occupation = motherUpdates.occupation;
        if (row["Aadhar of Mother"]) updatesToApply.aadhaarNumber = motherUpdates.aadhaarNumber;

        if (Object.keys(updatesToApply).length > 0) {
            console.log(`[Bulk Import] -> Updating Mother Details:`, Object.keys(updatesToApply));
            updatePromises.push(
              db.update(parentGuardianDetails).set(updatesToApply).where(eq(parentGuardianDetails.id, existingMother.id))
            );
        }
      } else {
        console.log(`[Bulk Import] -> Inserting Mother Details`);
        updatePromises.push(
          db.insert(parentGuardianDetails).values({
            admissionId,
            personType: "MOTHER",
            ...motherUpdates
          })
        );
      }
    }

    // 5. Update Bank Info
    const ifsc = row["IFSC"];
    const bankAccountNo = row["Bank Account No"];

    if (ifsc || bankAccountNo) {
      const bankUpdates: any = {};
      if (ifsc) bankUpdates.ifscCode = String(ifsc).trim();
      if (bankAccountNo) bankUpdates.accountNumber = String(bankAccountNo).trim();

      if (existingBank) {
        console.log(`[Bulk Import] -> Updating Bank Details`);
        updatePromises.push(
          db.update(studentBankDetails).set(bankUpdates).where(eq(studentBankDetails.id, existingBank.id))
        );
      } else {
        console.log(`[Bulk Import] -> Inserting Bank Details`);
        updatePromises.push(
          db.insert(studentBankDetails).values({
            admissionId,
            ...bankUpdates
          })
        );
      }
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    processed++;
    console.log(`[Bulk Import] Completed Aadhar: ${aadhar}\n`);
  }

  console.log(`[Bulk Import] Done! Processed: ${processed}, Skipped: ${skipped}`);
  return { success: true, processed, skipped };
}
