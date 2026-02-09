"use client";

import { Printer, Edit } from "lucide-react";
import Link from "next/link";

export function PurchaseActions({ compraId }: { compraId: string }) {
    return (
        <div className="flex gap-2">
            <Link
                href={`/admin/compras/${compraId}/editar`}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
            >
                <Edit className="w-4 h-4" /> Editar
            </Link>
            <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-white border border-gray-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
            >
                <Printer className="w-4 h-4" /> Imprimir
            </button>
        </div>
    );
}
