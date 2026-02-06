import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// NOTA: Usamos la conexión estándar para evitar conflictos de versiones con adaptadores
const prisma = new PrismaClient();

// --- DATA DE UBIGEO (Ejemplo para usar en Clientes/Proveedores) ---
// Esto no se guarda en BD porque tu schema usa Strings, pero sirve para crear data realista.
const DATA_UBIGEO = [
  // LIMA
  { dep: "Lima", prov: "Lima", dist: "Miraflores" },
  { dep: "Lima", prov: "Lima", dist: "San Isidro" },
  { dep: "Lima", prov: "Lima", dist: "La Victoria" }, // Gamarra
  { dep: "Lima", prov: "Lima", dist: "Santiago de Surco" },
  { dep: "Lima", prov: "Lima", dist: "Los Olivos" },
  { dep: "Lima", prov: "Lima", dist: "San Juan de Lurigancho" },
  // CALLAO
  { dep: "Callao", prov: "Callao", dist: "Callao" },
  { dep: "Callao", prov: "Callao", dist: "Ventanilla" },
  // AREQUIPA
  { dep: "Arequipa", prov: "Arequipa", dist: "Cercado" },
  { dep: "Arequipa", prov: "Arequipa", dist: "Cayma" },
  { dep: "Arequipa", prov: "Arequipa", dist: "Yanahuara" },
  // LA LIBERTAD
  { dep: "La Libertad", prov: "Trujillo", dist: "Trujillo" },
  { dep: "La Libertad", prov: "Trujillo", dist: "Victor Larco Herrera" },
  // CUSCO
  { dep: "Cusco", prov: "Cusco", dist: "Cusco" },
  { dep: "Cusco", prov: "Cusco", dist: "Wanchaq" },
  // ICA
  { dep: "Ica", prov: "Ica", dist: "Ica" },
  { dep: "Ica", prov: "Ica", dist: "Parcona" },
  // PIURA
  { dep: "Piura", prov: "Piura", dist: "Piura" },
  { dep: "Piura", prov: "Sullana", dist: "Sullana" },
  // JUNIN
  { dep: "Junín", prov: "Huancayo", dist: "Huancayo" },
  // LAMBAYEQUE
  { dep: "Lambayeque", prov: "Chiclayo", dist: "Chiclayo" },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function main() {
  console.log("🌱 Iniciando Seed...");

  // --------------------------------------------------------
  // 1. USUARIO ADMIN
  // --------------------------------------------------------
  const correo = process.env.ADMIN_CORREO;
  const clave = process.env.ADMIN_CLAVE;

  if (correo && clave) {
    const hash = await bcrypt.hash(clave, 10);
    await prisma.usuario.upsert({
      where: { correo },
      update: { clave: hash, rol: "ADMIN" },
      create: { correo, clave: hash, rol: "ADMIN" },
    });
    console.log("✅ Admin configurado");
  }

  // --------------------------------------------------------
  // 2. COLORES (Datos Maestros)
  // --------------------------------------------------------
const colores = [
    { nombre: "Negro", hex: "#000000" },
    { nombre: "Blanco", hex: "#FFFFFF" },
    { nombre: "Rojo Intenso", hex: "#DC2626" },
    { nombre: "Azul Marino", hex: "#1E3A8A" },
    { nombre: "Verde Oliva", hex: "#3F6212" },
    { nombre: "Rosa Palo", hex: "#FCE7F3" },
    { nombre: "Beige", hex: "#F5F5DC" },
    { nombre: "Gris Melange", hex: "#9CA3AF" },
    { nombre: "Vino", hex: "#881337" },
  ];

  for (const c of colores) {
    await prisma.color.upsert({
      where: { nombre: c.nombre },
      update: { hex: c.hex },
      create: c,
    });
  }
  console.log("✅ Colores creados");

  // --------------------------------------------------------
  // 3. TALLAS (Datos Maestros)
  // --------------------------------------------------------
  const tallas = [
    { nombre: "XS", orden: 1 },
    { nombre: "S", orden: 2 },
    { nombre: "M", orden: 3 },
    { nombre: "L", orden: 4 },
    { nombre: "XL", orden: 5 },
    { nombre: "Estándar", orden: 6 },
  ];

  for (const t of tallas) {
    await prisma.talla.upsert({
      where: { nombre: t.nombre },
      update: { orden: t.orden },
      create: t,
    });
  }
  console.log("✅ Tallas creadas");

  console.log("🚀 Seed finalizado con éxito.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });