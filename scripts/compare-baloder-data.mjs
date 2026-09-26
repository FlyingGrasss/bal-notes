import { Client } from "pg";

const sourceUrl = process.env.BALODER_SOURCE_DIRECT_URL;
const targetUrl = process.env.BAL_ID_TARGET_DIRECT_URL;
if (!sourceUrl || !targetUrl) throw new Error("Source and target URLs are required.");
const source = new Client({ connectionString: sourceUrl, ssl: { rejectUnauthorized: false } });
const target = new Client({ connectionString: targetUrl, ssl: { rejectUnauthorized: false } });
const quote = (value) => `"${value.replaceAll('"', '""')}"`;

try {
  await source.connect();
  await target.connect();
  const sourceTables = (await source.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('users', '_prisma_migrations')
    ORDER BY table_name
  `)).rows.map((row) => row.table_name);
  const targetTables = (await target.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'baloder' AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('oauth_attempts', '_prisma_migrations')
    ORDER BY table_name
  `)).rows.map((row) => row.table_name);
  const differences = [];
  for (const table of [...new Set([...sourceTables, ...targetTables])].filter((name) => name !== "baloder_profile_info")) {
    const sourceCount = (await source.query(`SELECT count(*)::int AS count FROM public.${quote(table)}`)).rows[0].count;
    const targetCount = (await target.query(`SELECT count(*)::int AS count FROM baloder.${quote(table)}`)).rows[0].count;
    if (sourceCount !== targetCount) differences.push({ table, sourceCount, targetCount });
  }
  console.log(JSON.stringify({ sourceTables: sourceTables.length, targetTables: targetTables.length, differences }));
} finally {
  await Promise.allSettled([source.end(), target.end()]);
}
