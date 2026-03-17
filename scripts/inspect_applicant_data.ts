import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../src/db';
import { admissionMeta } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { getAdmissionData } from '../src/features/admissions/actions/admissionActions';

async function inspect() {
  const rows = await db.select().from(admissionMeta).where(eq(admissionMeta.entryNumber, 'INQ-2026-4383'));
  if (rows.length === 0) {
    console.log("No applicant found for INQ-2026-4383");
    return;
  }
  const id = rows[0].id;
  const data = await getAdmissionData(id);
  console.log("FULL DATA FOR INQ-2026-4383:");
  console.log(JSON.stringify(data, null, 2));
}

inspect().catch(console.error);
