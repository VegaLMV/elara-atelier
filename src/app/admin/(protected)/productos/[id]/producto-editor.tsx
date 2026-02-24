"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X as XIcon, Plus, Eye, Loader2, Printer, Save } from "lucide-react";
import jsPDF from "jspdf";

// ============================================================================
// TIPOS DE DATOS
// ============================================================================

type DescuentoItem = {
  id: string;
  tipo: "PORCENTAJE" | "MONTO";
  valor: string;
  startsAt: string;
  endsAt: string;
  estado: string;
};

type Data = {
  producto: {
    id: string;
    nombre: string;
    descripcion: string;
    precio: string;
    estado: "ACTIVO" | "INACTIVO";
    destacado: boolean;
    categoriaId: string;

    descuentoActivo: boolean;
    descuentoTipo: "PORCENTAJE" | "MONTO";
    descuentoValor: string;
    descuentoInicio: string;
    descuentoFin: string;
    nuevoHasta: string | null;
  };

  descuentosHistorial: DescuentoItem[];

  variantes: Array<{
    id: string;
    tallaId: string;
    colorId: string;
    talla: string;
    color: string;
    colorHex: string | null;
    stockActual: number;
    sku: string | null;
    activa: boolean;
  }>;

  referencias: {
    categorias: Array<{ id: string; nombre: string }>;
    tallas: Array<{ id: string; nombre: string }>;
    colores: Array<{ id: string; nombre: string; hex: string | null }>;
  };

  imagenes: Array<{
    id: string;
    url: string;
    esPortada: boolean;
    orden: number;
  }>;

  imagenesColor: Array<{
    id: string;
    url: string;
    colorId: string;
    colorNombre: string;
    colorHex: string | null;
  }>;
};

// ============================================================================
// HELPERS
// ============================================================================

