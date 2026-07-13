const postgres = require('postgres');
const neonUrl = 'postgresql://neondb_owner:npg_JZIK5brM2cfS@ep-cool-truth-ama8k89o-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require';
const supabaseUrl = 'postgresql://postgres.siuuoouydrbrbfncvzov:IvWrfbrUQjXdbOHV@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

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
