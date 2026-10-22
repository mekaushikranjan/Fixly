import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as typeof globalThis & { fixlyPrisma?: PrismaClient };

export const prisma = globalForPrisma.fixlyPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.fixlyPrisma = prisma;
