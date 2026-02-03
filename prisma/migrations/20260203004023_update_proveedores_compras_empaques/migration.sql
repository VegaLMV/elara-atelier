-- DropForeignKey
ALTER TABLE "ItemCompra" DROP CONSTRAINT "ItemCompra_varianteId_fkey";

-- AlterTable
ALTER TABLE "ItemCompra" ADD COLUMN     "tipoEmpaqueId" TEXT,
ALTER COLUMN "varianteId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Proveedor" ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "provincia" TEXT;

-- AddForeignKey
ALTER TABLE "ItemCompra" ADD CONSTRAINT "ItemCompra_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCompra" ADD CONSTRAINT "ItemCompra_tipoEmpaqueId_fkey" FOREIGN KEY ("tipoEmpaqueId") REFERENCES "TipoEmpaque"("id") ON DELETE SET NULL ON UPDATE CASCADE;
