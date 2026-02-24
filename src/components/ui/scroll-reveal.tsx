"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

type ScrollRevealProps = {
    children: ReactNode;
    className?: string;
    delay?: number; // Delay in seconds
    direction?: "up" | "down" | "left" | "right" | "none";
};

export default function ScrollReveal({
    children,
    className = "",
    delay = 0,
    direction = "up"
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.1, // Trigger when 10% of the element is visible
                rootMargin: "0px 0px -50px 0px" // Slightly offset trigger point
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    // Definir clases iniciales basadas en la dirección para evitar interpolación de strings insegura
    const getInitialStyles = () => {
        if (isVisible) return "opacity-100 translate-y-0 translate-x-0 scale-100";

        switch (direction) {
            case "up":
                return "opacity-0 translate-y-12";
            case "down":
                return "opacity-0 -translate-y-12";
            case "left":
                return "opacity-0 translate-x-12";
            case "right":
                return "opacity-0 -translate-x-12";
            case "none":
                return "opacity-0 scale-95";
            default:
                return "opacity-0 translate-y-12";
        }
    };

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 ease-out transform ${getInitialStyles()} ${className}`}
            style={{ transitionDelay: `${delay}s` }}
        >
            {children}
        </div>
    );
}
