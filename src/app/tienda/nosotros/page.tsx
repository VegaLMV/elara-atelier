"use client";

import Image from "next/image";
import { Gem, Hourglass, Fingerprint } from "lucide-react";
import { motion } from "framer-motion";
import { ReactNode } from "react";

function FadeInView({ 
    children, 
    direction = "up", 
    delay = 0 
}: { 
    children: ReactNode, 
    direction?: "up" | "down" | "left" | "right", 
    delay?: number 
}) {
    const directions = {
        up: { y: 40, x: 0 },
        down: { y: -40, x: 0 },
        left: { x: 40, y: 0 },
        right: { x: -40, y: 0 },
    };

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction] }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay }}
        >
            {children}
        </motion.div>
    );
}

export default function NosotrosPage() {
    return (
        <div className="bg-[#fcfaf8] min-h-screen overflow-hidden">
            
            {/* 1. HERO EDITORIAL: Título y Manifiesto Visual */}
            <section className="pt-32 pb-16 md:pt-48 md:pb-24 px-6 max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Texto Izquierda: Entra desde la izquierda */}
                    <div className="lg:col-span-5 space-y-8">
                        <FadeInView direction="right">
                            <span className="block text-xs font-black uppercase tracking-[0.4em] text-[#864d2d]">
                                El Atelier
                            </span>
                        </FadeInView>
                        
                        <FadeInView direction="right" delay={0.2}>
                            <h1 className="text-5xl md:text-7xl xl:text-8xl font-serif text-[#3f2f2f] leading-[0.9] tracking-tight">
                                Curaduría <br />
                                <span className="italic ml-4 md:ml-8">Consciente.</span>
                            </h1>
                        </FadeInView>
                        
                        <FadeInView direction="right" delay={0.4}>
                            <div className="h-px w-24 bg-[#e6dad1]" />
                        </FadeInView>
                        
                        <FadeInView direction="right" delay={0.5}>
                            <p className="text-lg text-[#3f2f2f]/70 font-light leading-relaxed max-w-md">
                                Élara Atelier no es solo una boutique; es un diálogo entre la elegancia atemporal y la identidad contemporánea.
                            </p>
                        </FadeInView>
                    </div>
                    
                    {/* Imagen Derecha: Entra desde la derecha lentamente */}
                    <div className="lg:col-span-7 relative aspect-[4/5] md:aspect-[3/4] bg-[#f0ebe6] rounded-sm overflow-hidden">
                        <FadeInView direction="left" delay={0.3}>
                            <Image
                                src="https://jxyjpeylvhwxtqqefdjk.supabase.co/storage/v1/object/public/productos/Extras/story-principal.avif" 
                                alt="Élara Atelier Mood"
                                fill
                                className="object-cover transition-transform duration-[10s] hover:scale-105"
                                priority
                            />
                        </FadeInView>
                    </div>
                </div>
            </section>

            {/* 2. NARRATIVA EN CAPAS: La Historia */}
            <section className="py-24 md:py-40 px-6 overflow-hidden">
                <div className="max-w-[1200px] mx-auto relative">
                    
                    {/* Elemento decorativo de fondo */}
                    <div className="absolute top-0 right-0 w-2/3 h-full bg-[#e6dad1]/20 -z-10 rounded-l-[100px]" />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        
                        {/* Columna de Imágenes Superpuestas (Layering) */}
                        <div className="relative h-[60vh] lg:h-[80vh]">
                            {/* Imagen Base: Sube desde abajo */}
                            <FadeInView direction="up">
                                <div className="absolute inset-0 bg-[#f0ebe6] rounded-sm overflow-hidden h-[60vh] lg:h-[80vh]">
                                     <Image
                                        src="https://jxyjpeylvhwxtqqefdjk.supabase.co/storage/v1/object/public/productos/Extras/story.avif" 
                                        alt="Lifestyle Élara"
                                        fill
                                        className="object-cover grayscale-[30%]"
                                    />
                                </div>
                            </FadeInView>
                            
                            {/* Imagen Superpuesta: Entra más tarde desde la izquierda */}
                            <FadeInView direction="left" delay={0.5}>
                                <div className="absolute -bottom-12 -right-6 md:-right-12 w-48 h-48 md:w-64 md:h-64 bg-white p-2 shadow-2xl rounded-sm overflow-hidden z-10">
                                    <div className="relative w-full h-full bg-[#f0ebe6]">                                         
                                        <Image
                                            src="https://jxyjpeylvhwxtqqefdjk.supabase.co/storage/v1/object/public/productos/logo/elara-atelier-logoo.svg" 
                                            alt="Detalle de calidad"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </div>
                            </FadeInView>
                        </div>

                        {/* Columna de Texto: Entra desde la derecha */}
                        <div className="space-y-8 lg:pl-12 pt-16 lg:pt-0">
                            <FadeInView direction="left">
                                <h2 className="text-4xl md:text-5xl font-serif text-[#3f2f2f]">
                                    Más que moda, <br/><span className="italic text-[#864d2d]">una filosofía de selección.</span>
                                </h2>
                            </FadeInView>
                            
                            <div className="space-y-6 text-[#3f2f2f]/70 font-light leading-loose">
                                <FadeInView direction="left" delay={0.2}>
                                    <p>
                                        En un mundo saturado de tendencias efímeras, ÉLARA surge como una pausa necesaria. No buscamos llenar armarios, sino elevarlos con piezas que cuentan una historia.
                                    </p>
                                </FadeInView>
                                
                                <FadeInView direction="left" delay={0.3}>
                                    <p>
                                        Nuestra inspiración fusiona la pureza del minimalismo oriental con la sastrería clásica europea. Cada prenda en nuestra colección ha pasado por un riguroso filtro donde la calidad del material y la precisión del corte son innegociables.
                                    </p>
                                </FadeInView>
                                
                                <FadeInView direction="left" delay={0.4}>
                                    <p className="text-lg font-serif italic text-[#3f2f2f] pt-4 border-l-2 border-[#864d2d] pl-6">
                                        "No vendemos ropa. Ofrecemos las herramientas para que construyas tu lenguaje visual más auténtico."
                                    </p>
                                </FadeInView>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 3. LOS PILARES DE LA MARCA (Animados en cascada) */}
            <section className="py-24 px-6 bg-white border-y border-[#e6dad1]/50">
                <div className="max-w-[1200px] mx-auto">
                    <FadeInView direction="up">
                        <div className="text-center mb-16">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#864d2d]">Nuestros Principios</span>
                        </div>
                    </FadeInView>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center">
                        
                        {/* Pilar 1 */}
                        <FadeInView direction="up" delay={0.1}>
                            <div className="space-y-6 flex flex-col items-center group">
                                <div className="w-16 h-16 rounded-full bg-[#fcfaf8] border border-[#e6dad1] flex items-center justify-center text-[#864d2d] group-hover:bg-[#864d2d] group-hover:text-white transition-all duration-500 group-hover:scale-110">
                                    <Gem className="w-7 h-7 stroke-[1.5]" />
                                </div>
                                <h3 className="text-xl font-serif text-[#3f2f2f]">Curaduría Excelsa</h3>
                                <p className="text-sm text-[#3f2f2f]/60 leading-relaxed max-w-xs">
                                    Selección rigurosa de materiales nobles y cortes que favorecen la silueta, rechazando lo superfluo.
                                </p>
                            </div>
                        </FadeInView>

                        {/* Pilar 2 */}
                        <FadeInView direction="up" delay={0.3}>
                            <div className="space-y-6 flex flex-col items-center group">
                                 <div className="w-16 h-16 rounded-full bg-[#fcfaf8] border border-[#e6dad1] flex items-center justify-center text-[#864d2d] group-hover:bg-[#864d2d] group-hover:text-white transition-all duration-500 group-hover:scale-110">
                                    <Hourglass className="w-7 h-7 stroke-[1.5]" />
                                </div>
                                <h3 className="text-xl font-serif text-[#3f2f2f]">Atemporalidad</h3>
                                <p className="text-sm text-[#3f2f2f]/60 leading-relaxed max-w-xs">
                                    Diseños que trascienden las temporadas. Inversiones inteligentes que perduran en tu colección.
                                </p>
                            </div>
                        </FadeInView>

                        {/* Pilar 3 */}
                        <FadeInView direction="up" delay={0.5}>
                            <div className="space-y-6 flex flex-col items-center group">
                                 <div className="w-16 h-16 rounded-full bg-[#fcfaf8] border border-[#e6dad1] flex items-center justify-center text-[#864d2d] group-hover:bg-[#864d2d] group-hover:text-white transition-all duration-500 group-hover:scale-110">
                                    <Fingerprint className="w-7 h-7 stroke-[1.5]" />
                                </div>
                                <h3 className="text-xl font-serif text-[#3f2f2f]">Identidad Propia</h3>
                                <p className="text-sm text-[#3f2f2f]/60 leading-relaxed max-w-xs">
                                    Modo que no disfraza, sino que potencia la autenticidad y la presencia de quien la lleva.
                                </p>
                            </div>
                        </FadeInView>

                    </div>
                </div>
            </section>

            {/* 4. CIERRE EDITORIAL */}
            <section className="py-32 md:py-48 text-center px-6 relative">
                <div className="max-w-2xl mx-auto flex flex-col items-center space-y-10">
                    <FadeInView direction="up">
                        <h2 className="text-3xl md:text-4xl font-serif text-[#3f2f2f] leading-tight">
                            Bienvenida al nuevo estándar de <br/><span className="italic text-[#864d2d]">elegancia consciente</span>.
                        </h2>
                    </FadeInView>
                    
                    <FadeInView direction="up" delay={0.3}>
                        <div className="w-px h-24 bg-[#e6dad1]" />
                    </FadeInView>
                    
                    <FadeInView direction="up" delay={0.5}>
                        <span className="text-[12px] font-black uppercase tracking-[0.5em] text-[#3f2f2f]/40">
                            Élara Atelier
                        </span>
                    </FadeInView>
                </div>
            </section>

        </div>
    );
}