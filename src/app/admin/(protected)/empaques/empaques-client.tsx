"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import Pagination from "@/components/ui/pagination";
import {
  Package,
  Search,
  Plus,
  Save,
  Trash2,
  Maximize2,
  Layers,
  UploadCloud,
  ShoppingCart
} from "lucide-react";

type Row = {
  id: string;
  nombre: string;
  costoUnitario: string;
  activo: boolean;
  imagenUrl: string | null;
  stock: number;
};

export default function EmpaquesClient({
  initialRows,
  totalPages,
  initialFilters
}: {
  initialRows: Row[],
  totalPages: number,
  initialFilters: { q: string, estado: "todos" | "activos" | "inactivos" }
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 🔎 Filtros (URL Sync)
  const [busqueda, setBusqueda] = useState(initialFilters.q);
  const [filtroEstado, setFiltroEstado] = useState(initialFilters.estado);

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) params.set("q", term);
    else params.delete("q");
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleEstadoChange = (estado: "todos" | "activos" | "inactivos") => {
    setFiltroEstado(estado);
    const params = new URLSearchParams(searchParams);
    if (estado !== "todos") params.set("estado", estado);
    else params.delete("estado");
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    setBusqueda(searchParams.get("q") ?? "");
    setFiltroEstado((searchParams.get("estado") as any) ?? "todos");
  }, [searchParams]);

  // Formulario
  const [nombre, setNombre] = useState("");
  const [costo, setCosto] = useState("");
  const [nuevoStock, setNuevoStock] = useState("0");
  const [file, setFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "warning" } | null>(null);

  // Modal Zoom para imágenes
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const canCreate = useMemo(() => {
    if (!nombre.trim()) return false;
    if (costo === "" || isNaN(Number(costo)) || Number(costo) < 0) return false;
    if (nuevoStock === "" || isNaN(Number(nuevoStock)) || Number(nuevoStock) < 0) return false;
    return true;
  }, [nombre, costo, nuevoStock]);

  const rowsFiltradas = initialRows;

  const showToast = (msg: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;

    setBusy(true);

    try {
      const formData = new FormData();
      formData.append("nombre", nombre.trim());
      formData.append("costoUnitario", costo);
      formData.append("stock", nuevoStock);

      if (file) {
        formData.append("imagen", file);
      }

      const r = await fetch("/api/admin/empaques", {
        method: "POST",
        body: formData,
      });

      const d = await r.json().catch(() => ({}));

      if (!r.ok) {
        showToast(d?.error ?? "Error creando empaque", "error");
      } else {
        setNombre("");
        setCosto("");
        setNuevoStock("0");
        setFile(null);

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = "";

        showToast("Empaque creado correctamente");
        router.refresh();
      }
    } catch (error) {
      showToast("Error de conexión", "error");
    } finally {
      setBusy(false);
    }
  }

  async function actualizar(id: string, patch: { nombre: string; costoUnitario: string; stock: number }) {
    if (!patch.nombre.trim()) { showToast("Nombre inválido", "error"); return; }
    if (isNaN(Number(patch.costoUnitario)) || Number(patch.costoUnitario) < 0) {
      showToast("Costo inválido", "error"); return;
    }
    if (isNaN(patch.stock) || patch.stock < 0) {
      showToast("Stock inválido", "error"); return;
    }

    const r = await fetch(`/api/admin/empaques/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!r.ok) {
      showToast("Error actualizando empaque", "error");
      return;
    }
    showToast("Empaque actualizado");
    router.refresh();
  }

  async function toggleActivo(id: string, activo: boolean) {
    const r = await fetch(`/api/admin/empaques/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo }),
    });

    if (!r.ok) {
      showToast("Error cambiando estado", "error");
      return;
    }
    showToast(activo ? "Empaque activado" : "Empaque desactivado");
    router.refresh();
  }

  async function eliminar(row: Row) {
    if (!row.activo) {
      showToast("El empaque ya está en estado INACTIVO.", "warning");
      return;
    }

    if (!confirm(`⚠️ ¿Deseas ARCHIVAR el empaque "${row.nombre}"?`)) return;

    const r = await fetch(`/api/admin/empaques/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: false }),
    });

    if (!r.ok) {
      showToast("Error al archivar", "error");
      return;
    }

    showToast("Empaque archivado (Inactivo)", "warning");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-xl text-white font-medium text-sm animate-in slide-in-from-bottom-5 fade-in duration-300 z-[9999] flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-600' :
          toast.type === 'warning' ? 'bg-amber-600' : 'bg-slate-900'
          }`}>
          <span>{toast.type === 'error' ? '⚠️' : toast.type === 'warning' ? '🔒' : '✅'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Modal Zoom */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <button className="absolute -top-12 right-0 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
              <Maximize2 className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt="Zoom" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}

      {/* ---------------- COLUMNA IZQUIERDA: FORMULARIO (span-4) ---------------- */}
      <div className="lg:col-span-4 sticky top-6">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">

          {/* Header */}
          <div className="bg-slate-900 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg tracking-tight">Nuevo Empaque</h3>
            </div>
            <p className="text-slate-400 text-xs">Registra bolsas, cajas o insumos de entrega.</p>
          </div>

          <div className="p-6">
            <form onSubmit={crear} className="space-y-5">

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre</label>
                <div className="relative group">
                  <input
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                    placeholder="Ej: Bolsa Kraft Mediana"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                  <Package className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Stock</label>
                  <div className="relative group">
                    <input
                      type="number" min="0"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all font-mono font-bold text-slate-700"
                      placeholder="0"
                      value={nuevoStock}
                      onChange={(e) => setNuevoStock(e.target.value)}
                    />
                    <Layers className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Costo (S/)</label>
                  <div className="relative group">
                    <input
                      type="number" step="0.01" min="0"
                      className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all font-mono"
                      placeholder="0.00"
                      value={costo}
                      onChange={(e) => setCosto(e.target.value)}
                    />
                    <span className="absolute left-3 top-3 text-slate-400 text-sm font-bold">S/</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Imagen Referencial</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-all relative group">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-slate-100 rounded-full text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{file ? file.name : "Click para subir foto"}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-slate-900/10 flex justify-center items-center gap-2"
                disabled={busy || !canCreate}
              >
                {busy ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Empaque"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ---------------- COLUMNA DERECHA: LISTADO (span-8) ---------------- */}
      <div className="lg:col-span-8 space-y-6">

        {/* Barra de Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-transparent outline-none placeholder:text-slate-400"
              placeholder="Buscar empaque..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                handleSearch(e.target.value);
              }}
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            {(['todos', 'activos', 'inactivos'] as const).map((f) => (
              <button
                key={f}
                onClick={() => handleEstadoChange(f)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${filtroEstado === f
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          {/* Header Ajustado (Total 12 columnas) */}
          <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-1 text-center">Foto</div>
            <div className="col-span-4">Descripción</div>
            <div className="col-span-2 text-center">Stock</div>
            <div className="col-span-2 text-center">Costo</div>
            <div className="col-span-1 text-center">Estado</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          <div className="divide-y divide-slate-50 overflow-y-auto max-h-[600px] custom-scrollbar">
            {rowsFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Package className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold">No se encontraron empaques</h3>
                <p className="text-slate-400 text-sm mt-1">Ajusta los filtros o crea uno nuevo.</p>
              </div>
            ) : (
              rowsFiltradas.map((r) => (
                <Fila
                  key={r.id}
                  row={r}
                  disabled={busy}
                  onSave={(patch) => actualizar(r.id, patch)}
                  onToggle={(val) => toggleActivo(r.id, val)}
                  onDelete={() => eliminar(r)}
                  onPreview={() => r.imagenUrl && setPreviewImage(r.imagenUrl)}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex justify-center pb-8">
          <Pagination totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}

function Fila({
  row,
  disabled,
  onSave,
  onToggle,
  onDelete,
  onPreview,
}: {
  row: Row;
  disabled: boolean;
  onSave: (patch: { nombre: string; costoUnitario: string; stock: number }) => void;
  onToggle: (activo: boolean) => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const [nombre, setNombre] = useState(row.nombre);
  const [costo, setCosto] = useState(row.costoUnitario);
  const [stock, setStock] = useState(String(row.stock));

  const changed = nombre.trim() !== row.nombre || costo !== row.costoUnitario || String(stock) !== String(row.stock);

  return (
    <div className={`grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50 transition-colors gap-2 group ${!row.activo ? 'opacity-60 bg-slate-50/50' : ''}`}>

      {/* 1. Foto */}
      <div className="col-span-1 flex justify-center">
        <div
          className={`w-10 h-10 rounded-xl border border-slate-200 overflow-hidden relative shadow-sm transition-all ${row.imagenUrl ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-slate-200' : 'bg-slate-50 flex items-center justify-center'}`}
          onClick={row.imagenUrl ? onPreview : undefined}
          title={row.imagenUrl ? "Ver imagen" : "Sin imagen"}
        >
          {row.imagenUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.imagenUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Package className="w-4 h-4 text-slate-300" />
          )}
        </div>
      </div>

      {/* 2. Descripción */}
      <div className="col-span-4">
        <input
          className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-900 focus:ring-0 outline-none py-1 font-bold text-slate-700 transition-colors disabled:text-slate-400"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre"
          disabled={!row.activo}
        />
      </div>

      {/* 3. Stock */}
      <div className="col-span-2 flex justify-center">
        <div className="relative group/input w-20">
          <input
            type="number"
            min="0"
            className={`w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 rounded px-1 py-1 text-center font-mono font-bold transition-colors ${Number(stock) < 10 && row.activo ? 'text-red-600 bg-red-50' : 'text-slate-700'}`}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            disabled={!row.activo}
          />
          {Number(stock) < 5 && row.activo && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Stock Bajo" />
          )}
        </div>
      </div>

      {/* 4. Costo */}
      <div className="col-span-2 flex justify-center">
        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-xs font-medium">S/</span>
          <input
            className="w-16 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-900 focus:ring-0 outline-none px-0 py-1 text-center font-mono text-slate-700 disabled:text-slate-400"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            disabled={!row.activo}
          />
        </div>
      </div>

      {/* 5. Estado Switch */}
      <div className="col-span-1 flex justify-center">
        <button
          disabled={disabled}
          onClick={() => onToggle(!row.activo)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${row.activo ? 'bg-emerald-500' : 'bg-slate-300'}`}
          title={row.activo ? "Activar/Desactivar" : "Activar"}
        >
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${row.activo ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* 6. Acciones */}
      <div className="col-span-2 flex items-center justify-end gap-2">
        {/* Guardar (Visible si cambia) */}
        {changed && row.activo && (
          <button
            className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm animate-in zoom-in"
            disabled={disabled || !nombre.trim()}
            onClick={() => onSave({ nombre: nombre.trim(), costoUnitario: costo, stock: Number(stock) })}
            title="Guardar cambios"
          >
            <Save className="w-4 h-4" />
          </button>
        )}

        {/* Reponer Stock */}
        {row.activo && (
          <Link
            href={`/admin/compras/nueva?prefillEmpaque=${row.id}`}
            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
            title="Reponer Stock (Crear Compra)"
          >
            <ShoppingCart className="w-4 h-4" />
          </Link>
        )}

        {/* Archivar (Soft Delete) */}
        <button
          type="button"
          className={`p-2 rounded-lg transition-colors ${row.activo ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-300 cursor-not-allowed'}`}
          disabled={disabled || !row.activo}
          onClick={onDelete}
          title={row.activo ? "Archivar" : "Ya está inactivo"}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}