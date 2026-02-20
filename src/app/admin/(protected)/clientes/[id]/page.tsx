import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { notFound, redirect } from "next/navigation";
import ClienteForm from "../cliente-form";

export const runtime = "nodejs";

/**
 * ============================================================================
 * PÁGINA: EDITAR CLIENTE EXISTENTE
 * ============================================================================
 * Busca los datos del cliente por ID y pre-carga el formulario.
 * Incluye conteo de ventas para bloquear eliminación si es necesario.
 */
export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;

  // Incluimos el conteo de ventas para pasarlo al formulario (para el botón de eliminar)
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      _count: { select: { ventas: true } }
    }
  });

  if (!cliente) notFound();

  return (
    <div className="p-6 md:p-8 min-h-screen bg-gray-50/50">
      <ClienteForm initialData={{
        ...cliente,
        saldoAFavor: Number(cliente.saldoAFavor)
      }} />
    </div>
  );
}