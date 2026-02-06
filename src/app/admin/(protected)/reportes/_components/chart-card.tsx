"use client";

import { ReactNode } from "react";

interface ChartCardProps {
    title: ReactNode;
    description?: string;
    children: ReactNode;
    className?: string;
}

export function ChartCard({ title, description, children, className = "" }: ChartCardProps) {
    return (
        <div className={`bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden ${className}`}>
            <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">{title}</h3>
                {description && (
                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                )}
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}
