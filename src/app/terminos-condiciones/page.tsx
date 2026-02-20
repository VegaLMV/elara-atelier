import Link from "next/link";

export const metadata = {
    title: "Términos y Condiciones | Élara Atelier",
    description: "Términos y condiciones de uso y políticas de compra de Élara Atelier.",
};

export default function TerminosPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header / Navigation Spacer */}
            <div className="h-20" />

            <main className="max-w-4xl mx-auto px-6 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-serif text-slate-900 mb-4 tracking-tight">
                        Términos y Condiciones
                    </h1>
                    <p className="text-slate-500 font-light tracking-widest uppercase text-xs">
                        Última actualización: Febrero 2026
                    </p>
                </div>

                <div className="space-y-12 text-slate-700 leading-relaxed font-light">
                    {/* Section 1 */}
                    <section>
                        <h2 className="text-xl font-serif text-slate-900 mb-4 border-b border-slate-100 pb-2">
                            1. INFORMACIÓN GENERAL
                        </h2>
                        <div className="space-y-2">
                            <p><span className="font-semibold text-slate-900">Nombre Comercial:</span> Élara Atelier</p>
                            <p><span className="font-semibold text-slate-900">Ubicación:</span> Ica, Perú</p>
                            <p><span className="font-semibold text-slate-900">Canal Oficial de Atención:</span> WhatsApp</p>
                            <p><span className="font-semibold text-slate-900">Normativa:</span> Estos términos se rigen por la legislación vigente en la República del Perú.</p>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-xl font-serif text-slate-900 mb-4 border-b border-slate-100 pb-2">
                            2. DISPONIBILIDAD DE PRODUCTOS
                        </h2>
                        <p className="mb-4">Nuestras prendas se ofrecen sujetas a disponibilidad de inventario.</p>
                        <ul className="list-disc pl-5 space-y-3">
                            <li>
                                <span className="font-semibold text-slate-900">Reposición de Inventario:</span> En caso de que el cliente adquiera un producto que se ha agotado temporalmente, Élara Atelier se compromete a surtir nuevamente el modelo. El cliente acepta esperar el tiempo necesario para la confección o reposición del inventario.
                            </li>
                            <li>
                                <span className="font-semibold text-slate-900">Opciones:</span> Si el cliente prefiere no esperar, podrá solicitar el cambio por otro producto disponible de igual valor.
                            </li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 className="text-xl font-serif text-slate-900 mb-4 border-b border-slate-100 pb-2">
                            3. PRECIOS Y MÉTODOS DE PAGO
                        </h2>
                        <p className="mb-4">Los precios están expresados en Soles (S/) e incluyen los impuestos de ley. Nos reservamos el derecho de modificar precios sin previo aviso, respetando siempre el valor vigente al momento de confirmar una compra.</p>
                        <p className="font-semibold text-slate-900 mb-2">Medios de pago aceptados:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Billeteras Digitales: Yape y Plin.</li>
                            <li>Transferencia Bancaria.</li>
                            <li>Efectivo (Contra Entrega): Este método es exclusivo para entregas presenciales dentro de la ciudad de Ica. Para envíos a otras provincias o vía agencia, el pago debe ser 100% adelantado.</li>
                        </ul>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="text-xl font-serif text-slate-900 mb-4 border-b border-slate-100 pb-2">
                            4. POLÍTICAS DE ENVÍO Y ENTREGAS
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-2">A. Cobertura y Plazos</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><span className="font-medium">Ica (Ciudad):</span> Entrega a domicilio en un plazo máximo de 4 días hábiles. Entrega en Plaza de Armas en un plazo máximo de 3 días hábiles.</li>
                                    <li><span className="font-medium">Nacional (Provincias):</span> Envíos a través de la agencia Shalom. El tiempo de llegada depende del transporte. Se facilitará el número de seguimiento (tracking).</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-900 mb-2">B. Costos de Envío</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><span className="font-medium">Primera Compra:</span> El envío a domicilio es GRATIS (Promoción de bienvenida).</li>
                                    <li><span className="font-medium">Compras Recurrentes:</span> El envío a domicilio tiene un costo adicional, el cual será informado antes del pago.</li>
                                    <li><span className="font-medium">Punto de Encuentro:</span> La entrega en la Plaza de Armas de Ica es siempre GRATUITA.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-900 mb-2">C. Responsabilidad</h3>
                                <p>Élara Atelier se hace responsable de la integridad del paquete hasta su entrega al cliente (en Ica) o hasta su recepción en la agencia de transporte (envíos nacionales).</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <h2 className="text-xl font-serif text-slate-900 mb-4 border-b border-slate-100 pb-2">
                            5. POLÍTICA DE CAMBIOS Y DEVOLUCIONES
                        </h2>
                        <p className="mb-4">Nuestro objetivo es tu satisfacción total. Si necesitas realizar un cambio, aplicarán las siguientes condiciones:</p>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-2">A. Plazos y Requisitos</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>El cliente tiene un plazo máximo de 3 días calendario desde la recepción del producto para solicitar un cambio.</li>
                                    <li>La prenda debe estar SIN USO, sin olores, sin manchas (maquillaje/desodorante) y en perfecto estado.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-900 mb-2">B. Valor del Cambio</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Los cambios se realizarán por prendas que tengan el mismo valor monetario al que figuraba en la compra original.</li>
                                    <li>Si el cliente desea un producto de mayor valor, deberá abonar la diferencia.</li>
                                    <li>No se realizarán devoluciones de dinero en efectivo si el cliente elige una prenda de menor valor.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-900 mb-2">C. Costos Logísticos del Cambio</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><span className="font-medium text-slate-900">Por Falla de Fábrica:</span> Élara Atelier asume el costo total del retorno y nuevo envío.</li>
                                    <li><span className="font-medium text-slate-900">Por Gusto o Talla:</span> El cliente asume los costos de envío y retorno.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <h2 className="text-xl font-serif text-slate-900 mb-4 border-b border-slate-100 pb-2">
                            6. PROPIEDAD INTELECTUAL
                        </h2>
                        <p>Todo el contenido de este sitio (imágenes, textos, logotipos) es propiedad exclusiva de Élara Atelier. Su uso comercial sin autorización está prohibido.</p>
                    </section>

                    {/* Section 7 */}
                    <section>
                        <h2 className="text-xl font-serif text-slate-900 mb-4 border-b border-slate-100 pb-2">
                            7. POLÍTICA DE PRIVACIDAD
                        </h2>
                        <p>Sus datos personales (Nombre, DNI, Dirección, Teléfono) son utilizados únicamente para procesar y entregar su pedido. No compartimos su información con terceros salvo con la empresa de mensajería para fines logísticos.</p>
                    </section>

                    <footer className="pt-16 border-t border-slate-100 text-center">
                        <p className="text-slate-400 text-sm mb-6">
                            Para cualquier duda, reclamo o consulta adicional, por favor contáctenos a través de nuestro medio de WhatsApp.
                        </p>
                        
                    </footer>
                </div>
            </main>
        </div>
    );
}
