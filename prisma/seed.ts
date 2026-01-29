import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Falta DIRECT_URL o DATABASE_URL en .env");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function main() {
  // 1) Tallas
  const tallas = ["XS", "S", "M", "L", "XL"];
  for (let i = 0; i < tallas.length; i++) {
    await prisma.talla.upsert({
      where: { nombre: tallas[i] },
      update: { orden: i + 1 },
      create: { nombre: tallas[i], orden: i + 1 },
    });
  }

  // 2) Colores
  const colores = [
    { nombre: "Negro", hex: "#000000" },
    { nombre: "Blanco", hex: "#FFFFFF" },
    { nombre: "Beige", hex: "#F5F5DC" },
    { nombre: "Azul", hex: "#1E3A8A" },
    { nombre: "Rojo", hex: "#B91C1C" },
  ];
  for (const c of colores) {
    await prisma.color.upsert({
      where: { nombre: c.nombre },
      update: { hex: c.hex },
      create: { nombre: c.nombre, hex: c.hex },
    });
  }

  // 3) Categorías
  const categorias = ["Polos", "Pantalones", "Casacas", "Vestidos", "Faldas", "Accesorios","Blusas"];
  for (const nombre of categorias) {
    await prisma.categoria.upsert({
      where: { slug: slugify(nombre) },
      update: { nombre },
      create: { nombre, slug: slugify(nombre) },
    });
  }

  // 4) Tipos de empaque
  const empaques = [
    { nombre: "Bolsa chica", costoUnitario: "0.30" },
    { nombre: "Bolsa grande", costoUnitario: "0.50" },
    { nombre: "Caja", costoUnitario: "2.00" },
    { nombre: "Etiqueta", costoUnitario: "0.10" },
  ];
  for (const e of empaques) {
    await prisma.tipoEmpaque.upsert({
      where: { nombre: e.nombre },
      update: { costoUnitario: e.costoUnitario },
      create: { nombre: e.nombre, costoUnitario: e.costoUnitario, activo: true },
    });
  }

  // 5) Usuario ADMIN
  const correo = process.env.ADMIN_CORREO;
  const clave = process.env.ADMIN_CLAVE;
  if (!correo || !clave) throw new Error("Falta ADMIN_CORREO o ADMIN_CLAVE en .env");

  const hash = await bcrypt.hash(clave, 10);

  await prisma.usuario.upsert({
    where: { correo },
    update: { clave: hash, rol: "ADMIN" },
    create: { correo, clave: hash, rol: "ADMIN" },
  });

  console.log("✅ Seed completado: tallas, colores, categorías, empaques y admin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
