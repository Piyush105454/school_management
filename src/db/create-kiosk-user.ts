import { db } from "./index";
import { users } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🌱 Creating kiosk user...");

  const email = "dpsface@gmail.com";
  const password = "dpsface01@123";
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    console.log("✅ User dpsface@gmail.com already exists. Updating password...");
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email));
    console.log("🚀 Password updated successfully!");
  } else {
    await db.insert(users).values({
      email,
      password: hashedPassword,
      role: "OFFICE",
      phone: "0000000000",
    });
    console.log("🚀 Kiosk user created successfully!");
  }
}

main().catch((err) => {
  console.error("❌ Failed to create kiosk user:");
  console.error(err);
  process.exit(1);
});
