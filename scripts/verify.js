const postgres = require('postgres');
const neonUrl = process.env.SOURCE_DB_URL;
const supabaseUrl = process.env.DEST_DB_URL;

async function run() {
  const sqlNeon = postgres(neonUrl, { prepare: false });
  const sqlSupa = postgres(supabaseUrl, { prepare: false });
  
  const tables = [
    'users',
    'students',
    'student_attendance',
    'exam_schedules',
    'chapters',
    'student_bio'
  ];

  for (const table of tables) {
    const neonCount = await sqlNeon`SELECT count(*) FROM ${sqlNeon(table)}`;
    const supaCount = await sqlSupa`SELECT count(*) FROM ${sqlSupa(table)}`;
    console.log(`Table: ${table.padEnd(20)} Neon: ${neonCount[0].count.padEnd(6)} Supabase: ${supaCount[0].count}`);
  }
  
  await sqlNeon.end();
  await sqlSupa.end();
}
run();
