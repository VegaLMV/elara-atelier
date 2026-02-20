export type ParsedWhatsAppOrder = {
    producto: string;
    talla: string | null;
    color: string | null;
    precio: number | null;
};

/**
 * Utility to parse the specific WhatsApp template used in Elara Atelier:
 * 👗 Producto: [Nombre] 📏 Talla: [Talla] 🎨 Color: [Color] 💰 Precio: S/ [Precio]
 */
export function parseWhatsAppMessage(message: string): ParsedWhatsAppOrder | null {
    if (!message) return null;

    // Filter out corrupted emojis and multiple spaces
    const cleanMsg = message.replace(/[\uFFFD\uD800-\uDBFF\uDC00-\uDFFF]+/g, " ").replace(/\s+/g, " ");

    // Extract using individual regex for robustness - allowing optional emojis and bold markdown (*)
    // We capture everything until we hit another field marker or the end of a block
    const productoMatch = cleanMsg.match(/(?:Producto:\*?\s*)([^*📏🎨💰\n]+)/i);
    const tallaMatch = cleanMsg.match(/(?:Talla:\*?\s*)([^*👗🎨💰\n]+)/i);
    const colorMatch = cleanMsg.match(/(?:Color:\*?\s*)([^*👗📏💰\n]+)/i);
    const precioMatch = cleanMsg.match(/(?:Precio:\*?\s*)(?:S\/)?\s*([\d.,]+)/i);

    if (!productoMatch) return null;

    // Helper to clean captured values from leading/trailing non-essential characters
    const clean = (val: string | null) => {
        if (!val) return null;
        return val.trim().replace(/^[*:\s]+|[*:\s]+$/g, "");
    };

    return {
        producto: clean(productoMatch[1])!,
        talla: clean(tallaMatch ? tallaMatch[1] : null),
        color: clean(colorMatch ? colorMatch[1] : null),
        precio: precioMatch ? parseFloat(precioMatch[1].replace(',', '.')) : null,
    };
}
