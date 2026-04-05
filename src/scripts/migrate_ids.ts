import { db } from "../db/db";
import { inquiries, admissionMeta } from "../db/schema";
import { eq } from "drizzle-orm";

async function migrate() {
    console.log("Starting ID Migration...");

    // 1. Migrate Inquiries
    const allInquiries = await db.select().from(inquiries);
    for (const inq of allInquiries) {
        if (!inq.entryNumber) continue;
        
        // Skip if already in correct format (ADM-XXXX-XXXX or ENQ-XXXX-XXXX)
        if (/^(ADM|ENQ)-\d{4}-\d{4}$/.test(inq.entryNumber)) {
            console.log(`Skipping correct format: ${inq.entryNumber}`);
            continue;
        }

        const yearSuffix = inq.academicYear.replace("20", "").replace("-", ""); // "2026-27" -> "2627"
        
        // Extract sequence number (last digits)
        const match = inq.entryNumber.match(/\d+$/);
        const sequence = match ? match[0].padStart(4, '0') : "0000";
        
        const newId = `ENQ-${yearSuffix}-${sequence}`;
        
        console.log(`Migrating Inquiry: ${inq.entryNumber} -> ${newId}`);
        await db.update(inquiries).set({ entryNumber: newId }).where(eq(inquiries.id, inq.id));
    }

    // 2. Migrate Admission Meta
    const allMeta = await db.select().from(admissionMeta);
    for (const meta of allMeta) {
        if (!meta.entryNumber) continue;

        if (/^ADM-\d{4}-\d{4}$/.test(meta.entryNumber)) {
            console.log(`Skipping correct format: ${meta.entryNumber}`);
            continue;
        }

        const yearSuffix = meta.academicYear.replace("20", "").replace("-", "");
        const match = meta.entryNumber.match(/\d+$/);
        const sequence = match ? match[0].padStart(4, '0') : "0000";
        
        const newId = `ADM-${yearSuffix}-${sequence}`;
        
        console.log(`Migrating Admission: ${meta.entryNumber} -> ${newId}`);
        await db.update(admissionMeta).set({ entryNumber: newId }).where(eq(admissionMeta.id, meta.id));
    }

    console.log("Migration Complete!");
    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
