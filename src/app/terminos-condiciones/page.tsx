"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// export const metadata = {
//     title: "Términos y Condiciones | Élara Atelier",
//     description: "Términos y condiciones de uso y políticas de compra de Élara Atelier.",
// };

export default function TerminosPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#fcfaf8]">
            {/* Header / Navigation Spacer */}
            <div className="h-24 md:h-32" />

            <main className="max-w-4xl mx-auto px-6 py-16 bg-white shadow-sm border border-[#e6dad1]/30 rounded-2xl mb-24">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-serif text-[#3f2f2f] mb-4 tracking-tight">
                        Términos y Condiciones
                    </h1>
                    <p className="text-[#864d2d]/80 font-bold tracking-[0.2em] uppercase text-xs">
                        Última actualización: Febrero 2026
                    </p>
                    <div className="w-16 h-[1px] bg-[#864d2d]/30 mx-auto mt-6" />
                </div>

                <div className="space-y-12 text-[#3f2f2f]/80 leading-relaxed font-light">
                    {/* Section 1 */}
                    <section>
                        <h2 className="text-xl font-serif text-[#3f2f2f] mb-4 border-b border-[#e6dad1] pb-2">
                            1. INFORMACIÓN GENERAL
                        </h2>
                        <div className="space-y-2">
                            <p><span className="font-bold text-[#3f2f2f]">Nombre Comercial:</span> Élara Atelier</p>
                            <p><span className="font-bold text-[#3f2f2f]">Ubicación:</span> Ica, Perú</p>
                            <p><span className="font-bold text-[#3f2f2f]">Canal Oficial de Atención:</span> WhatsApp</p>
                            <p><span className="font-bold text-[#3f2f2f]">Normativa:</span> Estos términos se rigen por la legislación vigente en la República del Perú.</p>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-xl font-serif text-[#3f2f2f] mb-4 border-b border-[#e6dad1] pb-2">
                            2. DISPONIBILIDAD DE PRODUCTOS
                        </h2>
                        <p className="mb-4">Nuestra selección de prendas se ofrece sujeta a disponibilidad de inventario.</p>
                        <ul className="list-none pl-2 space-y-4">
                            <li className="relative pl-6">
                                <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#864d2d] rounded-full" />
                                <span className="font-bold text-[#3f2f2f]">Reposición de Inventario:</span> En caso de que el cliente adquiera un producto que se ha agotado temporalmente, Élara Atelier realizará las gestiones para reponer la pieza. El cliente acepta esperar el tiempo necesario para la importación o reposición del stock.
                            </li>
                            <li className="relative pl-6">
                                <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#864d2d] rounded-full" />
                                <span className="font-bold text-[#3f2f2f]">Opciones:</span> Si el cliente prefiere no esperar la reposición, podrá solicitar el cambio por otra prenda de nuestra colección disponible de igual valor.
                            </li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 className="text-xl font-serif text-[#3f2f2f] mb-4 border-b border-[#e6dad1] pb-2">
                            3. PRECIOS Y MÉTODOS DE PAGO
                        </h2>
                        <p className="mb-4">Los precios están expresados en Soles (S/). Nos reservamos el derecho de modificar precios sin previo aviso, respetando siempre el valor vigente al momento de confirmar una compra por WhatsApp.</p>
                        <p className="font-bold text-[#3f2f2f] mb-2">Medios de pago aceptados:</p>
                        <ul className="list-none pl-2 space-y-3">
                            <li className="relative pl-6">
                                <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#864d2d] rounded-full" />
                                <span className="font-medium text-[#3f2f2f]">Billeteras Digitales:</span> Yape y Plin.
                            </li>
                            <li className="relative pl-6">
                                <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#864d2d] rounded-full" />
                                <span className="font-medium text-[#3f2f2f]">Transferencia Bancaria.</span>
                            </li>
                            <li className="relative pl-6">
                                <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#864d2d] rounded-full" />
                                <span className="font-medium text-[#3f2f2f]">Efectivo (Contra Entrega):</span> Este método es exclusivo para entregas presenciales dentro de la ciudad de Ica. Para envíos a otras provincias o vía agencia, el pago debe ser 100% por adelantado.
                            </li>
                        </ul>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="text-xl font-serif text-[#3f2f2f] mb-4 border-b border-[#e6dad1] pb-2">
                            4. POLÍTICAS DE ENVÍO Y ENTREGAS
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-[#3f2f2f] mb-2">A. Cobertura y Plazos</h3>
                                <ul className="list-none pl-2 space-y-2">
                                    <li className="relative pl-6">
                                        <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#e6dad1] rounded-full" />
                                        <span className="font-medium text-[#3f2f2f]">Ica (Ciudad):</span> Entrega a domicilio en un plazo máximo de 4 días hábiles. Entrega en Plaza de Armas en un plazo máximo de 3 días hábiles.
                                    </li>
                                    <li className="relative pl-6">
                                        <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#e6dad1] rounded-full" />
                                        <span className="font-medium text-[#3f2f2f]">Nacional (Provincias):</span> Envíos a través de la agencia Shalom/Olva. El tiempo de llegada depende del transporte. Se facilitará el número de seguimiento (tracking).
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-[#3f2f2f] mb-2">B. Costos de Envío</h3>
                                <ul className="list-none pl-2 space-y-2">
                                    <li className="relative pl-6">
                                        <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#e6dad1] rounded-full" />
                                        <span className="font-medium text-[#3f2f2f]">Primera Compra:</span> El envío a nivel nacional es GRATIS (Promoción de bienvenida).
                                    </li>
                                    <li className="relative pl-6">
                                        <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#e6dad1] rounded-full" />
                                        <span className="font-medium text-[#3f2f2f]">Compras Recurrentes:</span> El envío tiene un costo adicional según destino, el cual será informado antes del pago.
                                    </li>
                                    <li className="relative pl-6">
                                        <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#e6dad1] rounded-full" />
                                        <span className="font-medium text-[#3f2f2f]">Punto de Encuentro:</span> La entrega en la Plaza de Armas de Ica es siempre GRATUITA.
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-[#3f2f2f] mb-2">C. Responsabilidad</h3>
                                <p>Élara Atelier se hace responsable de la integridad del paquete hasta su entrega al cliente (en Ica) o hasta su recepción en la agencia de transporte (envíos nacionales).</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <h2 className="text-xl font-serif text-[#3f2f2f] mb-4 border-b border-[#e6dad1] pb-2">
                            5. POLÍTICA DE CAMBIOS Y DEVOLUCIONES
                        </h2>
                        <p className="mb-4">Nuestro objetivo es tu satisfacción total. Si necesitas realizar un cambio, aplicarán las siguientes condiciones:</p>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-[#3f2f2f] mb-2">A. Plazos y Requisitos</h3>
                                <ul className="list-none pl-2 space-y-2">
                                    <li className="relative pl-6">
                                        <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#e6dad1] rounded-full" />
                                        El cliente tiene un plazo máximo de 3 días calendario desde la recepción de la prenda para solicitar un cambio.
                                    </li>
                                    <li className="relative pl-6">
                                        <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#e6dad1] rounded-full" />
                                        La prenda debe estar SIN USO, sin olores, sin manchas (maquillaje/desodorante), con sus etiquetas originales y en perfecto estado.
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-[#3f2f2f] mb-2">B. Valor del Cambio</h3>
                                <ul className="list-none pl-2 space-y-2">
                                    <li className="relative pl-6">
                                        <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#e6dad1] rounded-full" />
                                        Los cambios se realizarán por piezas que tengan el mismo valor monetario al que figuraba en la compra original.
                                    </li>
                                    <li className="relative pl-6">
                                        <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#e6dad1] rounded-full" />
                                        Si el cliente desea un producto de mayor valor, deberá abonar la diferencia.
                                    </li>
                                    <li className="relative pl-6">
                                        <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#e6dad1] rounded-full" />
                                        No se realizarán devoluciones de dinero en efectivo si el cliente elige una prenda de menor valor.
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-[#3f2f2f] mb-2">C. Costos Logísticos del Cambio</h3>
                                <ul className="list-none pl-2 space-y-2">
                                    <li className="relative pl-6">
                                        <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#e6dad1] rounded-full" />
                                        <span className="font-medium text-[#3f2f2f]">Por Falla de Fábrica:</span> Élara Atelier asume el costo total del retorno y nuevo envío.
                                    </li>
                                    <li className="relative pl-6">
                                        <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-[#e6dad1] rounded-full" />
                                        <span className="font-medium text-[#3f2f2f]">Por Gusto o Talla:</span> El cliente asume los costos de envío y retorno hacia Ica.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <h2 className="text-xl font-serif text-[#3f2f2f] mb-4 border-b border-[#e6dad1] pb-2">
                            6. PROPIEDAD INTELECTUAL
                        </h2>
                        <p>Todo el contenido de este sitio (imágenes, textos, logotipos) es propiedad exclusiva de Élara Atelier. Su uso comercial sin autorización está estrictamente prohibido.</p>
                    </section>

                    {/* Section 7 */}
                    <section>
                        <h2 className="text-xl font-serif text-[#3f2f2f] mb-4 border-b border-[#e6dad1] pb-2">
                            7. POLÍTICA DE PRIVACIDAD
                        </h2>
                        <p>Sus datos personales (Nombre, DNI, Dirección, Teléfono) son utilizados únicamente para procesar y entregar su pedido. No compartimos su información con terceros salvo con la empresa de mensajería (agencias o motorizados) para fines estrictamente logísticos.</p>
                    </section>

                    <footer className="pt-16 mt-8 border-t border-[#e6dad1] text-center flex flex-col items-center">
                        <p className="text-[#3f2f2f]/60 text-sm mb-8 max-w-lg mx-auto">
                            Para cualquier duda, reclamo o consulta adicional sobre estas políticas, por favor contáctenos directamente a través de nuestra línea oficial de WhatsApp.
                        </p>
                        
                        <button 
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-transparent border border-[#3f2f2f] text-[#3f2f2f] rounded-full hover:bg-[#3f2f2f] hover:text-white transition-all duration-300 text-xs font-bold uppercase tracking-widest"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver Atrás
                        </button>
                    </footer>
                </div>
            </main>
        </div>
    );
}