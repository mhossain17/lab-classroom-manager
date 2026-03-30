import { PrismaLibSQL } from "@prisma/adapter-libsql/web";
import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function isLibSqlUrl(url: string) {
  return (
    url.startsWith("libsql://") ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("ws://") ||
    url.startsWith("wss://")
  );
}

function resolveDatabaseUrl() {
  return process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
}

export function createPrismaClient() {
  const databaseUrl = resolveDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("Missing database URL. Set TURSO_DATABASE_URL or DATABASE_URL.");
  }

  const log: Prisma.LogLevel[] = process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  if (isLibSqlUrl(databaseUrl)) {
    const adapter = new PrismaLibSQL({
      url: databaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    return new PrismaClient({ adapter, log });
  }

  return new PrismaClient({ log });
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
