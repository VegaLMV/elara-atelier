"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] bg-[#fdfbf9] flex flex-col items-center justify-center">
            {/* Contenedor Principal - AGRANDADO */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                
                {/* Isotipo con Pulso Suave - AGRANDADO Y MÁS CLARO */}
                <motion.div
                    initial={{ opacity: 0.9, scale: 0.95 }}
                    animate={{
                        opacity: [0.9, 1, 0.9],
                        scale: [0.95, 1.02, 0.95]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative w-32 h-32 md:w-44 md:h-44 z-10"
                >
                    <Image
                        src="https://jxyjpeylvhwxtqqefdjk.supabase.co/storage/v1/object/public/productos/logo/Logo.png"
                        alt="Élara Atelier Logo"
                        fill
                        className="object-contain opacity-100"
                        priority
                        sizes="(max-width: 768px) 8rem, 11rem"
                    />
                </motion.div>

                {/* Anillo de Carga Minimalista */}
                <motion.svg 
                    className="absolute w-full h-full text-[#864d2d]/60" 
                    viewBox="0 0 100 100"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="48"
                        stroke="currentColor"
                        strokeWidth="0.8" 
                        fill="none"
                        strokeDasharray="160"
                        initial={{ strokeDashoffset: 160 }}
                        animate={{ strokeDashoffset: [160, 0, -160] }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </motion.svg>
            </div>

            {/* Textos de Carga - MÁS CLAROS Y VISIBLES */}
            <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="mt-10 flex flex-col items-center gap-3"
            >
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.6em] text-[#3f2f2f]/80">
                    Cargando
                </span>
                <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.3
                            }}
                            className="w-1.5 h-1.5 rounded-full bg-[#864d2d]/70"
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}