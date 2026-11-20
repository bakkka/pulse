// Writes prisma/schema.postgres.prisma from the local SQLite schema.
// Vercel has no persistent disk, so production runs on Postgres while local
// development keeps the SQLite file.
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("prisma/schema.prisma", "utf8");
const output = source.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');

if (output === source) {
  throw new Error('prisma/schema.prisma has no provider = "sqlite" block');
}

writeFileSync("prisma/schema.postgres.prisma", output);
console.log("→ prisma/schema.postgres.prisma");
