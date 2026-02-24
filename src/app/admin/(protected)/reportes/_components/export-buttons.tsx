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
    variant?: "full" | "compact";
    showExcel?: boolean;
}

export function ExportButtons({
    title,
    headers,
    data,
    filename,
    metadata,
    tables,
    variant = "full",
    showExcel = true
}: ExportButtonsProps) {

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

        const listToExport: TableData[] = tables || (headers && data ? [{ headers, data }] : []);

        listToExport.forEach((table, index) => {
            if (index > 0) {
                const finalY = (doc as any).lastAutoTable?.finalY || currentY;
                currentY = finalY > 200 ? (doc.addPage(), 20) : finalY + 15;
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
                    if (h.toLowerCase().includes("imagen")) acc[i] = { cellWidth: 22 };
                    return acc;
                }, {} as any),

                didParseCell: (cellData) => {
                    const header = table.headers[cellData.column.index]?.toLowerCase() || "";
                    if (cellData.section === 'body') {
                        // Limpiar texto de URL para que no salga escrito en el PDF
                        if (header.includes("imagen")) {
                            cellData.cell.text = [""];
                            cellData.cell.styles.minCellHeight = 20;
                        }
                        // Limpiar color para mostrar solo el nombre
                        if (header.includes("color") && typeof cellData.cell.raw === 'string' && cellData.cell.raw.includes('|')) {
                            const [_, name] = cellData.cell.raw.split('|');
                            cellData.cell.text = [name];
                            cellData.cell.styles.cellPadding = { left: 10, top: 3, right: 3, bottom: 3 };
                        }
                    }
                },

                didDrawCell: (cellData: any) => {
                    const header = table.headers[cellData.column.index]?.toLowerCase() || "";
                    const rawValue = cellData.cell.raw;

                    // A. DIBUJAR IMAGEN
                    if (cellData.section === 'body' && header.includes("imagen") && typeof rawValue === 'string' && rawValue.startsWith('http')) {
                        try {
                            doc.addImage(rawValue, 'JPEG', cellData.cell.x + 2, cellData.cell.y + 2, 16, 16);
                        } catch (e) { }
                    }

                    // B. DIBUJAR CÍRCULO (Soporte Bicolor real para jsPDF)
                    if (cellData.section === 'body' && header.includes("color") && typeof rawValue === 'string' && rawValue.includes('|')) {
                        const [hexRaw] = rawValue.split('|');
                        const colors = hexRaw.split(',').map(c => c.trim()).filter(Boolean);

                        const cx = cellData.cell.x + 5; // Ajustado un poco más a la derecha
                        const cy = cellData.cell.y + (cellData.cell.height / 2);
                        const r = 3; // Radio ligeramente más grande para legibilidad
                        const k = 0.5522847498; // Constante para círculos perfectos con Bezier

                        try {
                            doc.saveGraphicsState();
                            doc.setLineWidth(0.05); // Línea de división ultra fina
                            doc.setDrawColor(220); // Gris muy suave para el borde

                            if (colors.length >= 2) {
                                // MITAD IZQUIERDA (Color 1)
                                doc.setFillColor(colors[0]);
                                doc.moveTo(cx, cy - r);
                                doc.curveTo(cx - k * r, cy - r, cx - k * r, cy + r, cx, cy + r);
                                doc.lineTo(cx, cy - r);
                                doc.fill();

                                // MITAD DERECHA (Color 2)
                                doc.setFillColor(colors[1]);
                                doc.moveTo(cx, cy - r);
                                doc.curveTo(cx + k * r, cy - r, cx + k * r, cy + r, cx, cy + r);
                                doc.lineTo(cx, cy - r);
                                doc.fill();

                                // BORDE CIRCULAR EXTERIOR
                                doc.setDrawColor(200);
                                doc.circle(cx, cy, r, 'S');
                            } else {
                                // Círculo Sólido elegante
                                doc.setFillColor(colors[0] || "#e2e8f0");
                                doc.circle(cx, cy, r, "FD");
                            }
                            doc.restoreGraphicsState();
                        } catch (e) {
                            console.error("Error al dibujar color luxury", e);
                        }
                    }
                }
            });
            currentY = (doc as any).lastAutoTable.finalY;
        });

        if (metadata?.note) {
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(100);
            doc.text("Observaciones:", 14, Math.min(finalY, doc.internal.pageSize.getHeight() - 20));
            doc.text(metadata.note, 14, Math.min(finalY + 5, doc.internal.pageSize.getHeight() - 15), { maxWidth: pageWidth - 28 });
        }

        doc.save(`${filename}.pdf`);
    };

    const exportExcel = () => {
        const wb = XLSX.utils.book_new();
        const summaryData = [
            ["ELARA ATELIER - REPORTE"],
            ["Título", title],
            ["Fecha", new Date().toLocaleString("es-PE")],
            [""]
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Resumen");

        const listToExport: TableData[] = tables || (headers && data ? [{ headers, data }] : []);
        listToExport.forEach((table, i) => {
            const cleanedData = table.data.map(row => row.map(cleanCellData));
            const ws = XLSX.utils.aoa_to_sheet([table.headers, ...cleanedData]);
            XLSX.utils.book_append_sheet(wb, ws, table.title || `Datos ${i + 1}`);
        });

        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    if (variant === "compact") {
        return (
            <div className="flex gap-1">
                <button
                    onClick={exportPDF}
                    title="Exportar a PDF"
                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-colors"
                >
                    <FileText className="w-4 h-4" />
                </button>
                {showExcel && (
                    <button
                        onClick={exportExcel}
                        title="Exportar a Excel"
                        className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-100 transition-colors"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 border border-red-100 transition-colors"
            >
                <FileText className="w-4 h-4" /> Exportar a PDF
            </button>
            {showExcel && (
                <button
                    onClick={exportExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 border border-emerald-100 transition-colors"
                >
                    <FileSpreadsheet className="w-4 h-4" /> Excel
                </button>
            )}
        </div>
    );
}