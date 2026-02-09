import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Siempre mostramos errores y advertencias en todos los entornos para facilitar el diagnóstico.
    // En desarrollo, también podemos ver info adicional si es necesario.
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;