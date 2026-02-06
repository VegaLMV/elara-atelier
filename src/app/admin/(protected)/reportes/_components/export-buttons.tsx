"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ExportButtonsProps {
    title: string;
    headers: string[];
    data: (string | number)[][];
    filename: string;
}

export function ExportButtons({ title, headers, data, filename }: ExportButtonsProps) {

    const exportPDF = () => {
        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(title, 14, 22);

        // Fecha de generación
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Generado: ${new Date().toLocaleString("es-PE")}`, 14, 30);

        // Tabla
        autoTable(doc, {
            head: [headers],
            body: data,
            startY: 38,
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [30, 41, 59], // slate-800
                textColor: 255,
                fontStyle: "bold",
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252], // slate-50
            },
        });

        doc.save(`${filename}.pdf`);
    };

    const exportExcel = () => {
        const wsData = [headers, ...data];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Ajustar ancho de columnas
        const colWidths = headers.map((h, i) => {
            const maxLen = Math.max(
                h.length,
                ...data.map(row => String(row[i] || "").length)
            );
            return { wch: Math.min(maxLen + 2, 40) };
        });
        ws["!cols"] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte");
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors border border-red-100"
            >
                <FileText className="w-4 h-4" />
                PDF
            </button>
            <button
                onClick={exportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
            >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
            </button>
        </div>
    );
}
