"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface TableData {
    title?: string;
    headers: string[];
    data: (string | number)[][];
}

interface ExportButtonsProps {
    title: string;
    headers?: string[];
    data?: (string | number)[][];
    filename: string;
    metadata?: {
        note?: string;
        filters?: Record<string, string>;
    };
    tables?: TableData[];
}

export function ExportButtons({ title, headers, data, filename, metadata, tables }: ExportButtonsProps) {

    // Helper para limpiar datos de colores en Excel e interfaz
    const cleanCellData = (cell: string | number) => {
        if (typeof cell === 'string' && cell.startsWith('#') && cell.includes('|')) {
            return cell.split('|')[1];
        }
        return cell;
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // 1. Branding / Logo
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 40, "F");
        doc.setTextColor(255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("ELARA ATELIER", 14, 25);
        doc.setFontSize(10);
        doc.text("REPORTE ADMINISTRATIVO", 14, 32);

        // 2. Título y Fecha
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(18);
        doc.text(title, 14, 55);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Generado: ${new Date().toLocaleString("es-PE")}`, 14, 62);

        // 3. Metadatos / Filtros
        let currentY = 70;
        if (metadata?.filters) {
            doc.setTextColor(50);
            doc.setFont("helvetica", "bold");
            doc.text("Filtros Aplicados:", 14, currentY);
            currentY += 5;
            doc.setFont("helvetica", "normal");
            Object.entries(metadata.filters).forEach(([key, value]) => {
                if (value) {
                    doc.text(`• ${key}: ${value}`, 14, currentY);
                    currentY += 5;
                }
            });
            currentY += 10;
        }

        // Determinar qué tablas exportar
        const listToExport: TableData[] = tables || (headers && data ? [{ headers, data }] : []);

        // 4. Procesar Tablas
        listToExport.forEach((table, index) => {
            if (index > 0) {
                const finalY = (doc as any).lastAutoTable?.finalY || currentY;
                if (finalY > 200) {
                    doc.addPage();
                    currentY = 20;
                } else {
                    currentY = finalY + 15;
                }
            }

            if (table.title) {
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(30, 41, 59);
                doc.text(table.title, 14, currentY);
                currentY += 5;
            }

            autoTable(doc, {
                head: [table.headers],
                body: table.data as any[][],
                startY: currentY,
                styles: { fontSize: 8, cellPadding: 3, valign: "middle" },
                headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { top: 40 },
                columnStyles: table.headers.reduce((acc, h, i) => {
                    if (h.toLowerCase().includes("imagen")) acc[i] = { cellWidth: 20 };
                    return acc;
                }, {} as any),
                didDrawCell: (cellData: any) => {
                    const header = table.headers[cellData.column.index]?.toLowerCase() || "";

                    // Imágenes
                    if (cellData.section === 'body' && typeof cellData.cell.raw === 'string' &&
                        (cellData.cell.raw.startsWith('http') || cellData.cell.raw.startsWith('https'))) {
                        if (header.includes("imagen")) {
                            cellData.cell.text = [""];
                            try {
                                doc.addImage(cellData.cell.raw, 'JPEG', cellData.cell.x + 2, cellData.cell.y + 2, 16, 16);
                            } catch (e) { }
                        }
                    }

                    // Colores
                    if (cellData.section === 'body' && header.includes("color") && typeof cellData.cell.raw === 'string' && cellData.cell.raw.includes('|')) {
                        const [hexRaw] = cellData.cell.raw.split('|');
                        const firstHex = hexRaw.split(',')[0].trim();
                        try {
                            doc.saveGraphicsState();
                            doc.setFillColor(firstHex);
                            doc.setDrawColor(180);
                            doc.setLineWidth(0.1);
                            doc.circle(cellData.cell.x + 4, cellData.cell.y + (cellData.cell.height / 2), 2.5, "FD");
                            doc.restoreGraphicsState();
                        } catch (e) { }
                    }
                },
                didParseCell: (cellData: any) => {
                    const header = table.headers[cellData.column.index]?.toLowerCase() || "";
                    if (cellData.section === 'body') {
                        if (header.includes("imagen")) cellData.cell.styles.minCellHeight = 20;
                        if (header.includes("color") && typeof cellData.cell.raw === 'string' && cellData.cell.raw.includes('|')) {
                            const [_, name] = cellData.cell.raw.split('|');
                            cellData.cell.text = [name];
                            cellData.cell.styles.cellPadding = { left: 10, top: 3, right: 3, bottom: 3 };
                        }
                    }
                }
            });
            currentY = (doc as any).lastAutoTable.finalY;
        });

        // 5. Nota final
        if (metadata?.note) {
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(100);
            const pHeight = doc.internal.pageSize.getHeight();
            doc.text("Observaciones:", 14, Math.min(finalY, pHeight - 20));
            doc.text(metadata.note, 14, Math.min(finalY + 5, pHeight - 15), { maxWidth: pageWidth - 28 });
        }

        doc.save(`${filename}.pdf`);
    };

    const exportExcel = () => {
        const wb = XLSX.utils.book_new();

        // Hoja 1: Resumen
        const summaryData = [
            ["ELARA ATELIER - REPORTE"],
            ["Título", title],
            ["Fecha", new Date().toLocaleString("es-PE")],
            [""],
            ["FILTROS APLICADOS"]
        ];
        if (metadata?.filters) {
            Object.entries(metadata.filters).forEach(([key, value]) => {
                if (value) summaryData.push([key, value]);
            });
        }
        if (metadata?.note) {
            summaryData.push([""], ["OBSERVACIONES"], [metadata.note]);
        }
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Resumen");

        // Hoja(s) de Datos
        const listToExport: TableData[] = tables || (headers && data ? [{ headers, data }] : []);

        listToExport.forEach((table, i) => {
            const cleanedData = table.data.map(row => row.map(cleanCellData));
            const wsData = [table.headers, ...cleanedData];
            const ws = XLSX.utils.aoa_to_sheet(wsData as any[][]);

            ws["!cols"] = table.headers.map((h, idx) => ({
                wch: Math.min(Math.max(h.length, ...cleanedData.map(row => String(row[idx] || "").length)) + 4, 50)
            }));

            XLSX.utils.book_append_sheet(wb, ws, table.title || (i === 0 ? "Datos" : `Datos ${i + 1}`));
        });

        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    return (
        <div className="flex gap-2">
            <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors border border-red-100">
                <FileText className="w-4 h-4" /> PDF
            </button>
            <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100">
                <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
        </div>
    );
}
