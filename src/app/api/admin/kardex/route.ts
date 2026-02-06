// Placeholder - Las consultas de kardex se realizan directamente desde el servidor
export const dynamic = "force-dynamic";

export async function GET() {
    return new Response(JSON.stringify({ message: "Use server-side rendering for kardex" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
