"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";


interface PaginationProps {
    totalPages: number;
}

export default function Pagination({ totalPages }: PaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentPage = Number(searchParams.get("page")) || 1;

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    // Lógica simple de paginación si no hay lib externa
    const pages = generatePaginationSimple(currentPage, totalPages);

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            {/* Prev Button */}
            <PaginationArrow
                direction="left"
                href={createPageURL(currentPage - 1)}
                isDisabled={currentPage <= 1}
            />

            <div className="flex -space-x-px">
                {pages.map((page, index) => {
                    return (
                        <PaginationNumber
                            key={index}
                            href={createPageURL(page)}
                            page={page}
                            isActive={currentPage === page}
                        />
                    );
                })}
            </div>

            {/* Next Button */}
            <PaginationArrow
                direction="right"
                href={createPageURL(currentPage + 1)}
                isDisabled={currentPage >= totalPages}
            />
        </div>
    );
}

function PaginationNumber({
    page,
    href,
    isActive,
    position,
}: {
    page: number | string;
    href: string;
    position?: "first" | "last" | "middle" | "single";
    isActive: boolean;
}) {
    const className = `
    flex h-9 w-9 items-center justify-center text-sm border border-gray-200
    ${position === "first" || position === "single" ? "rounded-l-lg" : ""}
    ${position === "last" || position === "single" ? "rounded-r-lg" : ""}
    ${isActive
            ? "z-10 bg-slate-900 text-white border-slate-900 font-bold shadow-md transform scale-105"
            : "text-gray-500 hover:bg-gray-50 bg-white"
        }
    ${!isActive && position !== "middle" ? "" : ""}
  `;

    return isActive || page === "..." ? (
        <div className={`${className} ${page === "..." ? "border-none bg-transparent" : "rounded-lg mx-1"}`}>{page}</div>
    ) : (
        <Link href={href} className={`${className} rounded-lg mx-1 transition-all`}>
            {page}
        </Link>
    );
}

function PaginationArrow({
    href,
    direction,
    isDisabled,
}: {
    href: string;
    direction: "left" | "right";
    isDisabled?: boolean;
}) {
    const className = `
    flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100
    ${isDisabled ? "pointer-events-none opacity-50" : ""}
  `;

    const icon =
        direction === "left" ? (
            <ChevronLeft className="w-4 h-4" />
        ) : (
            <ChevronRight className="w-4 h-4" />
        );

    return isDisabled ? (
        <div className={className}>{icon}</div>
    ) : (
        <Link className={className} href={href}>
            {icon}
        </Link>
    );
}

function generatePaginationSimple(currentPage: number, totalPages: number) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
        return [1, 2, 3, "...", totalPages - 1, totalPages];
    }

    if (currentPage >= totalPages - 2) {
        return [1, 2, "...", totalPages - 2, totalPages - 1, totalPages];
    }

    return [
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages,
    ];
}
