import { db } from "./index";
import { users } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  const adminEmail = "admin@schoolflow.com";
  const existingAdmin = await db.query.users.findFirst();

  if (existingAdmin) {
    console.log("✅ Database already has users. Skipping seed.");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await db.insert(users).values({
    email: adminEmail,
    password: hashedPassword,
    role: "OFFICE",
    phone: "1234567890",
  });

  console.log("🚀 Seed complete!");
  console.log(`📧 Admin Email: ${adminEmail}`);
  console.log("🔑 Admin Password: admin123");
}

seed().catch((err) => {
  console.error("❌ Seed failed:");
  console.error(err);
  process.exit(1);
});
