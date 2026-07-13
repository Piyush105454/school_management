import { db } from "@/db";
import { users } from "@/db/schema";
import { desc, like } from "drizzle-orm";

export async function generateProfileId(role: "ADMIN" | "TEACHER" | "STUDENT_PARENT" | "PRINCIPAL" | "OFFICE"): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  let prefix = "USR";
  
  switch(role) {
    case "ADMIN":
    case "PRINCIPAL":
    case "OFFICE":
      prefix = "ADM";
      break;
    case "TEACHER":
      prefix = "TCH";
      break;
    case "STUDENT_PARENT":
      prefix = "STU";
      break;
  }

  const basePattern = `${prefix}-${year}-`;
  
  // Find the last ID generated for this prefix and year
  const lastUser = await db
    .select({ profileId: users.profileId })
    .from(users)
    .where(like(users.profileId, `${basePattern}%`))
    .orderBy(desc(users.profileId))
    .limit(1);

  let nextSequence = 1;

  if (lastUser.length > 0 && lastUser[0].profileId) {
    const lastId = lastUser[0].profileId;
    const parts = lastId.split("-");
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }
  }

  // Format with leading zeros (4 digits)
  const sequenceStr = nextSequence.toString().padStart(4, "0");
  
  return `${basePattern}${sequenceStr}`;
}
