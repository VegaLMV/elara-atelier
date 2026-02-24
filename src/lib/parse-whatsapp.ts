export type ParsedWhatsAppOrder = {
    producto: string;
    talla: string | null;
    color: string | null;
    precio: number | null;
    cantidad: number | null;
};

/**
 * Utility to parse the specific WhatsApp template used in Elara Atelier:
 * 👗 Producto: [Nombre] 📏 Talla: [Talla] 🎨 Color: [Color] 💰 Precio: S/ [Precio] 🔢 Cantidad: [Cant]
 */
export function parseWhatsAppMessage(message: string): ParsedWhatsAppOrder[] {
    if (!message) return [];

    // Filter out corrupted emojis and multiple spaces
    const cleanMsg = message.replace(/[\uFFFD\uD800-\uDBFF\uDC00-\uDFFF]+/g, " ").replace(/\s+/g, " ");

    // Split message into blocks starting with "Producto:"
    const blocks = cleanMsg.split(/(?=Producto:)/i).filter(b => b.toLowerCase().includes("producto:"));
    const results: ParsedWhatsAppOrder[] = [];

    const clean = (val: string | null) => {
        if (!val) return null;
        return val.trim().replace(/^[*:\s]+|[*:\s]+$/g, "");
    };

    for (const block of blocks) {
        const productoMatch = block.match(/(?:Producto:\*?\s*)([^*📏🎨💰🔢🖼️\n]+)/i);
        const tallaMatch = block.match(/(?:Talla:\*?\s*)([^*👗🎨💰🔢🖼️\n]+)/i);
        const colorMatch = block.match(/(?:Color:\*?\s*)([^*👗📏💰🔢🖼️\n]+)/i);
        const precioMatch = block.match(/(?:Precio:\*?\s*)(?:S\/)?\s*([\d.,]+)/i);
        const cantidadMatch = block.match(/(?:Cantidad:\*?\s*)([\d]+)/i);

        if (productoMatch) {
            results.push({
                producto: clean(productoMatch[1])!,
                talla: clean(tallaMatch ? tallaMatch[1] : null),
                color: clean(colorMatch ? colorMatch[1] : null),
                precio: precioMatch ? parseFloat(precioMatch[1].replace(',', '.')) : null,
                cantidad: cantidadMatch ? parseInt(cantidadMatch[1]) : 1,
            });
        }
    }

    return results;
}
