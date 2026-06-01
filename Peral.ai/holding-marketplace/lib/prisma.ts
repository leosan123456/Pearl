import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Resolve relative SQLite paths against process.cwd() so Prisma can always
// find the file regardless of where the Node.js process was launched from.
function resolvedDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  if (url.startsWith("file:./") || url.startsWith("file:../")) {
    return `file:${path.resolve(process.cwd(), url.slice("file:".length))}`;
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolvedDatasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
