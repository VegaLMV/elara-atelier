"use client";

import { Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper de moneda
const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

export default function PrintButton({ venta }: { venta: any }) {

    const generarDocumento = () => {
        const doc = new jsPDF();
        
        const colorPrimario = [63, 47, 47] as [number, number, number];
        
        // ==========================================
        // 1. CABECERA Y LOGO
        // ==========================================
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.text("ÉLARA ATELIER", 15, 25);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text("RUC: 10464748491", 15, 32);
        doc.text("Dirección: Ica, Perú", 15, 37);
        doc.text("WhatsApp: +51 999 999 999", 15, 42);

        // Cuadro de Boleta (Hecho más ancho para soportar el código largo)
        doc.setDrawColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(110, 15, 85, 28, 3, 3);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.text("BOLETA DE VENTA", 152.5, 24, { align: "center" });
        doc.text("ELECTRÓNICA", 152.5, 30, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(200, 0, 0);
        doc.text(`N° ${venta.codigo.toUpperCase()}`, 152.5, 38, { align: "center" });

        // ==========================================
        // 2. DATOS DEL CLIENTE (Posiciones estrictas)
        // ==========================================
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.5);
        doc.line(15, 50, 195, 50);

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        
        const fecha = new Date(venta.fechaVenta).toLocaleDateString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit'
        });

        // --- FILA 1 ---
        doc.setFont("helvetica", "bold");
        doc.text("Cliente:", 15, 58);
        doc.setFont("helvetica", "normal");
        // Cortamos el nombre si es muy largo para que no choque con la fecha
        const nombreCliente = venta.cliente?.nombre || venta.clienteNombre || "Público General";
        doc.text(nombreCliente.substring(0, 35), 35, 58); 
        
        doc.setFont("helvetica", "bold");
        doc.text("Fecha:", 120, 58);
        doc.setFont("helvetica", "normal");
        doc.text(fecha, 145, 58);

        // --- FILA 2 ---
        const yFila2 = 65;
        if (venta.cliente?.dni) {
            doc.setFont("helvetica", "bold");
            doc.text("DNI / RUC:", 15, yFila2);
            doc.setFont("helvetica", "normal");
            doc.text(venta.cliente.dni, 35, yFila2);
        }

        doc.setFont("helvetica", "bold");
        doc.text("Método Pago:", 120, yFila2);
        doc.setFont("helvetica", "normal");
        doc.text(venta.metodoPago, 145, yFila2);

        doc.line(15, 72, 195, 72);

        // ==========================================
        // 3. TABLA DE PRODUCTOS
        // ==========================================
        const tableBody: any[] = [];

        venta.items.forEach((item: any) => {
            tableBody.push([
                item.cantidad.toString(),
                `${item.variante.producto.nombre}\n(Talla: ${item.variante.talla.nombre} | Color: ${item.variante.color.nombre})`,
                formatMoney(Number(item.precioFinal)),
                formatMoney(Number(item.subtotal))
            ]);
        });

        venta.empaques?.forEach((emp: any) => {
            tableBody.push([
                emp.cantidad.toString(),
                `Empaque: ${emp.tipoEmpaque.nombre}`,
                formatMoney(Number(emp.costoTotal) / emp.cantidad),
                formatMoney(Number(emp.costoTotal))
            ]);
        });

        autoTable(doc, {
            startY: 77,
            head: [['CANT.', 'DESCRIPCIÓN', 'P. UNITARIO', 'TOTAL']],
            body: tableBody,
            theme: 'plain',
            headStyles: { 
                fillColor: [245, 245, 245], 
                textColor: [0, 0, 0], 
                fontStyle: 'bold',
                halign: 'center',
                lineColor: [200, 200, 200],
                lineWidth: 0.1
            },
            bodyStyles: {
                lineColor: [230, 230, 230],
                lineWidth: { bottom: 0.1 }
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 20 }, 
                1: { cellWidth: 100 }, 
                2: { halign: 'right', cellWidth: 35 }, 
                3: { halign: 'right', cellWidth: 30 } 
            },
            styles: { fontSize: 9, cellPadding: 5 }
        });

        // @ts-ignore (Obtenemos la posición donde terminó la tabla automáticamente)
        let finalY = doc.lastAutoTable.finalY + 10;

        if (finalY > 240) {
            doc.addPage();
            finalY = 20;
        }

        // ==========================================
        // 4. TOTALES
        // ==========================================
        const subtotalReal = Number(venta.total) + Number(venta.descuentoTotal);
        
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        
        const xEtiqueta = 145;
        const xValor = 195;

        doc.setFont("helvetica", "normal");
        doc.text("SUBTOTAL:", xEtiqueta, finalY);
        doc.text(formatMoney(subtotalReal), xValor, finalY, { align: "right" });
        finalY += 7;

        if (Number(venta.descuentoTotal) > 0) {
            doc.setTextColor(220, 38, 38);
            doc.text("DESCUENTO:", xEtiqueta, finalY);
            doc.text(`- ${formatMoney(Number(venta.descuentoTotal))}`, xValor, finalY, { align: "right" });
            finalY += 7;
        }

        doc.setDrawColor(200, 200, 200);
        doc.line(135, finalY - 3, 195, finalY - 3);
        finalY += 4;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        
        doc.text("TOTAL A PAGAR:", 120, finalY); 
        doc.text(formatMoney(Number(venta.total)), xValor, finalY, { align: "right" });

        // ==========================================
        // 5. PIE DE PÁGINA
        // ==========================================
        finalY += 25;
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150, 150, 150);
        
        if (venta.notas) {
            doc.text(`Notas: ${venta.notas}`, 105, finalY, { align: "center" });
            finalY += 7;
        }

        doc.text("¡Gracias por confiar en Élara Atelier!", 105, finalY, { align: "center" });
        finalY += 5;
        doc.setFontSize(8);
        doc.text("Representación impresa de la Boleta de Venta Electrónica.", 105, finalY, { align: "center" });

        return doc;
    };

    const descargarPDF = () => {
        const doc = generarDocumento();
        doc.save(`Boleta_Elara_${venta.codigo.toUpperCase()}.pdf`);
    };

    const imprimirPDF = () => {
        const doc = generarDocumento();
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
    };

    return (
        <div className="flex gap-2">
            <button
                type="button"
                onClick={descargarPDF}
                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
            >
                <Download className="w-4 h-4" /> Generar PDF
            </button>
            <button
                type="button"
                onClick={imprimirPDF}
                className="flex items-center gap-2 bg-white text-slate-900 border border-slate-200 px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
                <Printer className="w-4 h-4" /> Imprimir
            </button>
        </div>
    );
}