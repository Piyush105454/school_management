const postgres = require('postgres');
require('dotenv').config();

const client = postgres(process.env.DIRECT_URL);

async function main() {
  try {
    const result = await client`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log("TABLES:", JSON.stringify(result.map(t => t.table_name)));
    process.exit(0);
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  }
}

main();
