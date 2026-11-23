import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Clock,
  Plus,
  Minus,
  ShoppingBag,
  Send,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  Bike,
  Store,
  CalendarClock,
  Navigation,
} from "lucide-react";
import { STORE_CONFIG, PRODUCTS, DELIVERY_MODES } from "./data";

const STORAGE_KEY = "lorena_last_order_v1";

function BrandLogo() {
  return (
    <a href="#" className="inline-flex items-center gap-3 group focus:outline-none">
      {/* Isotipo minimalista de arcoíris editorial */}
      <div className="relative w-10 h-10 rounded-2xl bg-[#2e1a3b] flex items-center justify-center shadow-xs overflow-hidden">
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <path d="M 6 28 A 14 14 0 0 1 34 28" stroke="#e58fa8" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 10.5 28 A 9.5 9.5 0 0 1 29.5 28" stroke="#e3b04b" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 15 28 A 5 5 0 0 1 25 28" stroke="#8db38b" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-display font-extrabold text-xl tracking-tight text-[#2e1a3b] leading-none">
            {STORE_CONFIG.brandName}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#e58fa8]" />
        </div>
        <span className="text-[11px] font-medium text-[#5a3a6e] tracking-wide mt-0.5">
          {STORE_CONFIG.brandSub}
        </span>
      </div>
    </a>
  );
}

