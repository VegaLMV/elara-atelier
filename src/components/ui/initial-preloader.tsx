"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// Imágenes de alta costura para el preloader.
const IMAGES = [
    "https://jxyjpeylvhwxtqqefdjk.supabase.co/storage/v1/object/public/productos/Extras/Preloader1.avif", // Moda/Tela
    "https://jxyjpeylvhwxtqqefdjk.supabase.co/storage/v1/object/public/productos/Extras/Preloader2.avif", // Detalle costura/taller
];

export default function InitialPreloader() {
    // Siempre inicia en TRUE para que el servidor lo envíe tapando la pantalla.
    // El script en línea (abajo) lo ocultará al instante si ya se visitó.
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const hasSeenPreloader = sessionStorage.getItem("elara_preloader_seen");
        
        if (!hasSeenPreloader) {
            // Bloqueamos el scroll solo si la presentación va a correr
            document.body.style.overflow = "hidden";
            
            const timer = setTimeout(() => {
                setIsLoading(false);
                sessionStorage.setItem("elara_preloader_seen", "true");
                setTimeout(() => { document.body.style.overflow = "auto"; }, 1500);
            }, 5500); 
            
            return () => {
                clearTimeout(timer);
                document.body.style.overflow = "auto";
            }
        } else {
            // Si ya lo vio, lo desmontamos de React inmediatamente
            setIsLoading(false);
            document.body.style.overflow = "auto";
        }
    }, []);

    return (
        <>
            {/* EL TRUCO MAGICO (Con suppressHydrationWarning para evitar errores de React): 
                Este script se ejecuta antes de que React cargue.
                Si detecta que ya viste el preloader, le inyecta un 'display: none' invisible. */}
            <script
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                    __html: `
                        if(sessionStorage.getItem("elara_preloader_seen")) {
                            document.documentElement.style.setProperty('--preloader-display', 'none');
                        }
                    `
                }}
            />

            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        key="preloader"
                        // Aquí usamos la variable CSS que el script modifica mágicamente
                        style={{ display: 'var(--preloader-display, flex)' }}
                        exit={{ y: "-100%", transition: { duration: 1.5, ease: [0.76, 0, 0.24, 1] } }}
                        className="fixed inset-0 z-[99999] bg-[#e6dad1] flex items-center justify-center overflow-hidden"
                    >
                        {/* ==========================================
                            CAPA 1: ELEMENTOS DE FONDO (TEXTOS Y GEOMETRÍA)
                        ========================================== */}
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 0.03, scale: 1 }}
                            transition={{ duration: 4, ease: "easeOut" }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
                        >
                            <h1 className="text-[18vw] md:text-[12vw] font-serif uppercase tracking-widest text-[#3f2f2f] whitespace-nowrap">
                                Atelier
                            </h1>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, rotate: 0 }}
                            animate={{ opacity: 0.08, rotate: 90 }}
                            transition={{ duration: 6, ease: "linear" }}
                            className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] md:w-[30vw] md:h-[30vw] rounded-full border-[1px] border-[#3f2f2f] z-0"
                        />

                        <motion.div
                            initial={{ opacity: 0, rotate: 45 }}
                            animate={{ opacity: 0.05, rotate: -45 }}
                            transition={{ duration: 6, ease: "linear" }}
                            className="absolute -bottom-[15%] -right-[15%] w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] rounded-full border-[1px] border-[#864d2d] z-0"
                        />

                        {/* ==========================================
                            CAPA 2: COMPOSICIÓN FOTOGRÁFICA (SCROLL FALSO)
                        ========================================== */}
                        
                        {/* Imagen 1: Arriba Izquierda (Visible en celular, más pequeña y asomando) */}
                        <motion.div 
                            initial={{ opacity: 0, y: 100, rotate: -2 }}
                            animate={{ opacity: 0.45, y: -20, rotate: -5 }}
                            transition={{ duration: 5.5, ease: "easeOut", delay: 0.2 }}
                            className="absolute top-[5%] -left-[5%] sm:top-[8%] sm:left-[8%] md:left-[18%] 
                                       w-32 h-44 sm:w-44 sm:h-60 md:w-64 md:h-[22rem] 
                                       shadow-2xl overflow-hidden z-10 block"
                        >
                            <div className="absolute inset-1 border border-white/20 z-10 pointer-events-none"></div>
                            <Image src={IMAGES[0]} alt="Élara Mood" fill className="object-cover grayscale hover:grayscale-0 transition-all duration-1000" priority />
                        </motion.div>

                        {/* Imagen 2: Abajo Derecha (Visible en celular, asomando por la esquina) */}
                        <motion.div 
                            initial={{ opacity: 0, y: -60, rotate: 2 }}
                            animate={{ opacity: 0.35, y: 40, rotate: 4 }}
                            transition={{ duration: 5.5, ease: "easeOut", delay: 0.4 }}
                            className="absolute bottom-[5%] -right-[5%] sm:bottom-[8%] sm:right-[8%] md:right-[18%] 
                                       w-28 h-36 sm:w-36 sm:h-52 md:w-56 md:h-[20rem] 
                                       shadow-2xl overflow-hidden z-10 block"
                        >
                            <div className="absolute inset-1 border border-white/20 z-10 pointer-events-none"></div>
                            <Image src={IMAGES[1]} alt="Élara Atelier" fill className="object-cover grayscale hover:grayscale-0 transition-all duration-1000" priority />
                        </motion.div>

                        {/* ==========================================
                            CAPA 3: ELEMENTO PRINCIPAL (LOGO Y TEXTO)
                        ========================================== */}
                        
                        <div className="relative z-30 flex flex-col items-center p-8 md:p-12 bg-[#e6dad1]/30 backdrop-blur-md border border-white/10 shadow-2xl shadow-[#3f2f2f]/10 md:bg-transparent md:backdrop-blur-none md:border-none md:shadow-none rounded-3xl md:rounded-none mx-6 md:mx-0">
                            
                            {/* Logo Central */}
                            <div className="overflow-hidden mb-6 md:mb-8">
                                <motion.div
                                    initial={{ y: "100%", opacity: 0, scale: 0.8 }}
                                    animate={{ y: "0%", opacity: 1, scale: 1 }}
                                    transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1], delay: 0.5 }}
                                    className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-44 md:h-44 drop-shadow-xl"
                                >
                                    <Image
                                        src="https://jxyjpeylvhwxtqqefdjk.supabase.co/storage/v1/object/public/productos/logo/Logo.png"
                                        alt="Élara Atelier Logo"
                                        fill
                                        className="object-contain drop-shadow-md"
                                        priority
                                    />
                                </motion.div>
                            </div>

                            {/* Línea divisoria dorada */}
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: "120px", opacity: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut", delay: 1.2 }}
                                className="h-[1px] bg-gradient-to-r from-transparent via-[#864d2d]/50 to-transparent mb-6 md:mb-8 md:w-[180px]"
                            />

                            {/* Tipografía Elegante */}
                            <div className="overflow-hidden flex flex-col items-center gap-1 text-[1.75rem] sm:text-3xl md:text-[2.75rem] leading-none font-serif text-[#3f2f2f] tracking-[0.2em] uppercase drop-shadow-sm">
                                <motion.span
                                    initial={{ y: 40, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 1.2, ease: "easeOut", delay: 1.8 }}
                                >
                                    Élara
                                </motion.span>
                                <motion.span
                                    initial={{ y: 40, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 1.2, ease: "easeOut", delay: 2.1 }}
                                    className="font-light italic tracking-[0.1em]"
                                >
                                    Atelier
                                </motion.span>
                            </div>

                            {/* Subtítulos Inferiores */}
                            <div className="flex flex-col items-center mt-8 md:mt-10 gap-3">
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 1, delay: 2.8 }}
                                    className="text-[8px] md:text-[10px] font-black text-[#864d2d]/80 uppercase tracking-[0.6em]"
                                >
                                    Alta Costura
                                </motion.p>
                                
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 1.5, delay: 3.2 }}
                                    className="px-4 py-1.5 md:px-5 border border-[#3f2f2f]/20 rounded-full bg-[#3f2f2f]/[0.02]"
                                >
                                    <span className="text-[7px] md:text-[9px] font-bold text-[#3f2f2f]/60 uppercase tracking-widest">
                                        Est. 2026
                                    </span>
                                </motion.div>
                            </div>
                        </div>

                        {/* ==========================================
                            CAPA 4: TEXTURA DE RUIDO FINAL
                        ========================================== */}
                        <div 
                            className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-multiply z-40"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}