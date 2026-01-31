-- CreateTable
CREATE TABLE "ImagenProductoColor" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImagenProductoColor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImagenProductoColor_productoId_colorId_key" ON "ImagenProductoColor"("productoId", "colorId");

-- AddForeignKey
ALTER TABLE "ImagenProductoColor" ADD CONSTRAINT "ImagenProductoColor_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagenProductoColor" ADD CONSTRAINT "ImagenProductoColor_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
