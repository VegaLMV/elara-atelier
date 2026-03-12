"use client";

import { useState } from "react";
import { X, Package, User, MapPin, Tag, Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatMoney } from "@/lib/precios";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    pedidos: any[];
}

export default function PrintOrdersModal({ isOpen, onClose, pedidos }: Props) {
    const [view, setView] = useState<"PICKING" | "LABELS">("PICKING");
    const [generating, setGenerating] = useState(false);

    if (!isOpen) return null;

    const generatePDF = async () => {
        setGenerating(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const today = new Date().toLocaleString("es-PE");

            if (view === "PICKING") {
                // --- DESIGN MATCHING EXPORT-BUTTONS.TSX ---

                // 1. Branding / Logo
                doc.setFillColor(15, 23, 42);
                doc.rect(0, 0, pageWidth, 40, "F");
                doc.setTextColor(255);
                doc.setFontSize(24);
                doc.setFont("helvetica", "bold");
                doc.text("ELARA ATELIER", 14, 25);
                doc.setFontSize(10);
                doc.text("LISTA DE ALISTAMIENTO (PICKING)", 14, 32);

                // 2. Info Context
                doc.setTextColor(30, 41, 59);
                doc.setFontSize(10);
                doc.text(`Fecha de Impresión: ${today}`, 14, 50);
                doc.text(`Total de Pedidos: ${pedidos.length}`, 14, 55);

                const consolidatedItems = pedidos.reduce((acc: any, ped: any) => {
                    ped.items.forEach((it: any) => {
                        const key = it.varianteId;
                        if (!acc[key]) {
                            acc[key] = {
                                producto: it.variante.producto.nombre,
                                variante: it.variante.producto.nombre, 
                                detalle: `${it.variante.color.nombre} / ${it.variante.talla.nombre}`,
                                colorHex: it.variante.color?.hex || '#ffffffff',
                                imagen: it.variante.producto.imagenes?.[0]?.url,
                                cantidad: 0
                            };
                        }
                        acc[key].cantidad += it.cantidad;
                    });
                    return acc;
                }, {});

                const bodyData = Object.values(consolidatedItems).map((it: any) => [
                    it.imagen || '',
                    it.producto,
                    (it.colorHex || '#000000') + '|' + it.detalle,
                    it.cantidad
                ]);

                autoTable(doc, {
                    startY: 60,
                    head: [['Imagen', 'Producto', 'Variante', 'Cant.']],
                    body: bodyData,
                    theme: 'grid',
                    styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
                    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [248, 250, 252] },
                    columnStyles: {
                        0: { cellWidth: 20 },
                        3: { halign: 'center', fontStyle: 'bold' }
                    },
                    didDrawCell: (data) => {
                        // Draw Image
                        if (data.column.index === 0 && data.cell.section === 'body' && typeof data.cell.raw === 'string' && data.cell.raw.startsWith('http')) {
                            try {
                                doc.addImage(data.cell.raw, 'JPEG', data.cell.x + 2, data.cell.y + 2, 16, 16);
                            } catch (e) { }
                        }
                        // Draw Color Circle
                        if (data.column.index === 2 && data.cell.section === 'body' && typeof data.cell.raw === 'string' && data.cell.raw.includes('|')) {
                            const [hex, text] = data.cell.raw.split('|');
                            const size = 3;
                            const cx = data.cell.x + 4;
                            const cy = data.cell.y + (data.cell.height / 2);

                            if (hex && hex.startsWith('#')) {
                                doc.setFillColor(hex);
                                doc.setDrawColor(200);
                                doc.circle(cx, cy, size, 'FD');
                            }
                        }
                    },
                    didParseCell: (data) => {
                        if (data.column.index === 0 && data.section === 'body') {
                            data.cell.text = [''];
                            data.cell.styles.minCellHeight = 20;
                        }
                        if (data.column.index === 2 && data.section === 'body' && typeof data.cell.raw === 'string') {
                            const parts = data.cell.raw.split('|');
                            if (parts.length > 1) {
                                data.cell.text = [parts[1]];
                                data.cell.styles.cellPadding = { top: 3, bottom: 3, left: 10, right: 3 };
                            }
                        }
                    }
                });

                doc.save(`alistamiento-${new Date().toISOString().split('T')[0]}.pdf`);

            } else {
                const cardsPerPage = 8;
                const cardWidth = 95;
                const cardHeight = 65;
                const marginX = 10;
                const marginY = 15;
                const gapX = 5;
                const gapY = 5;

                pedidos.forEach((ped, index) => {
                    const i = index % cardsPerPage;
                    if (index > 0 && i === 0) doc.addPage();

                    const col = i % 2;
                    const row = Math.floor(i / 2);

                    const x = marginX + (col * (cardWidth + gapX));
                    const y = marginY + (row * (cardHeight + gapY));

                    // Border
                    doc.setDrawColor(200);
                    doc.setLineWidth(0.1);
                    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "S");

                    // Header
                    doc.setFontSize(7);
                    doc.setTextColor(150);
                    doc.text("ELARA ATELIER", x + cardWidth - 5, y + 6, { align: 'right' });

                    // Customer
                    doc.setFontSize(6);
                    doc.setTextColor(100);
                    doc.text("DESTINATARIO", x + 4, y + 8);

                    doc.setFontSize(10);
                    doc.setTextColor(0);
                    doc.setFont("helvetica", "bold");
                    const name = ped.clienteNombre || ped.cliente?.nombre || "Cliente";
                    doc.text(name.substring(0, 25), x + 4, y + 13);

                    doc.setFontSize(8);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(80);
                    doc.text(`DNI: ${ped.cliente?.dni || '--'} / Tel: ${ped.cliente?.telefono || '--'}`, x + 4, y + 17);

                    doc.setFontSize(6);
                    doc.setTextColor(100);
                    doc.text("DIRECCIÓN", x + 4, y + 24);

                    doc.setFontSize(8);
                    doc.setTextColor(0);
                    const address = ped.direccion || "";
                    const location = `${ped.distrito || ''}, ${ped.provincia || ''}`;
                    const splitAddr = doc.splitTextToSize(address, cardWidth - 8);
                    doc.text(splitAddr, x + 4, y + 28);
                    doc.text(location, x + 4, y + 28 + (splitAddr.length * 4));

                    if (ped.referencia) {
                        const refY = y + 28 + (splitAddr.length * 4) + 4;
                        doc.setFontSize(7);
                        doc.setTextColor(50, 150, 50);
                        doc.text(`Ref: ${ped.referencia.substring(0, 40)}`, x + 4, refY);
                    }

                    const contentY = y + 45;
                    doc.setDrawColor(240);
                    doc.line(x + 2, contentY, x + cardWidth - 2, contentY);

                    doc.setFontSize(6);
                    doc.setTextColor(100);
                    doc.text("CONTENIDO", x + 4, contentY + 3);

                    let itemY = contentY + 7;
                    ped.items.slice(0, 3).forEach((it: any) => {
                        doc.setFontSize(7);
                        doc.setTextColor(0);
                        doc.setFont("helvetica", "bold");
                        doc.text(`${it.cantidad}x ${it.variante.producto.nombre.substring(0, 20)}`, x + 4, itemY);

                        doc.setFont("helvetica", "normal");
                        doc.setTextColor(80);
                        doc.text(`(${it.variante.color.nombre} - ${it.variante.talla.nombre})`, x + 45, itemY);

                        itemY += 4;
                    });
                    if (ped.items.length > 3) {
                        doc.text(`... y ${ped.items.length - 3} más`, x + 4, itemY);
                    }
                });

                doc.save(`etiquetas-${new Date().toISOString().split('T')[0]}.pdf`);
            }

        } catch (e) {
            console.error(e);
            alert("Error al generar PDF");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* HEADER */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-black text-slate-900">Imprimir / Exportar</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100"><X /></button>
                </div>

                {/* CONTENT */}
                <div className="p-8 space-y-8 flex-1 overflow-y-auto">

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => setView("PICKING")}
                            className={`px-6 py-3 rounded-2xl text-sm font-bold border-2 transition-all ${view === 'PICKING'
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'
                                }`}
                        >
                            Lista de Alistamiento
                        </button>
                        <button
                            onClick={() => setView("LABELS")}
                            className={`px-6 py-3 rounded-2xl text-sm font-bold border-2 transition-all ${view === 'LABELS'
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'
                                }`}
                        >
                            Etiquetas de Envio
                        </button>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center space-y-2">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                            {view === 'PICKING' ? <Package className="w-8 h-8 text-slate-900" /> : <Tag className="w-8 h-8 text-slate-900" />}
                        </div>
                        <h4 className="text-lg font-black text-slate-900">
                            {view === 'PICKING' ? 'Lista de Picking Consolidada' : 'Etiquetas de Envío Individuales'}
                        </h4>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                            {view === 'PICKING'
                                ? 'Genera un PDF con la lista total de productos agrupadados por variante para facilitar la preparación en almacén.'
                                : 'Genera etiquetas rectangulares (3 por hoja aprox) listas para imprimir y pegar en los paquetes.'}
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={generatePDF}
                            disabled={generating}
                            className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generating ? (
                                <><Loader2 className="w-6 h-6 animate-spin" /> Generando PDF...</>
                            ) : (
                                <><Download className="w-6 h-6" /> Descargar PDF</>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
