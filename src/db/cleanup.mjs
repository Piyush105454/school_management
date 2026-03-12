import { neon } from '@neondatabase/serverless';
import * as dotenv from "dotenv";

dotenv.config();

async function cleanup() {
  console.log("🧹 Cleaning up old database tables...");
  const sql = neon(process.env.DATABASE_URL);

  try {
    // Drop all tables in the public schema
    await sql(`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
      END $$;
    `);
    
    // Drop all enums in the public schema
    await sql(`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
              EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
          END LOOP;
      END $$;
    `);

    console.log("✅ Database cleared successfully!");
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
  }
}

cleanup();
