"use client";

import { Edit, FileDown } from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Definimos la estructura de datos que necesita el PDF
export type CompraPDFData = {
    id: string;
    fecha: string;
    proveedor: string;
    ruc: string | null;
    razonSocial: string | null;
    telefono: string | null;
    direccion: string | null;
    distrito: string | null;
    provincia: string | null;
    items: {
        nombre: string;
        cantidad: number;
        costoUnitario: number;
        total: number;
    }[];
    subtotal: number;
    envio: number;
    otros: number;
    total: number;
};

export function PurchaseActions({ compraId, pdfData }: { compraId: string; pdfData: CompraPDFData }) {

    const generarPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // 1. Cabecera (Logo / Branding) - Estilo Slate-900
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("ÉLARA ATELIER", 14, 24);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("ORDEN DE COMPRA / INGRESO DE MERCADERÍA", 14, 32);

        // 2. Información General
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.setFont("helvetica", "bold");
        doc.text(`ID DE REGISTRO:`, 14, 55);
        doc.setFont("helvetica", "normal");
        doc.text(`${pdfData.id}`, 48, 55);

        doc.setFont("helvetica", "bold");
        doc.text(`FECHA EMISIÓN:`, 14, 61);
        doc.setFont("helvetica", "normal");
        doc.text(`${pdfData.fecha}`, 48, 61);

        // 3. Datos del Proveedor
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("DATOS DEL PROVEEDOR", 110, 55);

        doc.setFontSize(10);
        doc.text(`${pdfData.proveedor}`, 110, 62);
        doc.setFont("helvetica", "normal");
        if (pdfData.ruc) doc.text(`RUC: ${pdfData.ruc}`, 110, 67);
        if (pdfData.razonSocial) doc.text(`Razón Social: ${pdfData.razonSocial}`, 110, 72);
        if (pdfData.telefono) doc.text(`Tel: ${pdfData.telefono}`, 110, 77);

        if (pdfData.direccion) {
            const dirStr = `${pdfData.direccion}${pdfData.distrito ? `, ${pdfData.distrito}` : ""}${pdfData.provincia ? ` - ${pdfData.provincia}` : ""}`;
            doc.setFontSize(8);
            doc.text(dirStr, 110, 82, { maxWidth: 85 });
        }

        // 4. Tabla de Ítems
        const tableBody = pdfData.items.map(it => [
            it.nombre,
            it.cantidad.toString(),
            `S/ ${it.costoUnitario.toFixed(2)}`,
            `S/ ${it.total.toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: 90,
            head: [['Descripción del Ítem', 'Cantidad', 'Costo Unit.', 'Total']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 }
        });

        // @ts-ignore
        const finalY = (doc as any).lastAutoTable.finalY || 90;

        // 5. Resumen Financiero
        const startX = 135;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);

        doc.text(`Subtotal:`, startX, finalY + 15);
        doc.text(`S/ ${pdfData.subtotal.toFixed(2)}`, 195, finalY + 15, { align: 'right' });

        if (pdfData.envio > 0) {
            doc.text(`Envío:`, startX, finalY + 21);
            doc.text(`S/ ${pdfData.envio.toFixed(2)}`, 195, finalY + 21, { align: 'right' });
        }

        if (pdfData.otros > 0) {
            doc.text(`Otros Costos:`, startX, finalY + 27);
            doc.text(`S/ ${pdfData.otros.toFixed(2)}`, 195, finalY + 27, { align: 'right' });
        }

        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(startX, finalY + 31, 195, finalY + 31);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`TOTAL PAGADO:`, startX, finalY + 38);
        doc.text(`S/ ${pdfData.total.toFixed(2)}`, 195, finalY + 38, { align: 'right' });

        // 6. Descargar
        doc.save(`OC_${pdfData.id}.pdf`);
    };

    return (
        <div className="flex gap-2">
            <Link
                href={`/admin/compras/${compraId}/editar`}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
            >
                <Edit className="w-4 h-4" /> Editar
            </Link>
            <button
                onClick={generarPDF}
                className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-sm"
            >
                <FileDown className="w-4 h-4" /> Exportar PDF
            </button>
        </div>
    );
}