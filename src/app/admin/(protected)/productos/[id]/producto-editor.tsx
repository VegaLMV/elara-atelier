"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";


type Data = {
  producto: {
    id: string;
    nombre: string;
    descripcion: string;
    precio: string;
    estado: "ACTIVO" | "INACTIVO";
    destacado: boolean;
    categoriaId: string;
  };
  variantes: Array<{
    id: string;
    tallaId: string;
    colorId: string;
    talla: string;
    color: string;
    stockActual: number;
    activa: boolean;
  }>;
  referencias: {
    categorias: Array<{ id: string; nombre: string }>;
    tallas: Array<{ id: string; nombre: string }>;
    colores: Array<{ id: string; nombre: string }>;
  };
  imagenes: Array<{
    id: string;
    url: string;
    esPortada: boolean;
    orden: number;
  }>;
};

export default function ProductoEditor({ initialData }: { initialData: Data }) {
  const router = useRouter();

  const [nombre, setNombre] = useState(initialData.producto.nombre);
  const [descripcion, setDescripcion] = useState(initialData.producto.descripcion);
  const [precio, setPrecio] = useState(initialData.producto.precio);
  const [estado, setEstado] = useState<Data["producto"]["estado"]>(initialData.producto.estado);
  const [destacado, setDestacado] = useState(initialData.producto.destacado);
  const [categoriaId, setCategoriaId] = useState(initialData.producto.categoriaId);

  const [tallasSel, setTallasSel] = useState<string[]>([]);
  const [coloresSel, setColoresSel] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // IMÁGENES
  const [subiendo, setSubiendo] = useState(false);

  const [variantes, setVariantes] = useState(initialData.variantes);
  const [imagenes, setImagenes] = useState(initialData.imagenes);

  useEffect(() => setVariantes(initialData.variantes), [initialData.variantes]);
  useEffect(() => setImagenes(initialData.imagenes), [initialData.imagenes]);

  const stockTotal = useMemo(
    () => variantes.reduce((acc, v) => acc + (v.activa ? v.stockActual : 0), 0),
    [variantes]
  );

  async function leerJson(r: Response) {
    return await r.json().catch(() => ({}));
  }


  async function guardarProducto(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const r = await fetch(`/api/admin/productos/${initialData.producto.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        descripcion,
        precio,
        estado,
        destacado,
        categoriaId: categoriaId || null,
      }),
    });

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d?.error ?? "Error al guardar");
      return;
    }

    router.push("/admin/productos");
  }

  async function crearVariantes() {
    setError(null);
    const r = await fetch(`/api/admin/productos/${initialData.producto.id}/variantes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tallaIds: tallasSel, colorIds: coloresSel }),
    });

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d?.error ?? "Error al crear variantes");
      return;
    }

    setTallasSel([]);
    setColoresSel([]);
    const r2 = await fetch(`/api/admin/productos/${initialData.producto.id}/variantes`);
    const nuevas = await r2.json().catch(() => []);
    setVariantes(nuevas);
  }

  async function ajustarStock(varianteId: string, cambioCantidad: number, nota?: string) {
    setError(null);

    const r = await fetch(`/api/admin/variantes/${varianteId}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cambioCantidad, nota }),
    });

    const d = await leerJson(r);

    if (!r.ok) {
      setError(d?.error ?? "Error al ajustar stock");
      return;
    }

    setVariantes((prev) =>
      prev.map((v) => (v.id === varianteId ? { ...v, stockActual: d.stockActual } : v))
    );
  }

  async function cambiarActiva(varianteId: string, activa: boolean) {
    setError(null);

    const r = await fetch(`/api/admin/variantes/${varianteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa }),
    });

    const d = await leerJson(r);

    if (!r.ok) {
      setError(d?.error ?? "Error al cambiar estado");
      return;
    }

    setVariantes((prev) =>
      prev.map((v) => (v.id === varianteId ? { ...v, activa: d.activa } : v))
    );
  }

  // IMÁGENES: subir / eliminar / portada
  async function subirImagen(file: File) {
    setError(null);
    setSubiendo(true);

    const fd = new FormData();
    fd.append("file", file);

    const r = await fetch(`/api/admin/productos/${initialData.producto.id}/imagenes`, {
      method: "POST",
      body: fd,
    });

    const d = await leerJson(r);
    setSubiendo(false);

    if (!r.ok) {
      setError(d?.error ?? "Error subiendo imagen");
      return;
    }

    setImagenes((prev) => [
      ...prev,
      { id: d.id, url: d.url, esPortada: d.esPortada, orden: d.orden },
    ]);
  }

  async function eliminarImagen(id: string) {
    setError(null);

    const r = await fetch(`/api/admin/imagenes/${id}`, { method: "DELETE" });
    const d = await leerJson(r);

    if (!r.ok) {
      setError(d?.error ?? "Error eliminando imagen");
      return;
    }

    setImagenes((prev) => prev.filter((x) => x.id !== id));
  }


  async function ponerPortada(id: string) {
    setError(null);

    const r = await fetch(`/api/admin/imagenes/${id}/portada`, { method: "PATCH" });
    const d = await leerJson(r);

    if (!r.ok) {
      setError(d?.error ?? "Error marcando portada");
      return;
    }

    setImagenes((prev) => prev.map((x) => ({ ...x, esPortada: x.id === id })));
  }

  function toggle(list: string[], id: string) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  const combinaciones = tallasSel.length * coloresSel.length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Editar producto</h1>
        <p className="text-sm opacity-80">
          Stock total activo: <b>{stockTotal}</b>
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* FORMULARIO PRODUCTO */}
      <form onSubmit={guardarProducto} className="border rounded-xl p-4 space-y-3 max-w-2xl">
        <div className="space-y-1">
          <label className="text-sm">Nombre</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Descripción</label>
          <textarea
            className="w-full border rounded-md px-3 py-2"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm">Precio (S/)</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Estado</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm">Categoría</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              <option value="">Sin categoría</option>
              {initialData.referencias.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={destacado} onChange={(e) => setDestacado(e.target.checked)} />
          Destacado
        </label>

        <button className="bg-black text-white rounded-md px-4 py-2">Guardar</button>
      </form>

      {/* IMÁGENES */}
      <div className="border rounded-xl p-4 space-y-4">
        <h2 className="text-lg font-semibold">Imágenes</h2>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subirImagen(f);
              e.currentTarget.value = "";
            }}
          />
          {subiendo && <span className="text-sm opacity-80">Subiendo...</span>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {imagenes
            .slice()
            .sort((a, b) => Number(b.esPortada) - Number(a.esPortada) || a.orden - b.orden)
            .map((img) => (
              <div key={img.id} className="border rounded-lg overflow-hidden">
                <div className="aspect-square bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="imagen" className="w-full h-full object-cover" />
                </div>
                <div className="p-2 flex items-center justify-between text-sm">
                  <button className="underline" type="button" onClick={() => ponerPortada(img.id)}>
                    {img.esPortada ? "Portada" : "Hacer portada"}
                  </button>
                  <button className="underline" type="button" onClick={() => eliminarImagen(img.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
        </div>

        {imagenes.length === 0 && (
          <p className="text-sm opacity-80">Aún no hay imágenes. Sube una portada.</p>
        )}
      </div>

      {/* CREAR VARIANTES */}
      <div className="border rounded-xl p-4 space-y-4">
        <h2 className="text-lg font-semibold">Crear variantes (talla × color)</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Tallas</p>
            <div className="flex flex-wrap gap-2">
              {initialData.referencias.tallas.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTallasSel((s) => toggle(s, t.id))}
                  className={`px-3 py-1 rounded-full border text-sm ${
                    tallasSel.includes(t.id) ? "bg-black text-white" : ""
                  }`}
                >
                  {t.nombre}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Colores</p>
            <div className="flex flex-wrap gap-2">
              {initialData.referencias.colores.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setColoresSel((s) => toggle(s, c.id))}
                  className={`px-3 py-1 rounded-full border text-sm ${
                    coloresSel.includes(c.id) ? "bg-black text-white" : ""
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm opacity-80">
          Combinaciones a crear: <b>{combinaciones}</b> (las repetidas se omiten)
        </p>

        <button
          type="button"
          onClick={crearVariantes}
          className="bg-black text-white rounded-md px-4 py-2"
          disabled={combinaciones === 0}
        >
          Crear combinaciones
        </button>
      </div>

      {/* TABLA VARIANTES */}
      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Variantes</h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left p-3">Talla</th>
              <th className="text-left p-3">Color</th>
              <th className="text-left p-3">Stock</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">Ajuste</th>
              <th className="text-left p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {variantes.map((v) => (
              <FilaVariante key={v.id} v={v} onAjustar={ajustarStock} onCambiarActiva={cambiarActiva} />
            ))}
            {variantes.length === 0 && (
              <tr>
                <td className="p-3" colSpan={6}>
                  Aún no hay variantes. Crea combinaciones arriba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilaVariante({
  v,
  onAjustar,
  onCambiarActiva,
}: {
  v: {
    id: string;
    talla: string;
    color: string;
    stockActual: number;
    activa: boolean;
  };
  onAjustar: (id: string, cambioCantidad: number, nota?: string) => Promise<void>;
  onCambiarActiva: (id: string, activa: boolean) => Promise<void>;
}) {
  const [cambio, setCambio] = useState("0");
  const [nota, setNota] = useState("");

  return (
    <tr className="border-t">
      <td className="p-3">{v.talla}</td>
      <td className="p-3">{v.color}</td>
      <td className="p-3">{v.stockActual}</td>
      <td className="p-3">{v.activa ? "Activa" : "Inactiva"}</td>
      <td className="p-3">
        <div className="flex gap-2 items-center">
          <input
            className="w-20 border rounded-md px-2 py-1"
            value={cambio}
            onChange={(e) => setCambio(e.target.value)}
            title="Usa + para sumar, - para restar"
          />
          <input
            className="w-40 border rounded-md px-2 py-1"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="nota (opcional)"
          />
          <button type="button" className="underline" onClick={() => onAjustar(v.id, Number(cambio), nota)}>
            Aplicar
          </button>
        </div>
      </td>
      <td className="p-3">
        <button type="button" className="underline" onClick={() => onCambiarActiva(v.id, !v.activa)}>
          {v.activa ? "Desactivar" : "Activar"}
        </button>
      </td>
    </tr>
  );
}