function RainbowArc({ className = "" }) {
  return (
    <div className={`w-full overflow-hidden pointer-events-none select-none ${className}`} aria-hidden="true">
      <svg viewBox="0 0 600 100" className="w-full h-auto" fill="none">
        <path d="M 30 100 A 270 270 0 0 1 570 100" stroke="#e58fa8" strokeWidth="9" strokeLinecap="round" opacity="0.5" />
        <path d="M 52 100 A 248 248 0 0 1 548 100" stroke="#f2a672" strokeWidth="9" strokeLinecap="round" opacity="0.5" />
        <path d="M 74 100 A 226 226 0 0 1 526 100" stroke="#e3b04b" strokeWidth="9" strokeLinecap="round" opacity="0.5" />
        <path d="M 96 100 A 204 204 0 0 1 504 100" stroke="#8db38b" strokeWidth="9" strokeLinecap="round" opacity="0.5" />
        <path d="M 118 100 A 182 182 0 0 1 482 100" stroke="#6fa8c7" strokeWidth="9" strokeLinecap="round" opacity="0.5" />
      </svg>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("Mazamorras");
  const [cart, setCart] = useState({});
  const [lastOrder, setLastOrder] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("recojo");
  const [zoneRef, setZoneRef] = useState("");
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLastOrder(JSON.parse(saved));
    } catch {
      // Ignorar
    }
  }, []);

  const filteredProducts = useMemo(
    () => PRODUCTS.filter((p) => p.category === activeTab),
    [activeTab]
  );

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const product = PRODUCTS.find((p) => p.id === id);
        return product ? { ...product, qty, subtotal: product.price * qty } : null;
      })
      .filter(Boolean);
  }, [cart]);

  const totalCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.qty, 0),
    [cartItems]
  );

  const totalAmount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.subtotal, 0),
    [cartItems]
  );

  const currentModeObj = DELIVERY_MODES.find((m) => m.id === deliveryMode);

  const updateQty = (id, delta) => {
    setFormError("");
    setCart((prev) => {
      const next = (prev[id] || 0) + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const handleRepeatLastOrder = () => {
    if (!lastOrder?.cart) return;
    setCart(lastOrder.cart);
    if (lastOrder.customerName) setCustomerName(lastOrder.customerName);
    if (lastOrder.deliveryMode) setDeliveryMode(lastOrder.deliveryMode);
    if (lastOrder.zoneRef) setZoneRef(lastOrder.zoneRef);
    document.getElementById("pedido")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendWhatsApp = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setFormError("Agrega al menos un producto de la carta antes de enviar.");
      return;
    }
    if (!customerName.trim()) {
      setFormError("Escribe tu nombre para registrar el pedido.");
      return;
    }
    if (currentModeObj?.requiresZone && !zoneRef.trim()) {
      setFormError("Indica tu zona o referencia en Huancayo para el courier.");
      return;
    }
    if (currentModeObj?.requiresSchedule && !scheduleDateTime.trim()) {
      setFormError("Indica el día y hora deseada para tu pedido programado.");
      return;
    }

    setFormError("");

    const orderSnapshot = {
      cart,
      customerName: customerName.trim(),
      deliveryMode,
      zoneRef: zoneRef.trim(),
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orderSnapshot));
      setLastOrder(orderSnapshot);
    } catch {
      // Ignorar
    }

    const lines = [
      `Hola *${STORE_CONFIG.brandName}*, quiero hacer un pedido:`,
      "",
      `*Cliente:* ${customerName.trim()}`,
      `*Modalidad:* ${currentModeObj.label}`,
    ];

    if (deliveryMode === "recojo") {
      lines.push(`*Punto:* ${STORE_CONFIG.address}`);
    }
    if (zoneRef.trim()) {
      lines.push(`*Zona / Referencia:* ${zoneRef.trim()}`);
    }
    if (scheduleDateTime.trim()) {
      lines.push(`*Día y hora:* ${scheduleDateTime.trim()}`);
    }

    lines.push("", "*Detalle del pedido:*");
    cartItems.forEach((item) => {
      lines.push(`• ${item.qty}x ${item.name} (${item.portion}) — S/ ${item.subtotal.toFixed(2)}`);
    });

    lines.push("", `*Subtotal productos:* S/ ${totalAmount.toFixed(2)}`);
    if (deliveryMode === "courier") {
      lines.push("_(Costo de delivery por confirmar según zona)_");
    }
    if (note.trim()) {
      lines.push(`*Nota:* ${note.trim()}`);
    }

    const message = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${STORE_CONFIG.whatsapp}?text=${message}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#fbf8f4] text-[#2e1a3b] pb-24 sm:pb-14">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#fbf8f4]/90 backdrop-blur-md border-b border-[#2e1a3b]/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <BrandLogo />

          <div className="flex items-center gap-2">
            <a
              href="#ubicacion"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full text-[#5a3a6e] hover:bg-[#2e1a3b]/5 transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              Jr. Calixto 563
            </a>
            <a
              href="#carta"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-full bg-[#2e1a3b] text-[#fbf8f4] hover:bg-[#5a3a6e] transition shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Pedir ahora
            </a>
          </div>
        </div>
      </header>

      {/* HERO EDITORIAL CON FOTO REALISTA */}
      <section className="relative overflow-hidden border-b border-[#2e1a3b]/10 bg-gradient-to-b from-white/60 to-[#fbf8f4]">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-center">
            <div className="md:col-span-7 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#2e1a3b]/12 text-xs font-semibold text-[#5a3a6e] shadow-2xs mb-4">
                <span className="w-2 h-2 rounded-full bg-[#8db38b] animate-pulse" />
                Huancayo Centro · Couriers activos hoy
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#2e1a3b] leading-[1.1]">
                {STORE_CONFIG.tagline}
              </h1>

              <p className="mt-3 text-sm sm:text-base text-[#5a3a6e] leading-relaxed">
                {STORE_CONFIG.subtitle}
              </p>

              <div className="mt-6 flex flex-col sm:flex-row items-center md:justify-start justify-center gap-3">
                <a
                  href="#carta"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#2e1a3b] text-[#fbf8f4] font-bold text-sm shadow-sm hover:bg-[#5a3a6e] transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Armar mi pedido
                </a>

                {lastOrder ? (
                  <button
                    type="button"
                    onClick={handleRepeatLastOrder}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white border border-[#2e1a3b]/15 text-[#2e1a3b] font-semibold text-sm hover:bg-[#2e1a3b]/5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#5a3a6e]" />
                    Repetir último pedido
                  </button>
                ) : (
                  <a
                    href="#ubicacion"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white border border-[#2e1a3b]/15 text-[#2e1a3b] font-semibold text-sm hover:bg-[#2e1a3b]/5 transition"
                  >
                    <MapPin className="w-4 h-4 text-[#5a3a6e]" />
                    Ver punto de recojo
                  </a>
                )}
              </div>
            </div>

            {/* Tarjeta Visual Hero */}
            <div className="md:col-span-5">
              <div className="relative rounded-3xl overflow-hidden border border-[#2e1a3b]/12 bg-white p-2 shadow-sm">
                <div className="relative aspect-[4/3] md:aspect-[4/4] rounded-2xl overflow-hidden">
                  <img
                    src={STORE_CONFIG.heroImage}
                    alt="Postres artesanales de Lorena en Huancayo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2e1a3b]/75 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-[#e3b04b]">
                      Especialidad de la casa
                    </p>
                    <p className="font-display font-bold text-base leading-tight">
                      Morada, Zambito & Arroz con Leche
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-6 -mb-2">
          <RainbowArc />
        </div>
      </section>

      {/* CARTA EXPRESS */}
      <main className="max-w-3xl mx-auto px-4 pt-8 space-y-12">
        <section id="carta" className="scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-[#2e1a3b]">
                Carta Express
              </h2>
              <p className="text-xs text-[#5a3a6e] mt-0.5">
                Toca para sumar porciones a tu pedido.
              </p>
            </div>

            {/* PESTAÑAS */}
            <div className="inline-flex p-1 rounded-2xl bg-[#2e1a3b]/8 border border-[#2e1a3b]/10 self-start sm:self-auto">
              {["Mazamorras", "Chocotejas"].map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      active
                        ? "bg-[#2e1a3b] text-[#fbf8f4] shadow-xs"
                        : "text-[#5a3a6e] hover:text-[#2e1a3b]"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GRID DE PRODUCTOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredProducts.map((product) => {
              const qty = cart[product.id] || 0;
              return (
                <div
                  key={product.id}
                  className={`p-3.5 rounded-2xl bg-white border transition flex gap-3.5 items-center ${
                    qty > 0
                      ? "border-[#2e1a3b] ring-1 ring-[#2e1a3b]/15 shadow-xs"
                      : "border-[#2e1a3b]/10 hover:border-[#2e1a3b]/25"
                  }`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="w-20 h-20 rounded-xl object-cover shrink-0 bg-[#fbf8f4]"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {product.badge && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${product.accent}25`,
                            color: "#2e1a3b",
                          }}
                        >
                          {product.badge}
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-[#5a3a6e]">
                        · {product.portion}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-base text-[#2e1a3b] mt-1 leading-snug">
                      {product.name}
                    </h3>

                    <p className="text-xs text-[#5a3a6e] mt-0.5 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <span className="font-display font-extrabold text-sm text-[#2e1a3b]">
                        S/ {product.price.toFixed(2)}
                      </span>

                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => updateQty(product.id, 1)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#fbf8f4] border border-[#2e1a3b]/20 text-xs font-bold text-[#2e1a3b] hover:bg-[#2e1a3b] hover:text-[#fbf8f4] transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Agregar
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-[#2e1a3b] text-[#fbf8f4] rounded-xl p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQty(product.id, -1)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/15 transition cursor-pointer"
                            aria-label="Quitar uno"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold min-w-[1.25rem] text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(product.id, 1)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/15 transition cursor-pointer"
                            aria-label="Agregar uno"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FORMULARIO DE PEDIDO */}
        <section id="pedido" className="scroll-mt-20">
          <div className="bg-white rounded-3xl border border-[#2e1a3b]/12 p-5 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-xl font-extrabold text-[#2e1a3b]">
                  Tu Pedido Express
                </h2>
                <p className="text-xs text-[#5a3a6e]">
                  Completa tus datos y envíalo directo a WhatsApp.
                </p>
              </div>
              {totalCount > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#8db38b]/25 text-[#2e1a3b]">
                  {totalCount} {totalCount === 1 ? "item" : "items"}
                </span>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="p-5 rounded-2xl bg-[#fbf8f4] border border-dashed border-[#2e1a3b]/20 text-center text-xs text-[#5a3a6e] mb-6">
                Aún no seleccionas productos. Elige tus mazamorras o chocotejas arriba.
              </div>
            ) : (
              <div className="mb-6 rounded-2xl bg-[#fbf8f4] p-4 space-y-2.5 border border-[#2e1a3b]/10">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-[#2e1a3b]">
                      <strong className="font-bold">{item.qty}x</strong> {item.name}{" "}
                      <span className="text-xs text-[#5a3a6e]">({item.portion})</span>
                    </span>
                    <span className="font-bold text-[#2e1a3b]">
                      S/ {item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="pt-2.5 border-t border-[#2e1a3b]/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#5a3a6e]">
                    Subtotal productos
                  </span>
                  <span className="font-display text-lg font-extrabold text-[#2e1a3b]">
                    S/ {totalAmount.toFixed(2)}
                  </span>
                </div>
                {deliveryMode === "courier" && (
                  <p className="text-[11px] text-[#5a3a6e]">
                    * El costo del courier se confirma por WhatsApp según tu zona.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSendWhatsApp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2e1a3b] mb-1.5">
                  Tu nombre *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. Piero"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fbf8f4] border border-[#2e1a3b]/15 text-sm focus:outline-none focus:border-[#2e1a3b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2e1a3b] mb-1.5">
                  Modalidad de entrega *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {DELIVERY_MODES.map((mode) => {
                    const selected = deliveryMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setDeliveryMode(mode.id);
                          setFormError("");
                        }}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          selected
                            ? "bg-[#2e1a3b] text-[#fbf8f4] border-[#2e1a3b]"
                            : "bg-[#fbf8f4] text-[#2e1a3b] border-[#2e1a3b]/15 hover:border-[#2e1a3b]/35"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{mode.label}</span>
                          {selected && <CheckCircle2 className="w-3.5 h-3.5 text-[#8db38b]" />}
                        </div>
                        <p
                          className={`text-[10px] mt-1 leading-snug ${
                            selected ? "text-[#fbf8f4]/80" : "text-[#5a3a6e]"
                          }`}
                        >
                          {mode.hint}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(deliveryMode === "courier" || deliveryMode === "programado") && (
                <div>
                  <label className="block text-xs font-bold text-[#2e1a3b] mb-1.5">
                    Zona o referencia en Huancayo {currentModeObj?.requiresZone ? "*" : "(opcional si es recojo)"}
                  </label>
                  <input
                    type="text"
                    value={zoneRef}
                    onChange={(e) => setZoneRef(e.target.value)}
                    placeholder="Ej. Parque Constitución / El Tambo cuadra 4"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fbf8f4] border border-[#2e1a3b]/15 text-sm focus:outline-none focus:border-[#2e1a3b]"
                  />
                </div>
              )}

              {deliveryMode === "programado" && (
                <div>
                  <label className="block text-xs font-bold text-[#2e1a3b] mb-1.5">
                    Día y hora *
                  </label>
                  <input
                    type="text"
                    value={scheduleDateTime}
                    onChange={(e) => setScheduleDateTime(e.target.value)}
                    placeholder="Ej. Mañana a las 4:30 p.m."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fbf8f4] border border-[#2e1a3b]/15 text-sm focus:outline-none focus:border-[#2e1a3b]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#2e1a3b] mb-1.5">
                  Nota adicional (opcional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej. Con bastante canela, cucharita extra..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fbf8f4] border border-[#2e1a3b]/15 text-sm focus:outline-none focus:border-[#2e1a3b]"
                />
              </div>

              {formError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#2e1a3b] text-[#fbf8f4] font-bold text-sm hover:bg-[#5a3a6e] transition shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Enviar pedido por WhatsApp
              </button>
            </form>
          </div>
        </section>

        {/* UBICACIÓN Y RUTAS EN HUANCAYO */}
        <section id="ubicacion" className="scroll-mt-20">
          <div className="mb-4">
            <h2 className="font-display text-xl font-extrabold text-[#2e1a3b]">
              ¿Cómo operamos en Huancayo?
            </h2>
            <p className="text-xs text-[#5a3a6e]">
              Punto céntrico y reparto ágil en toda la ciudad.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="p-4 rounded-2xl bg-white border border-[#2e1a3b]/10">
              <div className="w-8 h-8 rounded-xl bg-[#e58fa8]/20 text-[#2e1a3b] flex items-center justify-center mb-2.5">
                <Store className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-[#2e1a3b]">Punto Fijo</h3>
              <p className="text-xs text-[#5a3a6e] mt-1 leading-relaxed">
                {STORE_CONFIG.address} ({STORE_CONFIG.reference}).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#2e1a3b]/10">
              <div className="w-8 h-8 rounded-xl bg-[#e3b04b]/25 text-[#2e1a3b] flex items-center justify-center mb-2.5">
                <Bike className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-[#2e1a3b]">Couriers en Ruta</h3>
              <p className="text-xs text-[#5a3a6e] mt-1 leading-relaxed">
                Vendedores y reparto rápido por Centro, El Tambo y Chilca.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#2e1a3b]/10">
              <div className="w-8 h-8 rounded-xl bg-[#8db38b]/25 text-[#2e1a3b] flex items-center justify-center mb-2.5">
                <CalendarClock className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-[#2e1a3b]">Programados</h3>
              <p className="text-xs text-[#5a3a6e] mt-1 leading-relaxed">
                Separa tus porciones o cajas de chocotejas para oficinas y eventos.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#2e1a3b]/12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-[#2e1a3b]">
                <MapPin className="w-4 h-4 text-[#e58fa8]" />
                {STORE_CONFIG.address}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#5a3a6e]">
                <Clock className="w-3.5 h-3.5" />
                {STORE_CONFIG.schedule}
              </div>
            </div>

            <a
              href={STORE_CONFIG.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#fbf8f4] border border-[#2e1a3b]/20 text-xs font-bold text-[#2e1a3b] hover:bg-[#2e1a3b] hover:text-[#fbf8f4] transition shrink-0"
            >
              <Navigation className="w-3.5 h-3.5" />
              Abrir en Google Maps
            </a>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="max-w-3xl mx-auto px-4 mt-14 pt-6 border-t border-[#2e1a3b]/10 text-center">
        <div className="max-w-xs mx-auto mb-4 opacity-80">
          <RainbowArc />
        </div>

        <p className="font-display font-extrabold text-base text-[#2e1a3b]">
          {STORE_CONFIG.brandName} · {STORE_CONFIG.brandSub}
        </p>
        <p className="text-xs text-[#5a3a6e] mt-1">{STORE_CONFIG.address}</p>

        <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
          <a
            href={STORE_CONFIG.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold px-3.5 py-2 rounded-full bg-white border border-[#2e1a3b]/15 text-[#2e1a3b] hover:bg-[#2e1a3b]/5 transition"
          >
            Instagram
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={STORE_CONFIG.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold px-3.5 py-2 rounded-full bg-white border border-[#2e1a3b]/15 text-[#2e1a3b] hover:bg-[#2e1a3b]/5 transition"
          >
            TikTok
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>

      {/* BARRA FIJA MÓVIL */}
      {totalCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-50 sm:hidden bg-[#2e1a3b] text-[#fbf8f4] px-4 py-3 shadow-lg border-t border-white/10">
          <a href="#pedido" className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e3b04b] text-[#2e1a3b] text-xs font-extrabold">
                {totalCount}
              </span>
              <span className="text-sm font-semibold">Revisar pedido</span>
            </div>
            <span className="font-display font-extrabold text-base">
              S/ {totalAmount.toFixed(2)} →
            </span>
          </a>
        </div>
      )}
    </div>
  );
}