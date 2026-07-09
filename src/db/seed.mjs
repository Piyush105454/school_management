import { pgTable, text, timestamp, pgEnum, uuid } from "drizzle-orm/pg-core";
import postgres from "postgres";
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const roleEnum = pgEnum("role", ["OFFICE", "STUDENT_PARENT"]);

const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default("OFFICE").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

async function seed() {
  console.log("🌱 Seeding database via mjs...");
  const client = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  const db = drizzle(client);

  const adminEmail = "admin@schoolflow.com";
  const hashedPassword = await bcrypt.hash("admin123", 10);

  try {
    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      role: "OFFICE",
      phone: "1234567890",
    }).onConflictDoNothing();

    console.log("🚀 Seed complete!");
    console.log(`📧 Admin Email: ${adminEmail}`);
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await client.end();
  }
}

seed();
