"use client";

import { useState } from "react";
import { Image as ImageIcon, Loader2, Trash2 } from "lucide-react";

interface UploaderImageProps {
    url: string | null;
    onUpload: (url: string | null) => void;
    label?: string;
}

export function UploaderImage({
    url,
    onUpload,
    label = "Imagen",
}: UploaderImageProps) {
    const [uploading, setUploading] = useState(false);

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);

            const res = await fetch("/api/admin/hero-banners/upload", {
                method: "POST",
                body: fd,
            });
            const data = await res.json();
            if (data.url) onUpload(data.url);
        } catch (err) {
            console.error("Upload error", err);
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {uploading ? (
                        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                    ) : url ? (
                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                </div>

                <div className="flex-1 space-y-2">
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium"
                        placeholder="https://... o sube una imagen"
                        value={url || ""}
                        onChange={(e) => onUpload(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <label className="cursor-pointer bg-white border border-slate-200 hover:border-slate-400 text-[10px] font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-2">
                            {uploading ? "Subiendo..." : "Subir Imagen"}
                            <input type="file" className="hidden" accept="image/*" onChange={handleFile} disabled={uploading} />
                        </label>
                        {url && (
                            <button
                                type="button"
                                onClick={() => onUpload(null)}
                                className="text-[10px] font-bold text-red-500 hover:text-red-600 px-3 py-2"
                            >
                                <Trash2 className="w-3 h-3 inline mr-1" /> Quitar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
