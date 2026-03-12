"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Trash2,
  Tag,
  FolderOpen,
  AlertCircle,
  Package,
  Eye,
  EyeOff,
  Image as ImageIcon,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import { UploaderImage } from "@/components/ui/uploader-image";

type ImagenCategoria = {
  id: string;
  url: string;
  esPortada: boolean;
  orden: number;
};

type Categoria = {
  id: string;
  nombre: string;
  slug: string;
  visible: boolean;
  orden: number;
  imagenes: ImagenCategoria[];
  _count: { productos: number };
};

export default function CategoriasClient({ initialRows }: { initialRows: Categoria[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [imgToDelete, setImgToDelete] = useState<string | null>(null);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setBusy(true);

    await fetch("/api/admin/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });

    setNombre("");
    setBusy(false);
    router.refresh();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta categoría permanentemente?")) return;
    await fetch(`/api/admin/categorias/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function toggleVisibility(id: string, currentVisible: boolean) {
    await fetch(`/api/admin/categorias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !currentVisible }),
    });
    router.refresh();
  }

  async function addImage(categoriaId: string, url: string) {
    await fetch(`/api/admin/categorias/${categoriaId}/imagenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    router.refresh();
  }

  async function removeImage(categoriaId: string, imagenId: string) {
    await fetch(`/api/admin/categorias/${categoriaId}/imagenes/${imagenId}`, {
      method: "DELETE",
    });
    setImgToDelete(null);
    router.refresh();
  }

  async function setPortada(categoriaId: string, imagenId: string) {
    await fetch(`/api/admin/categorias/${categoriaId}/imagenes/${imagenId}/portada`, {
      method: "PATCH",
    });
    router.refresh();
  }

  const categoriasFiltradas = initialRows.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative">

      {/* ----------------- COLUMNA IZQUIERDA: FORMULARIO ----------------- */}
      <div className="lg:col-span-4 lg:sticky lg:top-6">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 p-5 md:p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg tracking-tight">Crear Categoría</h3>
            </div>
            <p className="text-slate-400 text-xs">Agrega nuevas secciones para tu catálogo.</p>
          </div>

          <div className="p-5 md:p-6">
            <form onSubmit={crear} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre</label>
                <div className="relative group">
                  <input
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 text-sm font-medium bg-slate-50 focus:bg-white"
                    placeholder="Ej: Vestidos de Noche"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    disabled={busy}
                  />
                  <Tag className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <p className="text-[11px] md:text-xs text-amber-800 leading-relaxed">
                  💡 <strong>Nota:</strong> Las categorías nuevas estarán <strong>ocultas</strong> por defecto. Configura sus imágenes antes de publicarlas.
                </p>
              </div>

              <button
                disabled={busy || !nombre.trim()}
                className="w-full bg-slate-900 text-white py-3.5 md:py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Categoría"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ----------------- COLUMNA DERECHA: LISTADO ----------------- */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px] lg:min-h-[500px]">

          <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-slate-600 shrink-0">
                <FolderOpen className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Inventario de Categorías</h2>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Total: {categoriasFiltradas.length}
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-64 group">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none bg-white transition-all shadow-sm"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="divide-y divide-slate-50 overflow-y-auto max-h-[600px] custom-scrollbar">
            {categoriasFiltradas.map(c => {
              const tieneProductos = c._count.productos > 0;
              const isEditing = editingId === c.id;

              return (
                <div key={c.id} className={`group p-4 md:p-5 transition-all ${isEditing ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 md:gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${c.visible ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                          <Tag className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-900 text-sm md:text-base truncate">{c.nombre}</p>
                            <div className="flex gap-1.5 items-center">
                              {tieneProductos && (
                                <span className="bg-blue-50 text-blue-700 text-[9px] px-2 py-0.5 rounded-md font-bold border border-blue-100 flex items-center gap-1">
                                  <Package className="w-2.5 h-2.5" /> {c._count.productos}
                                </span>
                              )}
                              <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold border flex items-center gap-1 ${c.visible ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                {c.visible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                                {c.visible ? 'Visible' : 'Oculta'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              /{c.slug}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setEditingId(isEditing ? null : c.id)}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 md:hidden"
                      >
                        {isEditing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className={`${isEditing ? 'flex' : 'hidden md:flex'} flex-wrap items-center gap-2 pt-2 border-t border-slate-100 md:border-0 md:pt-0 justify-end`}>
                      <button
                        onClick={() => setEditingId(isEditing ? null : c.id)}
                        className={`text-[11px] font-bold px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${isEditing ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'}`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        {isEditing ? 'Cerrar Galería' : 'Imágenes'}
                      </button>

                      <button
                        onClick={() => toggleVisibility(c.id, c.visible)}
                        className={`text-[11px] font-bold px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${c.visible
                          ? 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'
                          : 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {c.visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {c.visible ? 'Ocultar' : 'Publicar'}
                      </button>

                      <button
                        onClick={() => eliminar(c.id)}
                        disabled={tieneProductos}
                        className={`text-[11px] font-bold px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${tieneProductos
                          ? 'text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed'
                          : 'text-red-600 bg-white border-red-100 hover:bg-red-50 hover:border-red-200'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {tieneProductos ? 'Protegido' : 'Eliminar'}
                      </button>
                    </div>

                    {isEditing && (
                      <div className="mt-2 p-4 bg-white rounded-xl border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 mb-2">
                           <ImageIcon className="w-4 h-4 text-slate-400" />
                           <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Galería de Categoría</h4>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                          {c.imagenes.map((img) => (
                            <div key={img.id} className="relative group/img aspect-square rounded-lg overflow-hidden border-2 bg-slate-50 transition-all border-slate-100">
                              <img
                                src={img.url}
                                alt=""
                                className={`w-full h-full object-cover transition-opacity ${img.esPortada ? 'opacity-100' : 'opacity-80 group-hover/img:opacity-100'}`}
                              />
                              
                              {/* Overlay de acciones normales */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setImgToDelete(img.id)}
                                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                                  title="Eliminar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                {!img.esPortada && (
                                  <button
                                    onClick={() => setPortada(c.id, img.id)}
                                    className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-lg"
                                    title="Poner como portada"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* MEJORA UX: Overlay de confirmación de borrado */}
                              {imgToDelete === img.id && (
                                <div className="absolute inset-0 bg-red-600/95 z-10 flex flex-col items-center justify-center p-2 text-center animate-in zoom-in duration-200">
                                  <AlertTriangle className="w-5 h-5 text-white mb-1" />
                                  <p className="text-[9px] text-white font-black uppercase leading-tight mb-2">¿Confirmar borrado?</p>
                                  <div className="flex gap-1 w-full">
                                    <button 
                                      onClick={() => removeImage(c.id, img.id)}
                                      className="flex-1 bg-white text-red-600 py-1 rounded-md text-[10px] font-bold"
                                    >SÍ</button>
                                    <button 
                                      onClick={() => setImgToDelete(null)}
                                      className="flex-1 bg-slate-800 text-white py-1 rounded-md text-[10px] font-bold"
                                    >NO</button>
                                  </div>
                                </div>
                              )}

                              {img.esPortada && (
                                <div className="absolute top-1 left-1 bg-green-500 text-white rounded-md p-0.5 shadow-sm">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="max-w-md pt-2">
                          <UploaderImage
                            modulo="categorias"
                            label="Añadir Imagen Editorial"
                            url={null}
                            onUpload={(url) => { if (url) addImage(c.id, url); }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {categoriasFiltradas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold">No se encontraron categorías</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertTriangle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
  );
}