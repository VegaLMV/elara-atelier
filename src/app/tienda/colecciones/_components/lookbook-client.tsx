"use client";

import { useState } from "react";
import LookbookItem from "./lookbook-item";
import ShopTheLookDrawer, { Producto } from "./shop-the-look-drawer";

interface LookSection {
    id: string;
    title: string;
    subtitle?: string;
    description?: string | null;
    imageUrl?: string | null;
    products: Producto[];
}

interface Props {
    sections: LookSection[];
}

export default function LookbookClient({ sections }: Props) {
    const [selectedLook, setSelectedLook] = useState<LookSection | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleOpenLook = (section: LookSection) => {
        setSelectedLook(section);
        setIsDrawerOpen(true);
    };

    return (
        <main className="bg-[#fcfaf8] min-h-screen pb-20">
            {/* Header de la Página */}
            <div className="pt-32 pb-24 px-6 text-center space-y-6">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#864d2d]">
                    Élara Atelier
                </span>
                <h1 className="text-5xl md:text-7xl font-serif text-[#3f2f2f] italic tracking-tight">
                    Lookbook
                </h1>
                <p className="text-[#3f2f2f]/60 font-light max-w-lg mx-auto text-xs md:text-sm leading-relaxed uppercase tracking-widest px-4">
                    Explora nuestras curadurías exclusivas y adquiere el estilo completo del atelier en un solo paso.
                </p>
            </div>

            {/* Listado de Looks con Layouts Alternativos */}
            <div className="space-y-24 md:space-y-40 max-w-[1600px] mx-auto">
                {sections.map((section, idx) => (
                    <LookbookItem
                        key={section.id}
                        index={idx}
                        title={section.title}
                        subtitle={section.subtitle}
                        description={section.description}
                        imageUrl={section.imageUrl}
                        products={section.products}
                        onOpenDrawer={() => handleOpenLook(section)}
                    />
                ))}
            </div>

            {/* Drawer Interactivo */}
            <ShopTheLookDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                lookTitle={selectedLook?.title || ""}
                productos={selectedLook?.products || []}
            />
        </main>
    );
}