import { Client } from "pg";

const sourceUrl = process.env.BALODER_SOURCE_DIRECT_URL;
const targetUrl = process.env.BAL_ID_TARGET_DIRECT_URL;
if (!sourceUrl || !targetUrl) {
  throw new Error("BALODER_SOURCE_DIRECT_URL and BAL_ID_TARGET_DIRECT_URL are required.");
}

const source = new Client({ connectionString: sourceUrl, ssl: { rejectUnauthorized: false } });
const target = new Client({ connectionString: targetUrl, ssl: { rejectUnauthorized: false } });

try {
  await source.connect();
  await target.connect();
  const { rows } = await source.query(`
    SELECT id, email, name, tc, "schoolNumber", "graduationYear", "phoneNumber",
           "birthDate", role, verified, "isMember", "isSandikMember", balance,
           "createdAt", "updatedAt", "memberRequested", "sandikRequested"
    FROM public.users
    ORDER BY id
  `);

  await target.query("BEGIN");
  try {
    await target.query(`
      ALTER TABLE public.users
        ADD COLUMN IF NOT EXISTS "isMember" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "isSandikMember" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS balance double precision NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "memberRequested" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "sandikRequested" boolean NOT NULL DEFAULT false
    `);

    for (const user of rows) {
      await target.query(
        `
          INSERT INTO public.users
            (id, email, name, verified, "createdAt", "updatedAt", "graduationYear",
             "phoneNumber", "schoolNumber", tc, "birthDate", role, "isMember",
             "isSandikMember", balance, "memberRequested", "sandikRequested")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            verified = EXCLUDED.verified,
            "graduationYear" = EXCLUDED."graduationYear",
            "phoneNumber" = EXCLUDED."phoneNumber",
            "schoolNumber" = EXCLUDED."schoolNumber",
            tc = EXCLUDED.tc,
            "birthDate" = EXCLUDED."birthDate",
            role = EXCLUDED.role,
            "isMember" = EXCLUDED."isMember",
            "isSandikMember" = EXCLUDED."isSandikMember",
            balance = EXCLUDED.balance,
            "memberRequested" = EXCLUDED."memberRequested",
            "sandikRequested" = EXCLUDED."sandikRequested"
        `,
        [
          user.id,
          user.email,
          user.name,
          user.verified,
          user.createdAt,
          user.updatedAt,
          user.graduationYear,
          user.phoneNumber,
          user.schoolNumber,
          user.tc,
          user.birthDate,
          user.role,
          user.isMember,
          user.isSandikMember,
          user.balance,
          user.memberRequested,
          user.sandikRequested,
        ],
      );
    }

    await target.query("COMMIT");
  } catch (error) {
    await target.query("ROLLBACK");
    throw error;
  }

  console.log(`Merged ${rows.length} BALÖDER user profiles into the target database.`);
} finally {
  await Promise.allSettled([source.end(), target.end()]);
}
