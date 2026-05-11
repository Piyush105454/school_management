
import { db } from "./src/db";
import { inquiries, classes } from "./src/db/schema";

async function main() {
  const inqSchools = await db.select({ school: inquiries.school }).from(inquiries);
  const classInstitutes = await db.select({ institute: classes.institute }).from(classes);
  
  const inqSet = new Set(inqSchools.map((r: any) => r.school));
  const classSet = new Set(classInstitutes.map((r: any) => r.institute));
  
  console.log("Inquiries Schools:", Array.from(inqSet));
  console.log("Classes Institutes:", Array.from(classSet));
}

main().catch(console.error);
