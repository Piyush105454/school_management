import { db } from "./src/db";
import { inquiries, admissionMeta, students, scholarshipAttendance, studentAttendance } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const inq = await db.query.inquiries.findFirst({
    where: eq(inquiries.studentName, "Demo DPS Student")
  });
  if (!inq) {
    console.log("No inquiry found");
    return;
  }
  const meta = await db.query.admissionMeta.findFirst({
    where: eq(admissionMeta.inquiryId, inq.id)
  });
  if (!meta) {
    console.log("No meta found");
    return;
  }
  const student = await db.query.students.findFirst({
    where: eq(students.studentId, meta.entryNumber)
  });

  console.log("Meta ID:", meta.id);
  console.log("Student ID (number):", student?.id, "studentId (str):", student?.studentId);

  const sch = await db.query.scholarshipAttendance.findMany({
    where: eq(scholarshipAttendance.admissionId, meta.id)
  });
  console.log("scholarshipAttendance rows:", JSON.stringify(sch, null, 2));

  if (student) {
    const att = await db.query.studentAttendance.findMany({
      where: eq(studentAttendance.studentId, student.id)
    });
    console.log("studentAttendance all rows count:", att.length);
    console.log("studentAttendance all rows:", JSON.stringify(att, null, 2));
  }
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
