-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('YAPE', 'PLIN', 'EFECTIVO', 'TRANSFERENCIA');

-- AlterTable
ALTER TABLE "TipoEmpaque" ADD COLUMN     "imagenUrl" TEXT;

-- AlterTable
ALTER TABLE "Variante" ADD COLUMN     "stockMinimo" INTEGER NOT NULL DEFAULT 4;

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "metodoPago" "MetodoPago" NOT NULL DEFAULT 'YAPE';
