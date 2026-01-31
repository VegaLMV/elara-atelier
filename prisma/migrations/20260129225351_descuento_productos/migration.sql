-- CreateEnum
CREATE TYPE "TipoDescuentoProducto" AS ENUM ('PORCENTAJE', 'MONTO');

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "descuentoActivo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "descuentoFin" TIMESTAMP(3),
ADD COLUMN     "descuentoInicio" TIMESTAMP(3),
ADD COLUMN     "descuentoTipo" "TipoDescuentoProducto",
ADD COLUMN     "descuentoValor" DECIMAL(10,2);
