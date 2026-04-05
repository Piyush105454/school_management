import { db } from "../db/db";
import { admissionMeta } from "../db/schema";

async function main() {
    const res = await db.select().from(admissionMeta);
    res.forEach(r => {
        console.log(`ID: ${r.id} | Entry: ${r.entryNumber} | Year: ${r.academicYear}`);
    });
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
