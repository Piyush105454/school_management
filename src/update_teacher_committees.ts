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
  { name: "Vacancy", committees: "Health & Wellness Committee, Inclusive Education/Special Needs Committee" },
  { name: "Rajim Ali", committees: "" },
  { name: "Vaishali Dahiya", committees: "" },
  { name: "Esha Tiwari", committees: "" },
  { name: "Intern 1", committees: "" },
  { name: "Intern 2", committees: "" },
  { name: "Intern 3", committees: "" },
  { name: "Aruna Mahto", committees: "" },
  { name: "Munni", committees: "" },
  { name: "Male Peon", committees: "" },
  { name: "Afifa Khan", committees: "" },
  { name: "Muskan Bee", committees: "" },
  { name: "Aditya Tiwari", committees: "" },
  { name: "Fazila Ambara", committees: "" },
  { name: "Riya Soni", committees: "" }
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
        // Create the teacher if not found
        console.log(`➕ Creating missing teacher: "${assign.name}"`);
        await db.insert(teachers).values({
          name: assign.name,
          committees: assign.committees,
          institute: "Dhanpuri Public School" // Defaulting to DPS as per image
        });
        console.log(`✅ Created and assigned: "${assign.name}"`);
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
