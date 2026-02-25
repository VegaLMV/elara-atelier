import { Suspense } from "react";
import PedidosClient from "./pedidos-client";

export const dynamic = "force-dynamic";
export const metadata = {
    title: "Gestión de Pedidos | Admin",
    description: "Gestión de pedidos de WhatsApp antes de convertirlos en ventas."
};

export default function PedidosPage() {
    return (
        <Suspense fallback={null}>
            <PedidosClient />
        </Suspense>
    );
}
