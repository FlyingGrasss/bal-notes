import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(
      new Pool({
        connectionString:
          process.env.DATABASE_URL ??
          "postgresql://unconfigured:unconfigured@127.0.0.1:5432/unconfigured",
        max: 2,
        // Supabase's pooler presents a certificate chain that is not included
        // in every local Node trust store. The connection remains encrypted.
        ssl: { rejectUnauthorized: false },
      }),
      { schema: "balnotes" },
    ),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
