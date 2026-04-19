import "dotenv/config";
import postgres from "postgres";

const OLD_DB_URL = "postgresql://neondb_owner:npg_GMHq6e9zEanu@ep-steep-truth-adyyasdg-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const NEW_DB_URL = process.env.DATABASE_URL!;

async function research() {
  const oldSql = postgres(OLD_DB_URL, { ssl: "require" });
  const newSql = postgres(NEW_DB_URL, { ssl: "require" });

  const tables = [
    "users", "inquiries", "admission_meta", "student_profiles", "student_bio", 
    "student_address", "student_bank_details", "previous_academic", 
    "sibling_details", "parent_guardian_details", "declarations", 
    "document_checklists", "student_documents", "entrance_tests", "home_visits",
    "classes", "students", "subjects", "units", "chapters", "chapter_pdfs", "lesson_plans"
  ];

  console.log("Researching row counts...");
  console.log("------------------------------------------------------------------");
  console.log("Table".padEnd(25) + " | " + "Old DB".padEnd(10) + " | " + "New DB".padEnd(10));
  console.log("------------------------------------------------------------------");

  for (const table of tables) {
    try {
      const oldRes = await oldSql`SELECT count(*) FROM ${oldSql(table)}`;
      const newRes = await newSql`SELECT count(*) FROM ${newSql(table)}`;
      console.log(table.padEnd(25) + " | " + oldRes[0].count.toString().padEnd(10) + " | " + newRes[0].count.toString().padEnd(10));
    } catch (e: any) {
      console.log(table.padEnd(25) + " | Error/Empty | Error/Empty");
    }
  }

  process.exit(0);
}

research();
