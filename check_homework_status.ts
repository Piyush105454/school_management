import { db } from "./src/db";
import { eq, or } from "drizzle-orm";
import { studentProfiles, admissionMeta, students, users } from "./src/db/schema";

async function checkStudentStatus(userId: string) {
  console.log("Checking status for User ID:", userId);

  // 1. User
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });
  console.log("User:", user);

  // 2. Profile
  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId)
  });
  console.log("Profile:", profile);

  if (!profile || !profile.admissionMetaId) {
    console.log("No admission meta linked to profile.");
    return;
  }

  // 3. Meta
  const meta = await db.query.admissionMeta.findFirst({
    where: eq(admissionMeta.id, profile.admissionMetaId)
  });
  console.log("Admission Meta:", meta);

  if (!meta) return;

  // 4. Student (Academy Record)
  console.log("Searching in 'students' table...");
  console.log("Using admissionNumber:", meta.admissionNumber);
  console.log("Using scholarNumber:", meta.scholarNumber);

  const studentEntry = await db.query.students.findFirst({
    where: (table, { eq, or }) => or(
      meta.admissionNumber ? eq(table.studentId, meta.admissionNumber) : undefined,
      meta.scholarNumber ? eq(table.studentId, meta.scholarNumber) : undefined
    ),
    with: {
        class: true
    }
  });

  console.log("Student Academy Entry:", studentEntry);
}

// Need to find the user ID from session. 
// Since I can't get session here, I'll search for student users.
async function findAnyStudentAndCheck() {
    const allStudents = await db.query.studentProfiles.findMany({
        limit: 5
    });
    for (const s of allStudents) {
        await checkStudentStatus(s.userId);
        console.log("-------------------");
    }
}

findAnyStudentAndCheck().catch(console.error);
