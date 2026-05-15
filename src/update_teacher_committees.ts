import { db } from "./db";
import { teachers } from "./db/schema";
import { eq, ilike } from "drizzle-orm";

const assignments = [
  { name: "Reena Chakravarty", committees: "Sexual Harassment Committee/Internal Complaints Committee, Grievance Redressal Committee" },
  { name: "Shahnaj Bee", committees: "School Management Committee (SMC)" },
  { name: "Saida Najmi", committees: "Academic Committee" },
  { name: "Neetu Yadav", committees: "Examination Committee" },
  { name: "Rajni Vishwakarma", committees: "Disaster Management Committee" },
  { name: "Abdul Waseem", committees: "School Discipline Committee, Anti-Bullying Committee, Child Protection Committee" },
  { name: "Saiba Bano", committees: "Cultural & Co-curricular Activities Committee" },
  { name: "Vacancy", committees: "Health & Wellness Committee, Inclusive Education/Special Needs Committee" }
];

async function updateCommittees() {
  console.log("Updating teacher committee assignments...");

  for (const assign of assignments) {
    try {
      const teacher = await db.query.teachers.findFirst({
        where: ilike(teachers.name, `%${assign.name}%`)
      });

      if (teacher) {
        await db.update(teachers)
          .set({ committees: assign.committees })
          .where(eq(teachers.id, teacher.id));
        console.log(`✅ Updated: "${teacher.name}" (Matched with "${assign.name}")`);
      } else {
        console.log(`⚠️ Not found: "${assign.name}"`);
      }
    } catch (error: any) {
      console.error(`❌ Error updating "${assign.name}":`, error.message);
    }
  }

  console.log("Finished updating assignments.");
}

updateCommittees()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
