"use client";

import { useState } from "react";
import LookbookItem from "./lookbook-item";
import ShopTheLookDrawer, { Producto } from "./shop-the-look-drawer";
import ScrollReveal from "@/components/ui/scroll-reveal"; // Importamos ScrollReveal

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
            {/* Header de la Página con Animación en Cascada */}
            <div className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 text-center space-y-4 sm:space-y-6">
                <ScrollReveal direction="up" delay={0.1}>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.5em] text-[#864d2d] block">
                        Élara Atelier
                    </span>
                </ScrollReveal>
                
                <ScrollReveal direction="up" delay={0.2}>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif text-[#3f2f2f] italic tracking-tight">
                        Lookbook
                    </h1>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={0.3}>
                    <p className="text-[#3f2f2f]/70 md:text-[#3f2f2f]/60 font-light max-w-lg mx-auto text-xs md:text-sm leading-relaxed uppercase tracking-widest px-2 sm:px-4">
                        Explora nuestras curadurías exclusivas y adquiere el estilo completo del atelier en un solo paso.
                    </p>
                </ScrollReveal>
            </div>

            {/* Listado de Looks con Animación de Revelado Individual */}
            <div className="space-y-16 md:space-y-32 lg:space-y-40 max-w-[1600px] mx-auto">
                {sections.map((section, idx) => (
                    <ScrollReveal key={section.id} direction="up" delay={0.1}>
                        <LookbookItem
                            index={idx}
                            title={section.title}
                            subtitle={section.subtitle}
                            description={section.description}
                            imageUrl={section.imageUrl}
                            products={section.products}
                            onOpenDrawer={() => handleOpenLook(section)}
                        />
                    </ScrollReveal>
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