function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (!Number.isFinite(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

async function leerJson(r: Response) {
  return await r.json().catch(() => ({}));
}

function getColorStyle(hex: string | null) {
  if (!hex) return { backgroundColor: '#fff' };
  const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
  if (codes.length <= 1) return { backgroundColor: codes[0] || '#fff' };

  // Generar gradiente para bicolor/multicolor
  const percentage = 100 / codes.length;
  const stops = codes.map((c, i) => `${c} ${i * percentage}% ${(i + 1) * percentage}%`).join(", ");
  return { background: `linear-gradient(135deg, ${stops})` };
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ProductoEditor({ initialData }: { initialData: Data }) {
  const router = useRouter();

  // ------ ESTADO DEL FORMULARIO PRINCIPAL ------
  const [nombre, setNombre] = useState(initialData.producto.nombre);
  const [descripcion, setDescripcion] = useState(initialData.producto.descripcion);
  const [precio, setPrecio] = useState(initialData.producto.precio);
  const [estado, setEstado] = useState<Data["producto"]["estado"]>(initialData.producto.estado);
  const [destacado, setDestacado] = useState(initialData.producto.destacado);
  const [nuevo, setNuevo] = useState(
    initialData.producto.nuevoHasta ? new Date(initialData.producto.nuevoHasta) > new Date() : false
  );
  const [categoriaId, setCategoriaId] = useState(initialData.producto.categoriaId);

  // ------ ESTADOS DE UI (Toast & Modales) ------
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [previewColor, setPreviewColor] = useState<{ nombre: string; hex: string | null } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ------ LÓGICA DE DESCUENTO VIGENTE ------
  const descuentoVigente = useMemo(() => {
    const ahora = new Date();
    return initialData.descuentosHistorial.find(d => {
      if (d.estado === 'CANCELADO') return false;
      const inicio = new Date(d.startsAt);
      const fin = new Date(d.endsAt);
      fin.setHours(23, 59, 59, 999);
      return ahora >= inicio && ahora <= fin;
    });
  }, [initialData.descuentosHistorial]);

  // ------ ESTADOS DE DESCUENTO MANUAL ------
  const [descuentoActivo, setDescuentoActivo] = useState(!!descuentoVigente || initialData.producto.descuentoActivo);
  const [descuentoTipo, setDescuentoTipo] = useState<Data["producto"]["descuentoTipo"]>(
    (descuentoVigente?.tipo as any) ?? initialData.producto.descuentoTipo ?? "PORCENTAJE"
  );
  const [descuentoValor, setDescuentoValor] = useState(
    descuentoVigente?.valor ?? initialData.producto.descuentoValor ?? ""
  );

  const [descuentoInicio, setDescuentoInicio] = useState(
    descuentoVigente ? new Date(descuentoVigente.startsAt).toISOString().split('T')[0] : (initialData.producto.descuentoInicio ?? "")
  );
  const [descuentoFin, setDescuentoFin] = useState(
    descuentoVigente ? new Date(descuentoVigente.endsAt).toISOString().split('T')[0] : (initialData.producto.descuentoFin ?? "")
  );

  useEffect(() => {
    if (descuentoVigente) {
      setDescuentoActivo(true);
      setDescuentoTipo(descuentoVigente.tipo);
      setDescuentoValor(descuentoVigente.valor);
      setDescuentoInicio(new Date(descuentoVigente.startsAt).toISOString().split('T')[0]);
      setDescuentoFin(new Date(descuentoVigente.endsAt).toISOString().split('T')[0]);
    }
  }, [descuentoVigente]);

  // ------ OTROS ESTADOS ------
  const [subiendo, setSubiendo] = useState(false);
  const [tallasSel, setTallasSel] = useState<string[]>([]);
  const [coloresSel, setColoresSel] = useState<string[]>([]);
  const [qColor, setQColor] = useState("");
  const [ordenVar, setOrdenVar] = useState<"TALLA" | "COLOR" | "STOCK" | "ESTADO">("TALLA");

  const [variantes, setVariantes] = useState(initialData.variantes);
  const [imagenes, setImagenes] = useState(initialData.imagenes);
  const [imagenesColor, setImagenesColor] = useState(initialData.imagenesColor);

  useEffect(() => setVariantes(initialData.variantes), [initialData.variantes]);
  useEffect(() => setImagenes(initialData.imagenes), [initialData.imagenes]);
  useEffect(() => setImagenesColor(initialData.imagenesColor), [initialData.imagenesColor]);

  // ------ MEMOS ------
  const stockTotalActivo = useMemo(
    () => variantes.reduce((acc, v) => acc + (v.activa ? v.stockActual : 0), 0),
    [variantes]
  );

  const precioFinal = useMemo(() => {
    const p = Number(precio || 0);
    const d = Number(descuentoValor || 0);
    if (!descuentoActivo || !Number.isFinite(p) || !Number.isFinite(d)) return null;

    let fin = p;
    if (descuentoTipo === "PORCENTAJE") fin = p * (1 - d / 100);
    if (descuentoTipo === "MONTO") fin = p - d;
    fin = Math.max(0, fin);
    return fin;
  }, [precio, descuentoActivo, descuentoTipo, descuentoValor]);

  // Rankings
  const tallaRank: Record<string, number> = { XS: 1, S: 2, Standar: 3, M: 4, L: 5, XL: 6 };
  const tallasOrdenadas = useMemo(() => {
    return [...initialData.referencias.tallas].sort((a, b) => {
      const ra = tallaRank[a.nombre] ?? 99;
      const rb = tallaRank[b.nombre] ?? 99;
      return ra - rb || a.nombre.localeCompare(b.nombre);
    });
  }, [initialData.referencias.tallas]);

  // Estados para creación rápida de color
  const [showNewColorModal, setShowNewColorModal] = useState(false);
  const [newColorNombre, setNewColorNombre] = useState("");
  const [newColorHex, setNewColorHex] = useState("#");
  const [creandoColor, setCreandoColor] = useState(false);

  // Colores (maestro local que podemos actualizar al crear uno nuevo)
  const [coloresAll, setColoresAll] = useState(initialData.referencias.colores);
  const coloresSeleccionados = useMemo(() => {
    const sel = new Set(coloresSel);
    return coloresAll.filter((c) => sel.has(c.id));
  }, [coloresAll, coloresSel]);

  const coloresNoSeleccionadosFiltrados = useMemo(() => {
    const q = qColor.trim().toLowerCase();
    const sel = new Set(coloresSel);
    const base = q
      ? coloresAll.filter((c) => {
        const n = c.nombre.toLowerCase();
        const h = (c.hex ?? "").toLowerCase();
        return n.includes(q) || h.includes(q);
      })
      : coloresAll;
    return base.filter((c) => !sel.has(c.id)).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [coloresAll, coloresSel, qColor]);

  const previewCombos = useMemo(() => {
    const tallasSelRows = tallasOrdenadas.filter((t) => tallasSel.includes(t.id));
    const coloresSelRows = coloresSeleccionados;
    const total = tallasSelRows.length * coloresSelRows.length;
    const limit = 24;
    const items: Array<{ talla: string; color: string; hex: string | null }> = [];
    for (const t of tallasSelRows) {
      for (const c of coloresSelRows) {
        items.push({ talla: t.nombre, color: c.nombre, hex: c.hex ?? null });
        if (items.length >= limit) break;
      }
      if (items.length >= limit) break;
    }
    return { total, items, limit };
  }, [tallasSel, coloresSeleccionados, tallasOrdenadas]);

  const variantesOrdenadas = useMemo(() => {
    const arr = [...variantes];
    arr.sort((a, b) => {
      const ra = tallaRank[a.talla] ?? 99;
      const rb = tallaRank[b.talla] ?? 99;
      if (ordenVar === "TALLA") return ra - rb || a.color.localeCompare(b.color);
      if (ordenVar === "COLOR") return a.color.localeCompare(b.color) || ra - rb;
      if (ordenVar === "STOCK") return b.stockActual - a.stockActual || ra - rb;
      return Number(b.activa) - Number(a.activa) || ra - rb;
    });
    return arr;
  }, [variantes, ordenVar]);

  const coloresUsados = useMemo(() => {
    const byId = new Map(coloresAll.map((c) => [c.id, c]));
    const usados = new Map<string, { id: string; nombre: string; hex: string | null }>();
    for (const v of variantes) {
      const c = byId.get(v.colorId);
      if (c) usados.set(c.id, c);
    }
    return Array.from(usados.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [variantes, coloresAll]);

  const gruposPorTalla = useMemo(() => {
    type GrupoTalla = {
      talla: string;
      tallaOrden: number;
      totalVariantes: number;
      totalStock: number;
      totalStockActivo: number;
      items: typeof variantes;
    };
    const map = new Map<string, GrupoTalla>();
    for (const v of variantesOrdenadas) {
      const tallaNombre = v.talla;
      const tallaOrden = tallaRank[tallaNombre] ?? 99;
      if (!map.has(tallaNombre)) {
        map.set(tallaNombre, {
          talla: tallaNombre,
          tallaOrden,
          totalVariantes: 0,
          totalStock: 0,
          totalStockActivo: 0,
          items: [],
        });
      }
      const g = map.get(tallaNombre)!;
      g.totalVariantes += 1;
      g.totalStock += v.stockActual;
      if (v.activa) g.totalStockActivo += v.stockActual;
      g.items.push(v);
    }
    const tallas = [...map.values()].sort((a, b) => a.tallaOrden - b.tallaOrden || a.talla.localeCompare(b.talla));
    for (const t of tallas) t.items.sort((a, b) => a.color.localeCompare(b.color));
    return tallas;
  }, [variantesOrdenadas, tallaRank]);

  // ------ API ACTIONS ------

  async function guardarProducto(e: React.FormEvent) {
    e.preventDefault();

    // Validación de conflicto
    if (!descuentoVigente && descuentoActivo) {
      if (!descuentoInicio || !descuentoFin) {
        showToast("Ingresa fechas para el descuento.", "error");
        return;
      }
      const manualStart = descuentoInicio;
      const manualEnd = descuentoFin;
      const conflicto = initialData.descuentosHistorial.find(d => {
        if (d.estado === 'CANCELADO') return false;
        const progStart = new Date(d.startsAt).toISOString().split('T')[0];
        const progEnd = new Date(d.endsAt).toISOString().split('T')[0];
        return manualStart <= progEnd && manualEnd >= progStart;
      });
      if (conflicto) {
        showToast(`Conflicto con campaña del ${new Date(conflicto.startsAt).toLocaleDateString()}`, "error");
        return;
      }
    }

    const r = await fetch(`/api/admin/productos/${initialData.producto.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre, descripcion, precio, estado, destacado, categoriaId: categoriaId || null,
        descuentoActivo: !descuentoVigente && descuentoActivo,
        descuentoTipo: !descuentoVigente && descuentoActivo ? descuentoTipo : null,
        descuentoValor: !descuentoVigente && descuentoActivo ? descuentoValor : null,
        descuentoInicio: !descuentoVigente && descuentoActivo ? descuentoInicio : null,
        descuentoFin: !descuentoVigente && descuentoActivo ? descuentoFin : null,
        nuevo,
      }),
    });

    if (!r.ok) {
      const d = await leerJson(r);
      showToast(d?.error ?? "Error al guardar", "error");
      return;
    }
    router.refresh();
    showToast("Producto guardado correctamente");
  }

  // ✅ Función para eliminar descuento
  async function eliminarDescuento(id: string) {
    if (!confirm("¿Deseas cancelar o eliminar este descuento?")) return;
    try {
      const res = await fetch(`/api/admin/descuentos/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        showToast("Descuento eliminado/cancelado");
      }
      else showToast("Error al eliminar", "error");
    } catch { showToast("Error", "error"); }
  }

  async function crearVariantes() {
    const r = await fetch(`/api/admin/productos/${initialData.producto.id}/variantes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tallaIds: tallasSel, colorIds: coloresSel }),
    });
    if (!r.ok) { const d = await leerJson(r); showToast(d?.error ?? "Error al crear variantes", "error"); return; }

    setTallasSel([]); setColoresSel([]);
    const r2 = await fetch(`/api/admin/productos/${initialData.producto.id}/variantes`);
    const nuevasRaw = await r2.json().catch(() => []);
    const mapHex = new Map(coloresAll.map((c) => [c.id, c.hex ?? null]));
    const nuevas = (Array.isArray(nuevasRaw) ? nuevasRaw : []).map((v: any) => ({
      ...v,
      colorHex: v.colorHex ?? mapHex.get(v.colorId) ?? null,
    }));
    setVariantes(nuevas);
    showToast("Variantes creadas");
  }

  async function ajustarStock(varianteId: string, cambioCantidad: number, nota?: string) {
    const r = await fetch(`/api/admin/variantes/${varianteId}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cambioCantidad, nota }),
    });
    if (!r.ok) { showToast("Error al ajustar stock", "error"); return; }
    setVariantes((prev) => prev.map((v) => (v.id === varianteId ? { ...v, stockActual: v.stockActual + cambioCantidad } : v)));
    router.refresh();
    showToast("Stock actualizado");
  }

  async function cambiarActiva(varianteId: string, activa: boolean) {
    const r = await fetch(`/api/admin/variantes/${varianteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa }),
    });
    if (r.ok) {
      setVariantes((prev) => prev.map((v) => (v.id === varianteId ? { ...v, activa } : v)));
      showToast(activa ? "Variante visible" : "Variante ocultada");
    } else {
      showToast("Error al cambiar estado", "error");
    }
  }

  async function subirImagen(file: File) {
    setSubiendo(true);
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch(`/api/admin/productos/${initialData.producto.id}/imagenes`, { method: "POST", body: fd });
    const d = await leerJson(r);
    setSubiendo(false);
    if (r.ok) {
      setImagenes((prev) => [...prev, { id: d.id, url: d.url, esPortada: d.esPortada, orden: d.orden }]);
      showToast("Imagen subida");
    } else {
      showToast("Error al subir imagen", "error");
    }
  }

  async function eliminarImagen(id: string) {
    const r = await fetch(`/api/admin/imagenes/${id}`, { method: "DELETE" });
    if (r.ok) {
      setImagenes((prev) => prev.filter((x) => x.id !== id));
      showToast("Imagen eliminada");
    } else {
      showToast("Error al eliminar imagen", "error");
    }
  }

  async function ponerPortada(id: string) {
    const r = await fetch(`/api/admin/productos/${initialData.producto.id}/imagenes/${id}/portada`, { method: "PATCH" });
    if (r.ok) { setImagenes((prev) => prev.map((img) => ({ ...img, esPortada: img.id === id }))); showToast("Portada actualizada"); }
  }

  async function crearNuevoColor() {
    if (!newColorNombre.trim()) return;
    setCreandoColor(true);
    try {
      const res = await fetch("/api/admin/colores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newColorNombre, hex: newColorHex }),
      });
      if (res.ok) {
        const d = await res.json();
        setColoresAll(prev => [...prev, { id: d.id, nombre: d.nombre, hex: d.hex }]);
        setColoresSel(prev => [...prev, d.id]);
        setShowNewColorModal(false);
        setNewColorNombre("");
        setNewColorHex("#");
        showToast("Color creado y seleccionado");
      } else {
        const d = await res.json();
        showToast(d.error || "Error al crear color", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setCreandoColor(false);
    }
  }

  const combinaciones = tallasSel.length * coloresSel.length;

  const historialFiltrado = initialData.descuentosHistorial.filter(d =>
    !descuentoVigente || d.id !== descuentoVigente.id
  );

  // ✅ ESCENARIO A: GENERACIÓN DE ETIQUETAS PDF MEJORADO (SEGÚN STOCK FÍSICO)
  const generarEtiquetasPDF = () => {
    if (!variantes || variantes.length === 0) {
      return showToast("No hay variantes creadas para imprimir.", "error");
    }

    // Inicializar documento A4 (210 x 297 mm)
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    // Configuración de la cuadrícula (Grid)
    const margenX = 15;
    const margenY = 15;
    const columnas = 3;
    const filasPorPagina = 7;
    const gap = 5; // Espacio entre etiquetas

    // Cálculo de tamaño de etiqueta
    const anchoEtiqueta = (210 - (margenX * 2) - (gap * (columnas - 1))) / columnas;
    const altoEtiqueta = 35; // 3.5 cm de alto

    let colActual = 0;
    let filaActual = 0;

    // Recorrer variantes y generar etiquetas según el stock
    variantes.forEach((variante) => {
      // Imprimir tantas etiquetas como stock haya (mínimo 1 por seguridad/modelo)
      const cantidadAImprimir = variante.stockActual > 0 ? variante.stockActual : 1;

      for (let i = 0; i < cantidadAImprimir; i++) {
        // Control de saltos de página
        if (filaActual >= filasPorPagina) {
          doc.addPage();
          filaActual = 0;
          colActual = 0;
        }

        // Posición X e Y actual
        const posX = margenX + (colActual * (anchoEtiqueta + gap));
        const posY = margenY + (filaActual * (altoEtiqueta + gap));

        // Dibujar el marco de la etiqueta (borde gris claro)
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.roundedRect(posX, posY, anchoEtiqueta, altoEtiqueta, 2, 2, "S");

        // TEXTOS DE LA ETIQUETA (Centrados)
        const centroX = posX + (anchoEtiqueta / 2);

        // 1. Marca
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text("ÉLARA ATELIER", centroX, posY + 6, { align: "center" });

        // Línea separadora
        doc.setDrawColor(226, 232, 240);
        doc.line(posX + 5, posY + 8, posX + anchoEtiqueta - 5, posY + 8);

        // 2. Producto
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105); // slate-600
        const nombreCorto = nombre.length > 25 ? nombre.substring(0, 22) + "..." : nombre;
        doc.text(nombreCorto.toUpperCase(), centroX, posY + 13, { align: "center" });

        // 3. Variante (Talla y Color)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0); // black
        doc.text(`${variante.talla} | ${variante.color}`, centroX, posY + 19, { align: "center" });

        // 4. SKU (Identificador único corto)
        doc.setFont("courier", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42); // slate-900
        const skuLabel = variante.sku || variante.id.slice(-8).toUpperCase();
        doc.text(`SKU: ${skuLabel}`, centroX, posY + 25, { align: "center" });

        // 5. Precio
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(`S/ ${Number(precio).toFixed(2)}`, centroX, posY + 31, { align: "center" });

        // Avanzar a la siguiente celda
        colActual++;
        if (colActual >= columnas) {
          colActual = 0;
          filaActual++;
        }
      }
    });

    // Guardar el PDF con el nombre del producto
    const nombreArchivo = `Etiquetas_${nombre.replace(/\s+/g, '_')}.pdf`;
    doc.save(nombreArchivo);
    showToast("PDF de etiquetas generado correctamente");
  };

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8 max-w-7xl mx-auto relative pb-24 md:pb-6">
      {/* ✅ TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-20 md:bottom-5 right-4 md:right-5 px-4 md:px-6 py-3 rounded-lg shadow-2xl text-white font-medium text-xs md:text-sm animate-in slide-in-from-bottom-5 fade-in duration-300 z-[9999] flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header Adaptativo */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-gray-200 pb-4 md:pb-6">
        <div className="flex items-start md:items-center gap-3 md:gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin/productos")}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors group shrink-0 mt-1 md:mt-0"
            title="Volver al listado"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-500 group-hover:text-black" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 uppercase">Editar Producto</h1>
              {descuentoVigente && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] md:text-xs font-bold px-2 md:px-2.5 py-0.5 rounded-full border border-green-200 animate-pulse">
                  🏷️ Oferta Activa
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              SKU: <span className="font-mono text-[10px] md:text-xs text-gray-400 bg-gray-100 px-1 py-0.5 rounded break-all">{initialData.producto.id}</span>
            </p>
          </div>
        </div>
        <div className="hidden md:block text-right bg-blue-50/50 px-4 py-2 rounded-xl border border-blue-100">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Stock Total</p>
          <p className="text-2xl font-black text-blue-700 leading-none">{stockTotalActivo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* COLUMNA IZQUIERDA (Formulario principal) */}
        <div className="xl:col-span-2 space-y-6 md:space-y-8">
          <form onSubmit={guardarProducto} className="bg-white border rounded-xl p-4 md:p-6 shadow-sm space-y-5 md:space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="font-semibold text-base md:text-lg text-gray-800">Detalles Generales</h2>
              <div className="md:hidden text-right">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Stock</span>
                <span className="text-lg font-black text-blue-700 leading-none">{stockTotalActivo}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs md:text-sm font-medium text-gray-700">Nombre</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm md:text-base text-gray-900 focus:ring-black/5 outline-none" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs md:text-sm font-medium text-gray-700">Descripción</label>
                <textarea className="w-full border rounded-lg px-3 py-2 h-24 text-sm md:text-base text-gray-900 focus:ring-black/5 outline-none resize-y" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs md:text-sm font-medium text-gray-700">Precio Base (S/)</label>
                  <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm md:text-base text-gray-900" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs md:text-sm font-medium text-gray-700">Estado</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm md:text-base text-gray-900 bg-white" value={estado} onChange={(e) => setEstado(e.target.value as any)}>
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs md:text-sm font-medium text-gray-700">Categoría</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm md:text-base text-gray-900 bg-white" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                    <option value="">Sin categoría</option>
                    {initialData.referencias.categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-2 pb-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="destacado" checked={destacado} onChange={(e) => setDestacado(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" />
                  <label htmlFor="destacado" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Destacado en portada</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="nuevo"
                    checked={nuevo}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setNuevo(val);
                      if (val && estado === "INACTIVO") {
                        setEstado("ACTIVO");
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="nuevo" className="text-sm font-medium text-gray-700 cursor-pointer select-none flex items-center gap-1.5">
                    Marcar como <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Nuevo</span>
                  </label>
                </div>
              </div>

              {/* SECCIÓN DESCUENTO MANUAL */}
              <div className={`p-3 md:p-4 rounded-xl border space-y-3 mt-2 transition-colors ${descuentoVigente ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={descuentoActivo}
                      onChange={(e) => !descuentoVigente && setDescuentoActivo(e.target.checked)}
                      disabled={!!descuentoVigente}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black disabled:opacity-50"
                    />
                    {descuentoVigente ? "Oferta Programada ACTIVA" : "Aplicar Descuento Manual"}
                  </label>
                  {precioFinal !== null && (
                    <span className="text-xs md:text-sm font-bold text-green-700 bg-green-100 px-2 md:px-3 py-1 rounded-md border border-green-200 self-start sm:self-auto">
                      Final: {soles(precioFinal)}
                    </span>
                  )}
                </div>

                {/* Mensaje + Botón de Cancelar para la campaña activa */}
                {descuentoVigente && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-800 mb-2 bg-blue-100/50 p-2.5 md:p-3 rounded-lg border border-blue-100">
                    <span className="flex items-center gap-1.5"><span>ℹ️</span> <span>Campaña gestionada desde <b>Descuentos</b>.</span></span>
                    <button
                      type="button"
                      onClick={() => eliminarDescuento(descuentoVigente.id)}
                      className="text-red-600 hover:text-red-800 font-bold bg-white px-2 py-1 rounded border border-red-100 self-start sm:self-auto"
                    >
                      Cancelar Oferta
                    </button>
                  </div>
                )}

                {descuentoActivo && (
                  <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${descuentoVigente ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Tipo</label>
                      <select className="w-full border rounded-lg text-sm p-2 md:p-2.5 bg-white" value={descuentoTipo} onChange={(e) => setDescuentoTipo(e.target.value as any)}>
                        <option value="PORCENTAJE">Porcentaje</option>
                        <option value="MONTO">Monto Fijo</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Valor</label>
                      <input type="number" className="w-full border rounded-lg text-sm p-2 md:p-2.5" value={descuentoValor} onChange={(e) => setDescuentoValor(e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Inicio</label>
                      <input type="date" className="w-full border rounded-lg text-sm p-2 md:p-2.5 bg-white" value={descuentoInicio} onChange={(e) => setDescuentoInicio(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Fin</label>
                      <input type="date" className="w-full border rounded-lg text-sm p-2 md:p-2.5 bg-white" value={descuentoFin} onChange={(e) => setDescuentoFin(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BOTONES DE ACCIÓN (Pegajosos en móvil) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 md:relative md:bg-transparent md:border-t-0 md:p-0 md:pt-4 md:mt-6 z-50 flex flex-col-reverse md:flex-row md:justify-between md:items-center gap-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] md:shadow-none">
              <button
                type="button"
                onClick={generarEtiquetasPDF}
                className="w-full md:w-auto flex items-center justify-center gap-2 text-slate-600 hover:text-black font-bold text-xs md:text-sm h-11 md:h-10 px-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all bg-white shadow-sm"
              >
                <Printer className="w-4 h-4" /> GENERAR PDF ETIQUETAS
              </button>

              <div className="flex gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => router.push("/admin/productos")}
                  className="w-1/3 md:w-auto px-4 md:px-6 py-2.5 rounded-xl font-medium text-gray-500 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button type="submit" className="w-2/3 md:w-auto bg-black text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm">
                  <Save className="w-4 h-4" /> Guardar
                </button>
              </div>
            </div>
          </form>

          {/* Historial filtrado */}
          <div className="hidden md:block">
            <HistorialDescuentos
              historial={historialFiltrado}
              onEliminar={eliminarDescuento}
            />
          </div>

          {/* GESTIÓN DE VARIANTES */}
          <div className="bg-white border rounded-xl p-4 md:p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <h2 className="font-semibold text-base md:text-lg text-gray-800">Variantes y Stock</h2>
              <div className="text-[10px] md:text-xs font-bold px-2.5 py-1 bg-gray-100 rounded-md text-gray-600 w-fit">
                {tallasSel.length} tallas · {coloresSel.length} colores
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-3 bg-gray-50/50 p-3 md:p-4 rounded-xl border border-gray-100">
                <p className="text-[11px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">1. Selecciona Tallas</p>
                <div className="flex flex-wrap gap-2">
                  {tallasOrdenadas.map((t) => {
                    const selected = tallasSel.includes(t.id);
                    return <button key={t.id} type="button" onClick={() => setTallasSel((s) => toggle(s, t.id))} className={`px-4 py-1.5 rounded-lg border text-xs md:text-sm font-bold transition-all ${selected ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 active:bg-gray-100'}`}>{t.nombre}</button>;
                  })}
                </div>
              </div>
              <div className="space-y-3 bg-gray-50/50 p-3 md:p-4 rounded-xl border border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">2. Selecciona Colores</p>
                  <button
                    type="button"
                    onClick={() => setShowNewColorModal(true)}
                    className="text-[10px] bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 px-2 py-1 rounded-md font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    + Nuevo Color
                  </button>
                </div>
                <input className="text-xs border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-black/10 outline-none" placeholder="Filtrar color..." value={qColor} onChange={e => setQColor(e.target.value)} />
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                  {coloresSeleccionados.map((c) => (
                    <div key={c.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => setColoresSel((s) => toggle(s, c.id))}
                        className="pl-1 pr-3 py-1 rounded-full border text-[11px] md:text-xs flex items-center gap-1.5 bg-black text-white border-black shadow-md transition-all active:scale-95"
                      >
                        <span className="w-5 h-5 rounded-full border border-white/30 shrink-0 shadow-inner" style={getColorStyle(c.hex)} />
                        {c.nombre}
                      </button>
                    </div>
                  ))}
                  {coloresNoSeleccionadosFiltrados.map((c) => (
                    <div key={c.id} className="relative group">
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColoresSel((s) => toggle(s, c.id))}
                        className="pl-1 pr-3 py-1 rounded-full border text-[11px] md:text-xs flex items-center gap-1.5 bg-white text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-400 transition-all active:scale-95 shadow-sm"
                      >
                        <span className="w-5 h-5 rounded-full border border-gray-200 shrink-0 shadow-inner" style={getColorStyle(c.hex)} />
                        {c.nombre}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 pt-5">
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button type="button" onClick={crearVariantes} disabled={combinaciones === 0} className="w-full sm:w-auto bg-black text-white px-5 py-2.5 md:py-2 rounded-xl text-xs md:text-sm font-bold shadow-md hover:bg-gray-800 disabled:opacity-50 transition-all">
                  Generar {combinaciones > 0 ? combinaciones : ''} Variantes
                </button>
                <Link
                  href={`/admin/compras/nueva?prefillProducto=${initialData.producto.id}`}
                  className="w-full sm:w-auto justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-2.5 md:py-2 rounded-xl text-xs md:text-sm font-bold shadow-sm hover:bg-emerald-100 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Registrar Compra (Surtir)
                </Link>
              </div>
            </div>

            {/* Lista de Variantes (Tabla con scroll) */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
              {gruposPorTalla.length === 0 ? <div className="p-10 text-center text-gray-400 text-sm font-medium">No hay variantes creadas.</div> :
                <div className="divide-y divide-gray-200">
                  {gruposPorTalla.map((grupo) => (
                    <details key={grupo.talla} className="group bg-white" open>
                      <summary className="px-4 md:px-5 py-3 md:py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors list-none select-none">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 group-open:rotate-90 transition-transform">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-gray-900 text-sm md:text-base">Talla {grupo.talla}</span>
                        </div>
                        <span className="text-[10px] md:text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200">{grupo.totalStock} items</span>
                      </summary>
                      <div className="border-t border-gray-100 overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[500px]">
                          <tbody className="divide-y divide-gray-50">
                            {grupo.items.map((variante) => (
                              <FilaVarianteAgrupada
                                key={variante.id}
                                row={variante}
                                onAjustar={ajustarStock}
                                onCambiarActiva={cambiarActiva}
                                onPreviewColor={setPreviewColor}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  ))}
                </div>
              }
            </div>
          </div>

          <div className="md:hidden">
            <HistorialDescuentos
              historial={historialFiltrado}
              onEliminar={eliminarDescuento}
            />
          </div>
        </div>

        {/* COLUMNA DERECHA (Galería y Colores) */}
        <div className="space-y-6 md:space-y-8">
          {/* Galería General */}
          <div className="bg-white border rounded-xl p-4 md:p-6 shadow-sm space-y-4">
            <h3 className="font-semibold border-b border-gray-100 pb-2 text-gray-800 text-sm md:text-base">Galería General</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-2 gap-2 md:gap-3">
              {imagenes.sort((a, b) => Number(b.esPortada) - Number(a.esPortada)).map((img) => (
                <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-black transition-all bg-gray-100 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-110" onClick={() => setPreviewImage(img.url)} />

                  {img.esPortada && (
                    <div className="absolute top-1 left-1 md:top-2 md:left-2 flex items-center gap-1 bg-black text-white text-[8px] md:text-[9px] font-black px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow-lg backdrop-blur-md uppercase tracking-widest z-10">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      Portada
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1.5 md:gap-2 backdrop-blur-[2px] pointer-events-none">
                    <div className="pointer-events-auto flex flex-col gap-1.5 md:gap-2 scale-90 group-hover:scale-100 transition-transform w-full px-2">
                      {!img.esPortada && (
                        <button
                          onClick={() => ponerPortada(img.id)}
                          className="w-full text-[9px] md:text-[10px] bg-white text-black font-black uppercase tracking-tighter py-1.5 md:py-2 rounded-lg hover:bg-gray-100 shadow-xl"
                        >
                          Principal
                        </button>
                      )}
                      <button
                        onClick={() => eliminarImagen(img.id)}
                        className="w-full text-[9px] md:text-[10px] bg-red-600 text-white font-black uppercase tracking-tighter py-1.5 md:py-2 rounded-lg hover:bg-red-700 shadow-xl"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all group relative overflow-hidden bg-gray-50/50">
                <div className="flex flex-col items-center gap-1 md:gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border shadow-sm flex items-center justify-center group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors">
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-[9px] md:text-[10px] font-bold text-gray-500 group-hover:text-black uppercase tracking-widest">
                    {subiendo ? 'Subiendo...' : 'Añadir'}
                  </span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { e.target.value = ''; subirImagen(f); } }} />
              </label>
            </div>
          </div>

          {/* Fotos por Color */}
          <div className="bg-white border rounded-xl p-4 md:p-6 shadow-sm space-y-4">
            <h3 className="font-semibold border-b border-gray-100 pb-2 text-gray-800 text-sm md:text-base">Fotos por Color</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
              {coloresUsados.length === 0 && <div className="text-center py-6 text-gray-400 text-xs italic bg-gray-50 rounded-xl border border-gray-100">Crea variantes con color primero.</div>}
              {coloresUsados.map((c) => {
                const img = imagenesColor.find(x => x.colorId === c.id);
                return (
                  <div key={c.id} className="flex items-center gap-3 p-2 md:p-2.5 border border-gray-200 rounded-xl hover:border-gray-300 transition-all bg-white shadow-sm hover:shadow-md group">
                    <div className={`w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 relative border shadow-inner ${img ? 'cursor-zoom-in group-hover:opacity-90' : ''}`} onClick={() => img && setPreviewImage(img.url)}>
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300"><span className="text-[9px] md:text-[10px] font-bold uppercase tracking-tighter">Sin foto</span></div>
                      )}
                      {!img && (
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[8px] bg-black text-white px-1.5 py-0.5 rounded font-bold">SUBIR</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border shadow-sm ring-1 ring-black/5 shrink-0" style={getColorStyle(c.hex)} />
                        <span className="text-xs md:text-sm font-bold text-gray-800 truncate">{c.nombre}</span>
                      </div>
                      <label className="inline-flex w-fit text-[9px] md:text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold uppercase tracking-widest cursor-pointer items-center gap-1 transition-colors px-2 py-1 rounded">
                        {img ? '↺ Cambiar' : '+ Subir'}
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const f = e.target.files?.[0]; if (!f) return;
                          const fd = new FormData(); fd.append("colorId", c.id); fd.append("file", f);
                          const r = await fetch(`/api/admin/productos/${initialData.producto.id}/imagenes-color`, { method: "POST", body: fd });
                          if (r.ok) { const d = await r.json(); setImagenesColor(prev => { const idx = prev.findIndex(x => x.colorId === c.id); if (idx >= 0) { const copy = [...prev]; copy[idx] = { ...copy[idx], url: d.url }; return copy; } return [...prev, { id: d.id, url: d.url, colorId: c.id, colorNombre: c.nombre, colorHex: c.hex ?? null }]; }); showToast("Imagen actualizada"); }
                        }} />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MODALES */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-2 md:p-4 animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-4 right-4 md:top-6 md:right-6 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full" onClick={() => setPreviewImage(null)}>
            <XIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewImage} alt="Vista previa" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {previewColor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPreviewColor(null)}>
          <div
            className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-xs animate-in zoom-in-95 duration-200 flex flex-col items-center gap-4 md:gap-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="absolute top-3 right-3 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 p-2 rounded-full transition-colors" onClick={() => setPreviewColor(null)}>
              <XIcon className="w-4 h-4" />
            </button>

            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-8 border-gray-50 shadow-inner ring-1 ring-gray-200" style={getColorStyle(previewColor.hex)} />

            <div className="text-center w-full space-y-2">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 truncate px-2">{previewColor.nombre}</h3>
              <p className="text-xs md:text-sm text-gray-500 font-mono bg-gray-50 py-1.5 rounded-lg uppercase tracking-widest border border-gray-100 mx-auto w-fit px-4">
                {previewColor.hex || "Sin Hexadecimal"}
              </p>
            </div>
          </div>
        </div>
      )}

      {showNewColorModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowNewColorModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-sm animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg md:text-xl font-black text-gray-900">Nuevo Color</h3>
              <button onClick={() => setShowNewColorModal(false)} className="p-1.5 bg-gray-100 rounded-full text-gray-500 hover:text-black hover:bg-gray-200"><XIcon className="w-4 h-4" /></button>
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Nombre del Color</label>
                <input
                  autoFocus
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm md:text-base focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition-all"
                  placeholder="Ej: Rosa Pastel"
                  value={newColorNombre}
                  onChange={(e) => setNewColorNombre(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Código HEX (Opcional)</label>
                <div className="flex items-center gap-3">
                  <input
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm md:text-base focus:ring-2 focus:ring-black/10 focus:border-black outline-none font-mono uppercase transition-all"
                    placeholder="#000000"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                  />
                  <div className="w-12 h-12 rounded-xl border-4 border-white shadow-md ring-1 ring-gray-200 shrink-0" style={getColorStyle(newColorHex)} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 italic">Para bicolor usa comas: <span className="font-mono bg-gray-50 px-1 rounded">#HEX1, #HEX2</span></p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewColorModal(false)}
                  className="flex-1 px-4 py-3 md:py-2.5 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={creandoColor || !newColorNombre.trim()}
                  className="flex-1 px-4 py-3 md:py-2.5 text-sm font-bold bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  {creandoColor ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

// Pequeño helper visual para la tabla
const ChevronRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>
);

function FilaVarianteAgrupada({ row, onAjustar, onCambiarActiva, onPreviewColor }: any) {
  const [ajuste, setAjuste] = useState("");
  return (
    <tr className="hover:bg-blue-50/50 transition-colors group border-b border-gray-50 last:border-0">
      <td className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onPreviewColor({ nombre: row.color, hex: row.colorHex })}
            className="w-7 h-7 md:w-8 md:h-8 rounded-full border shadow-sm ring-2 ring-transparent hover:ring-black/20 hover:scale-110 transition-all cursor-zoom-in flex-shrink-0"
            style={getColorStyle(row.colorHex)}
            title="Ver detalle de estilo"
          />
          <span className="text-gray-900 font-bold text-xs md:text-sm cursor-pointer hover:underline hover:text-blue-600 truncate max-w-[100px] sm:max-w-[200px]"
            onClick={() => onPreviewColor({ nombre: row.color, hex: row.colorHex })}
          >
            {row.color}
          </span>
          {/* SKU para referencia rápida */}
          <span className="text-[10px] text-slate-500 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-bold hidden sm:inline-block">
            {row.sku || "S/N"}
          </span>
        </div>
      </td>
      <td className="px-2 md:px-6 py-3 text-center">
        <span className={`text-sm md:text-base font-black px-2 py-0.5 rounded-md ${row.stockActual === 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'text-slate-900'}`}>
          {row.stockActual}
        </span>
      </td>
      <td className="px-2 md:px-6 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5 md:gap-2">
          <input className="w-12 md:w-16 border border-gray-300 rounded-lg text-xs px-2 py-2 md:py-1.5 text-center focus:ring-2 focus:ring-black/10 outline-none transition-all" placeholder="+ / -" value={ajuste} onChange={e => setAjuste(e.target.value)} type="number" />
          <button onClick={() => { onAjustar(row.id, Number(ajuste)); setAjuste(""); }} className="text-[10px] md:text-xs font-bold bg-black text-white px-2.5 md:px-3 py-2 md:py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all uppercase tracking-wider" disabled={!ajuste}>Ajustar</button>
        </div>
      </td>
      <td className="px-4 md:px-6 py-3 text-center w-16">
        <button
          onClick={() => onCambiarActiva(row.id, !row.activa)}
          className={`relative inline-flex h-6 w-11 md:h-7 md:w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 shadow-inner ${row.activa ? 'bg-emerald-500' : 'bg-gray-300'}`}
          title={row.activa ? "Visible en catálogo" : "Oculto en catálogo"}
        >
          <span className={`inline-block h-4 w-4 md:h-5 md:w-5 transform rounded-full bg-white shadow transition-transform ${row.activa ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </td>
    </tr >
  );
}

// ✅ SOLO MUESTRA HISTORIAL
function HistorialDescuentos({ historial, onEliminar }: { historial: DescuentoItem[], onEliminar: (id: string) => void }) {

  const listaOrdenada = [...historial].sort((a, b) => {
    const now = new Date();

    const getEstadoPeso = (item: DescuentoItem) => {
      const start = new Date(item.startsAt);
      const end = new Date(item.endsAt);
      end.setHours(23, 59, 59, 999);

      const isCancelled = item.estado === 'CANCELADO';
      if (isCancelled) return 0;

      const isActive = now >= start && now <= end;
      if (isActive) return 2;

      const isFuture = now < start;
      if (isFuture) return 1;

      return 0;
    };

    const pesoA = getEstadoPeso(a);
    const pesoB = getEstadoPeso(b);

    if (pesoA !== pesoB) {
      return pesoB - pesoA;
    }

    return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
  });

  if (listaOrdenada.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
      <h4 className="text-xs md:text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-3 md:pb-4 mb-3 md:mb-4">
        Historial de Campañas
      </h4>
      <div className="max-h-[300px] overflow-y-auto space-y-2.5 md:space-y-3 pr-1 custom-scrollbar">
        {listaOrdenada.map((desc) => {
          const now = new Date();
          const start = new Date(desc.startsAt);
          const end = new Date(desc.endsAt);
          end.setHours(23, 59, 59, 999);

          const isActive = now >= start && now <= end && desc.estado !== 'CANCELADO';
          const isFuture = now < start && desc.estado !== 'CANCELADO';
          const isCancelled = desc.estado === 'CANCELADO';

          // Estilo condicional
          let borderClass = 'border-gray-200';
          let bgClass = 'bg-white';

          if (isActive) { borderClass = 'border-green-300'; bgClass = 'bg-green-50/50'; }
          else if (isFuture) { borderClass = 'border-blue-200'; bgClass = 'bg-blue-50/30'; }
          if (isCancelled) { borderClass = 'border-gray-200'; bgClass = 'bg-gray-50/50 opacity-70'; }

          return (
            <div key={desc.id} className={`flex items-center justify-between p-3 md:p-4 rounded-xl border ${borderClass} ${bgClass} transition-all shadow-sm`}>
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg font-bold text-white text-[10px] md:text-xs shadow-sm shrink-0 ${isActive ? 'bg-green-600' : isFuture ? 'bg-blue-500' : isCancelled ? 'bg-gray-400' : 'bg-gray-400'}`}>
                  {desc.tipo === "PORCENTAJE" ? "%" : "S/"}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                    <span className={`font-black text-sm md:text-base ${isCancelled ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {desc.tipo === "PORCENTAJE" ? `-${desc.valor}%` : `-S/ ${desc.valor}`}
                    </span>
                    {isActive && <span className="text-[9px] md:text-[10px] bg-green-100 text-green-700 px-1.5 md:px-2 py-0.5 rounded-full font-bold border border-green-200 tracking-wider">ACTIVA</span>}
                    {isFuture && <span className="text-[9px] md:text-[10px] bg-blue-50 text-blue-700 px-1.5 md:px-2 py-0.5 rounded-full font-bold border border-blue-200 tracking-wider">PROG.</span>}
                    {isCancelled && <span className="text-[9px] md:text-[10px] bg-gray-100 text-gray-500 px-1.5 md:px-2 py-0.5 rounded-full font-bold border border-gray-200 tracking-wider">CANC.</span>}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-1.5 flex items-center gap-1 font-medium">
                    <span>{start.toLocaleDateString()}</span>
                    <span className="text-gray-300">➜</span>
                    <span>{end.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              {!isCancelled && (
                <button
                  onClick={() => onEliminar(desc.id)}
                  className="group p-1.5 md:p-2 rounded-full hover:bg-red-50 hover:text-red-600 text-gray-400 border border-transparent hover:border-red-100 transition-colors shrink-0"
                  title="Cancelar campaña"
                >
                  <XIcon className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}