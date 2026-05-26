import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DIRECT_URL!, { ssl: 'require' });

async function debugSchema() {
  console.log("Checking if 'resources' and 'resource_issuances' tables exist...");
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('resources', 'resource_issuances');
    `;
    console.log("Found tables:", tables);

    if (tables.length > 0) {
      for (const t of tables) {
        console.log(`\nColumns for table '${t.table_name}':`);
        const columns = await sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = ${t.table_name}
          ORDER BY ordinal_position;
        `;
        columns.forEach(col => {
          console.log(`- ${col.column_name} (${col.data_type})`);
        });
      }
    } else {
      console.log("Neither 'resources' nor 'resource_issuances' exists in information_schema!");
    }

    console.log("\nAttempting to query 'resources'...");
    const res = await sql`SELECT * FROM resources LIMIT 1;`;
    console.log("Query 'resources' result:", res);

  } catch (err: any) {
    console.error("Error executing query:", err.message, err.stack);
  } finally {
    await sql.end();
  }
}

debugSchema();
