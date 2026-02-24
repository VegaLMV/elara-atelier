import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
    productoId: string;
    varianteId: string;
    nombre: string;
    precio: number;
    cantidad: number;
    talla: string | null;
    color: string | null;
    imagen: string;
};

interface CartStore {
    items: CartItem[];
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    addItem: (item: CartItem) => void;
    removeItem: (varianteId: string) => void;
    updateQuantity: (varianteId: string, cantidad: number) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
            addItem: (newItem) => {
                const currentItems = get().items;
                const existingItem = currentItems.find(
                    (item) => item.varianteId === newItem.varianteId
                );

                if (existingItem) {
                    set({
                        items: currentItems.map((item) =>
                            item.varianteId === newItem.varianteId
                                ? { ...item, cantidad: item.cantidad + newItem.cantidad }
                                : item
                        ),
                    });
                } else {
                    set({ items: [...currentItems, newItem] });
                }
                set({ isOpen: true }); // Abrir el carrito al añadir un item
            },
            removeItem: (varianteId) =>
                set({
                    items: get().items.filter((item) => item.varianteId !== varianteId),
                }),
            updateQuantity: (varianteId, cantidad) => {
                if (cantidad <= 0) {
                    get().removeItem(varianteId);
                    return;
                }
                set({
                    items: get().items.map((item) =>
                        item.varianteId === varianteId ? { ...item, cantidad } : item
                    ),
                });
            },
            clearCart: () => set({ items: [] }),
            getTotal: () => {
                return get().items.reduce(
                    (total, item) => total + item.precio * item.cantidad,
                    0
                );
            },
            getItemCount: () => {
                return get().items.reduce((count, item) => count + item.cantidad, 0);
            },
        }),
        {
            name: 'elara-cart-storage',
        }
    )
);
