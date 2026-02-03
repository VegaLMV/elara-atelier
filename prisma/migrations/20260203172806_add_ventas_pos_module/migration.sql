/*
  Warnings:

  - A unique constraint covering the columns `[codigo]` on the table `Venta` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `precioFinal` to the `ItemVenta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precioUnitario` to the `ItemVenta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `ItemVenta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actualizadoEn` to the `Venta` table without a default value. This is not possible if the table is not empty.
  - The required column `codigo` was added to the `Venta` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('PENDIENTE', 'COMPLETADO', 'ANULADO');

-- AlterTable
ALTER TABLE "ItemVenta" ADD COLUMN     "descuentoMonto" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "descuentoRazon" TEXT,
ADD COLUMN     "precioFinal" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "precioUnitario" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "tieneDescuento" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "actualizadoEn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "clienteId" TEXT,
ADD COLUMN     "codigo" TEXT NOT NULL,
ADD COLUMN     "descuentoTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "estado" "EstadoVenta" NOT NULL DEFAULT 'COMPLETADO',
ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "dni" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_dni_key" ON "Cliente"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Venta_codigo_key" ON "Venta"("codigo");

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
