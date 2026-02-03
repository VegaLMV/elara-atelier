/*
  Warnings:

  - Added the required column `actualizadoEn` to the `Cliente` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "actualizadoEn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "departamento" TEXT,
ADD COLUMN     "distrito" TEXT,
ADD COLUMN     "provincia" TEXT,
ADD COLUMN     "referencia" TEXT;
