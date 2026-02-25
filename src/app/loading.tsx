"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] bg-[#fcfaf8] flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
                {/* Isotipo con Pulso Suave */}
                <motion.div
                    initial={{ opacity: 1, scale: 4}}
                    animate={{
                        opacity: [0.7, 1, 0.7],
                        scale: [0.98, 1, 0.98]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative w-20 h-20"
                >
                    <Image
                        src="https://jxyjpeylvhwxtqqefdjk.supabase.co/storage/v1/object/public/productos/logo/Logo.png"
                        alt="Élara Atelier Logo"
                        fill
                        className="object-contain grayscale"
                        priority
                    />
                </motion.div>

                {/* Anillo de Carga Minimalista */}
                <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="48"
                        stroke="#e6dad1"
                        strokeWidth="0.5"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </svg>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="mt-8 flex flex-col items-center gap-2"
            >
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#3f2f2f]/40">
                    Élara Atelier
                </span>
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                            className="w-1 h-1 rounded-full bg-[#864d2d]/30"
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
