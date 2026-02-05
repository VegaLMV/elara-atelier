/*
  Warnings:

  - You are about to drop the column `actualizadoEn` on the `DescuentoProducto` table. All the data in the column will be lost.
  - You are about to drop the column `creadoEn` on the `DescuentoProducto` table. All the data in the column will be lost.
  - You are about to drop the column `creadoPorId` on the `DescuentoProducto` table. All the data in the column will be lost.
  - You are about to drop the column `descripcion` on the `DescuentoProducto` table. All the data in the column will be lost.
  - You are about to drop the column `endsAt` on the `DescuentoProducto` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `DescuentoProducto` table. All the data in the column will be lost.
  - You are about to drop the column `nombreCampana` on the `DescuentoProducto` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `DescuentoProducto` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `DescuentoProducto` table. All the data in the column will be lost.
  - You are about to drop the column `valor` on the `DescuentoProducto` table. All the data in the column will be lost.
  - You are about to drop the column `descuentoActualId` on the `Producto` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[campanaId,productoId]` on the table `DescuentoProducto` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `campanaId` to the `DescuentoProducto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actualizadoEn` to the `Proveedor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DescuentoProducto" DROP CONSTRAINT "DescuentoProducto_creadoPorId_fkey";

-- DropForeignKey
ALTER TABLE "Producto" DROP CONSTRAINT "Producto_descuentoActualId_fkey";

-- DropIndex
DROP INDEX "DescuentoProducto_productoId_estado_startsAt_endsAt_idx";

-- DropIndex
DROP INDEX "DescuentoProducto_startsAt_endsAt_idx";

-- AlterTable
ALTER TABLE "DescuentoProducto" DROP COLUMN "actualizadoEn",
DROP COLUMN "creadoEn",
DROP COLUMN "creadoPorId",
DROP COLUMN "descripcion",
DROP COLUMN "endsAt",
DROP COLUMN "estado",
DROP COLUMN "nombreCampana",
DROP COLUMN "startsAt",
DROP COLUMN "tipo",
DROP COLUMN "valor",
ADD COLUMN     "campanaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Producto" DROP COLUMN "descuentoActualId";

-- AlterTable
ALTER TABLE "Proveedor" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "actualizadoEn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Campana" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoDescuentoProducto" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoDescuentoProducto" NOT NULL DEFAULT 'PROGRAMADO',
    "creadorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campana_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DescuentoProducto_campanaId_idx" ON "DescuentoProducto"("campanaId");

-- CreateIndex
CREATE INDEX "DescuentoProducto_productoId_idx" ON "DescuentoProducto"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "DescuentoProducto_campanaId_productoId_key" ON "DescuentoProducto"("campanaId", "productoId");

-- AddForeignKey
ALTER TABLE "Campana" ADD CONSTRAINT "Campana_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DescuentoProducto" ADD CONSTRAINT "DescuentoProducto_campanaId_fkey" FOREIGN KEY ("campanaId") REFERENCES "Campana"("id") ON DELETE CASCADE ON UPDATE CASCADE;
