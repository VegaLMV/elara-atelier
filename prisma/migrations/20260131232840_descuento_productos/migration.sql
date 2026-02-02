-- CreateEnum
CREATE TYPE "EstadoDescuentoProducto" AS ENUM ('PROGRAMADO', 'ACTIVO', 'FINALIZADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "descuentoActualId" TEXT;

-- CreateTable
CREATE TABLE "DescuentoProducto" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "tipo" "TipoDescuentoProducto" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoDescuentoProducto" NOT NULL DEFAULT 'PROGRAMADO',
    "creadoPorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DescuentoProducto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DescuentoProducto_productoId_estado_startsAt_endsAt_idx" ON "DescuentoProducto"("productoId", "estado", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "DescuentoProducto_startsAt_endsAt_idx" ON "DescuentoProducto"("startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_descuentoActualId_fkey" FOREIGN KEY ("descuentoActualId") REFERENCES "DescuentoProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DescuentoProducto" ADD CONSTRAINT "DescuentoProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DescuentoProducto" ADD CONSTRAINT "DescuentoProducto_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
