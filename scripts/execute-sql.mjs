import { readFile } from "node:fs/promises";
import { Client } from "pg";

const targetUrl = process.env.BAL_ID_TARGET_DIRECT_URL;
const sqlPath = process.argv[2];
if (!targetUrl || !sqlPath) throw new Error("BAL_ID_TARGET_DIRECT_URL and a SQL file path are required.");

const client = new Client({ connectionString: targetUrl, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  let sql = await readFile(sqlPath, "utf8");
  // pg_dump emits psql-only control commands that are not valid through pg.Client.
  sql = sql.replace(/^\\(?:restrict|unrestrict).*$/gm, "");
  sql = sql.replace(/CREATE SCHEMA public;/g, "");
  sql = sql.replace(/CREATE TYPE public\."UserRole" AS ENUM \([^;]+\);/g, "");
  await client.query(sql);
} finally {
  await client.end();
}
