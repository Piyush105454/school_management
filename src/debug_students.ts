import { db } from "@/db";
import { studentProfiles, admissionMeta, inquiries } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";

async function debugStudents() {
  try {
    console.log("🔍 Debugging student data in Class 4...\n");

    const className = "4";
    const potentialNames = [
      className,
      `Class ${className}`,
      `CLASS ${className}`,
    ];

    // Check 1: How many students applied for class 4?
    const appliedForClass4 = await db
      .select({ count: require('drizzle-orm').count() })
      .from(inquiries)
      .where(inArray(inquiries.appliedClass, potentialNames));
    
    console.log("1️⃣ Students who applied for Class 4:", appliedForClass4);

    // Check 2: How many are in admissionMeta?
    const inAdmissionMeta = await db
      .select()
      .from(admissionMeta)
      .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .where(inArray(inquiries.appliedClass, potentialNames));
    
    console.log("\n2️⃣ In admission_meta for Class 4:", inAdmissionMeta.length);

    // Check 3: How many have student_profiles (fully admitted vs not)?
    const studentProfilesClass4 = await db
      .select({
        admissionId: admissionMeta.id,
        isFullyAdmitted: studentProfiles.isFullyAdmitted,
        studentName: inquiries.studentName,
        appliedClass: inquiries.appliedClass,
      })
      .from(studentProfiles)
      .innerJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
      .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .where(inArray(inquiries.appliedClass, potentialNames));
    
    console.log("\n3️⃣ Student profiles for Class 4 (all admission statuses):");
    studentProfilesClass4.forEach(s => {
      console.log(`  - ${s.studentName}: isFullyAdmitted = ${s.isFullyAdmitted}`);
    });

    // Check 4: How many are FULLY ADMITTED?
    const fullyAdmitted = studentProfilesClass4.filter(s => s.isFullyAdmitted === true);
    console.log(`\n4️⃣ Fully admitted students in Class 4: ${fullyAdmitted.length}`);

    // Check 5: How many are NOT fully admitted?
    const notFullyAdmitted = studentProfilesClass4.filter(s => s.isFullyAdmitted === false);
    console.log(`5️⃣ NOT fully admitted students in Class 4: ${notFullyAdmitted.length}`);
    
    if (notFullyAdmitted.length > 0) {
      console.log("\n   These students need to mark step as complete:");
      notFullyAdmitted.forEach(s => console.log(`   - ${s.studentName}`));
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

debugStudents();
