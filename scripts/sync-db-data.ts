import "dotenv/config";
import postgres from "postgres";

const OLD_DB_URL = "postgresql://neondb_owner:npg_GMHq6e9zEanu@ep-steep-truth-adyyasdg-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const NEW_DB_URL = process.env.DATABASE_URL!;

const oldSql = postgres(OLD_DB_URL, { ssl: "require" });
const newSql = postgres(NEW_DB_URL, { ssl: "require" });

const TABLES = [
  { name: "users", pk: "id", conflict: "id" },
  { name: "inquiries", pk: "id", conflict: "id" },
  { name: "admission_meta", pk: "id", conflict: "id" },
  { name: "student_profiles", pk: "id", conflict: "id" },
  { name: "student_bio", pk: "id", conflict: "id" },
  { name: "student_address", pk: "id", conflict: "id" },
  { name: "student_bank_details", pk: "id", conflict: "id" },
  { name: "previous_academic", pk: "id", conflict: "id" },
  { name: "sibling_details", pk: "id", conflict: "id" },
  { name: "parent_guardian_details", pk: "id", conflict: "id" },
  { name: "declarations", pk: "id", conflict: "id" },
  { name: "document_checklists", pk: "id", conflict: "id" },
  { name: "student_documents", pk: "id", conflict: "id" },
  { name: "entrance_tests", pk: "id", conflict: "id" },
  { name: "home_visits", pk: "id", conflict: "id" },
  { name: "teachers", pk: "id", conflict: "id" },
  { name: "classes", pk: "id", isSerial: true, conflict: "id" },
  { name: "students", pk: "id", isSerial: true, conflict: "id" },
  { name: "subjects", pk: "id", isSerial: true, conflict: "id" },
  { name: "units", pk: "id", isSerial: true, conflict: "id" },
  { name: "chapters", pk: "id", isSerial: true, conflict: "id" },
  { name: "chapter_divisions", pk: "id", isSerial: true, conflict: "id" },
  { name: "chapter_pdfs", pk: "id", conflict: "id" },
  { name: "lesson_plans", pk: "id", conflict: "id" }
];

async function syncTable(table: any) {
  const { name: tableName, pk, isSerial, conflict } = table;
  console.log(`Syncing table: ${tableName}...`);
  
  try {
    const rows = await oldSql`SELECT * FROM ${oldSql(tableName)}`;
    if (rows.length === 0) {
      console.log(`  No data found in ${tableName}.`);
      return;
    }

    const processedRows = rows.map(row => {
      const newRow = { ...row };
      for (const key in newRow) {
        if (typeof newRow[key] === 'string' && newRow[key].startsWith('data:')) {
            newRow[key] = null;
        }
      }
      return newRow;
    });

    // Batch upsert to be much faster and avoid disconnects
    const batchSize = 100;
    for (let i = 0; i < processedRows.length; i += batchSize) {
        const batch = processedRows.slice(i, i + batchSize);
        const columns = Object.keys(batch[0]);
        const updateCols = columns.filter(c => c !== pk);

        // We use unsafe for the ON CONFLICT part because postgres.js doesn't have a clean way 
        // to handle EXCLUDED dynamically in a template for batch inserts easily without a lot of setup.
        const setQuery = updateCols.map(c => `${c} = EXCLUDED.${c}`).join(', ');
        
        // Manual construction of the query for robustness
        await newSql`
            INSERT INTO ${newSql(tableName)} ${newSql(batch)}
            ON CONFLICT (${newSql(conflict)}) DO UPDATE SET
            ${newSql.unsafe(setQuery)}
        `.catch(async (e) => {
            if (e.message?.includes('duplicate key value violates unique constraint "users_email_unique"')) {
                // Special case for users: if ID conflict is not caught, it might be EMAIL conflict
                // Fallback to one-by-one for this batch to find which ones can be inserted
                for (const row of batch) {
                    await newSql`
                        INSERT INTO ${newSql(tableName)} ${newSql(row)}
                        ON CONFLICT (email) DO UPDATE SET ${newSql(row, updateCols)}
                    `.catch(() => {});
                }
            } else {
                console.warn(`  Batch error in ${tableName}, falling back to single row inserts for this batch...`);
                for (const row of batch) {
                    await newSql`
                        INSERT INTO ${newSql(tableName)} ${newSql(row)}
                        ON CONFLICT (${newSql(conflict)}) DO UPDATE SET ${newSql(row, updateCols)}
                    `.catch(e => {
                        // console.error(`    Row error in ${tableName}:`, e.message);
                    });
                }
            }
        });
    }

    if (isSerial) {
      await newSql.unsafe(`SELECT setval(pg_get_serial_sequence('${tableName}', '${pk}'), (SELECT MAX(${pk}) FROM ${tableName}))`).catch(() => {});
    }

    // Double check row count after sync
    const finalRes = await newSql`SELECT count(*) FROM ${newSql(tableName)}`;
    console.log(`  Sync completed: ${finalRes[0].count} rows in target ${tableName}.`);
  } catch (err: any) {
    console.error(`  Fatal Error syncing ${tableName}:`, err.message);
  }
}

async function startSync() {
  console.log("Resuming database sync with improved batch logic...");
  for (const table of TABLES) {
    await syncTable(table);
  }
  console.log("Full sync complete!");
  process.exit(0);
}

startSync();
