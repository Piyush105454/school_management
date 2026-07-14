require("dotenv").config();
const postgres = require("postgres");

async function migrate() {
const neonUrl = process.env.SOURCE_DB_URL;
const supabaseUrl = process.env.DEST_DB_URL;

  console.log("Connecting to databases...");
  const sqlNeon = postgres(neonUrl, { prepare: false });
  const sqlSupa = postgres(supabaseUrl, { prepare: false });

  try {
    const tables = await sqlNeon`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log(`Found ${tables.length} tables to migrate.`);

    // Disable triggers to prevent foreign key errors during unordered bulk inserts
    await sqlSupa`SET session_replication_role = 'replica';`;

    // Truncate all tables first to avoid CASCADE wiping out inserted data
    console.log("Truncating all tables...");
    for (const t of tables) {
      const tableName = t.table_name;
      if (tableName === '__drizzle_migrations') continue;
      await sqlSupa`TRUNCATE TABLE ${sqlSupa(tableName)} CASCADE;`;
    }

    for (const t of tables) {
      const tableName = t.table_name;
      console.log(`Migrating table: ${tableName}`);
      
      const rows = await sqlNeon`SELECT * FROM ${sqlNeon(tableName)}`;
      
      if (rows.length > 0) {
        const chunkSize = 1000;
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          await sqlSupa`INSERT INTO ${sqlSupa(tableName)} ${sqlSupa(chunk)}`;
        }
        console.log(`  -> Inserted ${rows.length} rows.`);
      } else {
        console.log(`  -> 0 rows, skipping.`);
      }
    }

    await sqlSupa`SET session_replication_role = 'origin';`;

    // Fix sequences
    const seqs = await sqlNeon`
      SELECT c.relname as seq_name
      FROM pg_class c
      WHERE c.relkind = 'S'
    `;
    for (const seq of seqs) {
      const seqName = seq.seq_name;
      try {
        const lastVal = await sqlNeon`SELECT last_value FROM ${sqlNeon(seqName)}`;
        if (lastVal.length > 0) {
          await sqlSupa`SELECT setval(${seqName}, ${lastVal[0].last_value}, true)`;
        }
      } catch (e) {
        // Ignoring sequence errors if any don't match
      }
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sqlNeon.end();
    await sqlSupa.end();
  }
}

migrate();
