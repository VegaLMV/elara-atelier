/*
  Warnings:

  - You are about to drop the column `ciudad` on the `Proveedor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Proveedor" DROP COLUMN "ciudad",
ADD COLUMN     "departamento" TEXT,
ADD COLUMN     "distrito" TEXT,
ADD COLUMN     "razonSocial" TEXT;
