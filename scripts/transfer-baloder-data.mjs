import { Client } from "pg";

const sourceUrl = process.env.BALODER_SOURCE_DIRECT_URL;
const targetUrl = process.env.BAL_ID_TARGET_DIRECT_URL;
if (!sourceUrl || !targetUrl) {
  throw new Error("BALODER_SOURCE_DIRECT_URL and BAL_ID_TARGET_DIRECT_URL are required.");
}

const source = new Client({ connectionString: sourceUrl, ssl: { rejectUnauthorized: false } });
const target = new Client({ connectionString: targetUrl, ssl: { rejectUnauthorized: false } });
const quote = (value) => `"${value.replaceAll('"', '""')}"`;

try {
  await source.connect();
  await target.connect();

  const tableResult = await source.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('users', '_prisma_migrations')
    ORDER BY table_name
  `);

  await target.query("BEGIN");
  try {
    for (const { table_name: tableName } of tableResult.rows) {
      const columnsResult = await source.query(
        `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `,
        [tableName],
      );
      const columns = columnsResult.rows.map((row) => row.column_name);
      if (columns.length === 0) continue;

      const rows = (await source.query(`SELECT * FROM public.${quote(tableName)}`)).rows;
      if (rows.length === 0) continue;

      const columnSql = columns.map(quote).join(", ");
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
      const insertSql = `INSERT INTO public.${quote(tableName)} (${columnSql}) VALUES (${placeholders})`;
      for (const row of rows) {
        await target.query(insertSql, columns.map((column) => row[column]));
      }
      console.log(`Copied ${rows.length} rows from ${tableName}.`);
    }

    const sequenceResult = await source.query(`
      SELECT table_name, column_name, pg_get_serial_sequence(format('public.%I', table_name), column_name) AS sequence_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND column_default LIKE 'nextval(%'
    `);
    for (const sequence of sequenceResult.rows) {
      if (!sequence.sequence_name) continue;
      const maxResult = await target.query(
        `SELECT max(${quote(sequence.column_name)}) AS max_value FROM public.${quote(sequence.table_name)}`,
      );
      const maxValue = maxResult.rows[0]?.max_value;
      await target.query("SELECT setval($1::regclass, $2, $3)", [
        sequence.sequence_name,
        maxValue ?? 1,
        maxValue !== null,
      ]);
    }

    await target.query("COMMIT");
  } catch (error) {
    await target.query("ROLLBACK");
    throw error;
  }
} finally {
  await Promise.allSettled([source.end(), target.end()]);
}
