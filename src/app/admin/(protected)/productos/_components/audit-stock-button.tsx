"use client";

import { useState } from "react";
import { ClipboardList, FileText, Loader2, ChevronDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AuditStockButtonProps {
    currentCategoryId?: string;
    currentCategoryName?: string;
}

export function AuditStockButton({ currentCategoryId, currentCategoryName }: AuditStockButtonProps) {
    const [loading, setLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const generateAuditPDF = async (allCategories: boolean) => {
        setLoading(true);
        setShowMenu(false);
        try {
            const params = new URLSearchParams();
            if (!allCategories && currentCategoryId) {
                params.set("categoriaId", currentCategoryId);
            }

            const res = await fetch(`/api/admin/productos/audit-stock?${params.toString()}`);
            if (!res.ok) throw new Error("Error al obtener datos");

            const groupedData = await res.json();

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Header
            doc.setFillColor(30, 41, 59); // slate-800
            doc.rect(0, 0, pageWidth, 35, 'F');

            doc.setTextColor(255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("ÉLARA ATELIER", 15, 18);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("HOJA DE AUDITORÍA DE INVENTARIO", 15, 25);

            doc.setFontSize(8);
            const dateStr = new Date().toLocaleString("es-PE");
            doc.text(`Generado: ${dateStr}`, pageWidth - 15, 25, { align: "right" });

            if (!allCategories && currentCategoryName) {
                doc.text(`Categoría: ${currentCategoryName}`, 15, 30);
            } else {
                doc.text(`Reporte: Todas las Categorías`, 15, 30);
            }

            let currentY = 45;

            Object.entries(groupedData).forEach(([categoryName, products]: [string, any], index) => {
                if (index > 0) {
                    const finalY = (doc as any).lastAutoTable?.finalY || currentY;
                    currentY = finalY > 240 ? (doc.addPage(), 20) : finalY + 15;
                }

                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(30, 41, 59);
                doc.text(categoryName.toUpperCase(), 15, currentY);
                currentY += 5;

                const tableData: any[] = [];
                products.forEach((prod: any) => {
                    prod.variantes.forEach((v: any) => {
                        tableData.push([
                            v.id.slice(-8).toUpperCase(),
                            prod.nombre,
                            `${v.talla} / ${v.color}`,
                            v.stockActual,
                            "[       ]" // Physical Stock column
                        ]);
                    });
                });

                autoTable(doc, {
                    head: [["ID/SKU", "PRODUCTO", "VARIANTE", "STOCK VIRTUAL", "STOCK FÍSICO"]],
                    body: tableData,
                    startY: currentY,
                    theme: 'grid',
                    styles: { fontSize: 8, cellPadding: 3 },
                    headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
                    columnStyles: {
                        0: { cellWidth: 25 },
                        3: { cellWidth: 30, halign: 'center' },
                        4: { cellWidth: 35, halign: 'center' }
                    },
                    margin: { left: 15, right: 15 }
                });

                currentY = (doc as any).lastAutoTable.finalY;
            });

            const fileName = allCategories
                ? `Auditoria_Inventario_Completo_${new Date().toISOString().split('T')[0]}.pdf`
                : `Auditoria_${currentCategoryName?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

            doc.save(fileName);
        } catch (error) {
            console.error(error);
            alert("Error al generar el PDF");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative inline-block text-left">
            <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <button
                    onClick={() => generateAuditPDF(false)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 border-r border-gray-100 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4 text-slate-500" />}
                    <span>Auditoría {currentCategoryName ? `(${currentCategoryName})` : ""}</span>
                </button>
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="px-2 hover:bg-slate-50 transition-colors"
                    title="Opciones de Auditoría"
                >
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-gray-200 shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="py-1">
                            {currentCategoryId && (
                                <button
                                    onClick={() => generateAuditPDF(false)}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-left text-gray-700 hover:bg-slate-50 font-medium border-b border-gray-50"
                                >
                                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                                    Solo {currentCategoryName}
                                </button>
                            )}
                            <button
                                onClick={() => generateAuditPDF(true)}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-left text-gray-700 hover:bg-slate-50 font-bold"
                            >
                                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                Todas las Categorías
                            </button>
                        </div>
                        <div className="bg-slate-50 px-4 py-2 text-[9px] text-gray-400 font-medium">
                            Genera una hoja de conteo físico para auditar el almacén.
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
