import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ No database URL found in .env");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

async function clearDatabase() {
  console.log("🧹 Clearing all tables and types from public schema...");
  try {
    await sql.begin(async (sql) => {
      // Get all tables
      const tables = await sql`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `;
      
      if (tables.length > 0) {
        const tableNames = tables.map(t => `"${t.tablename}"`).join(', ');
        console.log(`🗑️  Dropping tables: ${tableNames}`);
        await sql.unsafe(`DROP TABLE IF EXISTS ${tableNames} CASCADE`);
      }

      // Get all enums/types
      const types = await sql`
        SELECT typname FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE n.nspname = 'public' 
        AND t.typtype = 'e'
      `;

      if (types.length > 0) {
        const typeNames = types.map(t => `"${t.typname}"`).join(', ');
        console.log(`🗑️  Dropping types: ${typeNames}`);
        await sql.unsafe(`DROP TYPE IF EXISTS ${typeNames} CASCADE`);
      }
    });
    console.log("✅ Database cleared!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await sql.end();
  }
}

clearDatabase();
