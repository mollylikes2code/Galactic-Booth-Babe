// src/pages/Sales.jsx
import { useState, useMemo, useEffect } from "react";
import { useSales } from "@/state/sales.jsx";

export default function SalesPage() {
  const {
    // data
    productTypesActive,
    fabricsActive,   // for dropdown (active only)
    fabrics,         // for rendering in cart (show even if later deactivated)
    series,          // to resolve series names
    cart,

    // ops
    addCartLine,
    updateCartLine,
    removeCartLine,
    createSaleFromCart,

    // derived / getters
    cartSubtotal,
    getProductType,
  } = useSales();

  /* ---------- safe defaults ---------- */
  const PT         = productTypesActive ?? [];
  const FAB_ACTIVE = fabricsActive ?? [];
  const FAB_ALL    = fabrics ?? [];
  const SERIES     = series ?? [];
  const CART       = cart ?? [];

  /* ---------- key normalizers ---------- */
  const fabricKey = (f) =>
    String(f?.id ?? f?._id ?? f?.key ?? f?.slug ?? f?.code ?? f?.name ?? "");
  const seriesKey = (s) =>
    String(s?.id ?? s?._id ?? s?.key ?? s?.slug ?? s?.name ?? "");

  /* ---------- fast lookup maps ---------- */
  const fabricById = useMemo(() => {
    const m = new Map();
    for (const f of FAB_ALL) m.set(fabricKey(f), f);
    return m;
  }, [FAB_ALL]);

  const seriesById = useMemo(() => {
    const m = new Map();
    for (const s of SERIES) m.set(seriesKey(s), s.name);
    return m;
  }, [SERIES]);

  /* ---------- subtotal works as function OR number ---------- */
  const itemsAmount =
    typeof cartSubtotal === "function" ? cartSubtotal() : Number(cartSubtotal || 0);

  /* ---------- discount (UI-only for now) ---------- */
  const [discount, setDiscount] = useState(0);
  const totalAmount = Math.max(0, itemsAmount - (Number(discount) || 0));

  /* ---------- form state ---------- */
  const [sel, setSel] = useState(PT[0]?.id ? String(PT[0].id) : "");
  const [qty, setQty] = useState(1);
  const [fab, setFab] = useState("");

  useEffect(() => {
    if (!sel && PT.length) setSel(String(PT[0].id));
  }, [PT, sel]);

  /* ---------- lookups ---------- */
  const pt = useMemo(() => getProductType?.(sel), [sel, getProductType]);

  // requires fabric when unit is NOT "bulk"
  const requiresFabric =
    !!pt && (pt.unitLabel || "each").toLowerCase() !== "bulk";

  /* ---------- handlers ---------- */
  const onChangeProduct = (id) => {
    setSel(String(id));
    setFab("");
  };

  const addLine = (e) => {
    e?.preventDefault?.();
    if (!sel) return;
    if (requiresFabric && !fab) return;

    const displayName = pt?.name || "Item";
    addCartLine({
      productTypeId: sel,
      name: displayName,
      unitPrice: Number(pt?.defaultPrice) || 0,
      qty: Number(qty) || 1,
      fabricId: requiresFabric ? String(fab) : null,
    });

    setQty(1);
    setFab("");
  };

  const recordSale = () => {
    createSaleFromCart();
    setDiscount(0);
  };

  /* ---------- UI ---------- */
  return (
    <main className="grid" style={{ gap: 16, maxWidth: 900, margin: "0 auto", padding: 12 }}>
      {/* Top selector card with header inside */}
      <section className="card" style={{ padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Select item to add to cart</h3>

        <form className="inline" style={{ gap: 8, flexWrap: "wrap" }} onSubmit={addLine}>
          {/* Product */}
          <select className="select" value={sel} onChange={(e) => onChangeProduct(e.target.value)}>
            {PT.map((p, i) => (
              <option key={p.id ?? `pt-${i}`} value={String(p.id)}>
                {p.name} (${Number(p.defaultPrice ?? 0)})
              </option>
            ))}
          </select>

          {/* Fabric */}
          {requiresFabric && (
            <select
              className="select"
              value={fab}
              onChange={(e) => setFab(e.target.value)}
            >
              <option value="">Choose fabric…</option>
              {FAB_ACTIVE.map((f, i) => (
                <option key={fabricKey(f) || `fab-${i}`} value={fabricKey(f)}>
                  {f.name}
                </option>
              ))}
            </select>
          )}

          {/* Qty with +/- buttons */}
          <div className="inline" style={{ alignItems: "center", gap: 4 }}>
            <button
              type="button"
              className="btn"
              onClick={() => setQty(Math.max(1, qty - 1))}
            >
              –
            </button>
            <input
              className="input"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(+e.target.value || 1)}
              style={{ width: 60, textAlign: "center" }}
            />
            <button
              type="button"
              className="btn"
              onClick={() => setQty(qty + 1)}
            >
              +
            </button>
          </div>

          {/* Add */}
          <button className="btn btn-primary" type="submit" disabled={requiresFabric && !fab}>
            Add to Cart
          </button>
        </form>
      </section>

      {/* Cart with blue pill header */}
      <section className="card" style={{ padding: 12 }}>
        <div
          style={{
            background: "linear-gradient(0deg, rgba(0,160,220,.10), rgba(0,160,220,.10))",
            border: "1px solid rgba(0,160,220,.35)",
            padding: "8px 12px",
            borderRadius: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 700,
            letterSpacing: "0.08em",
            fontSize: 12,
            textTransform: "uppercase",
            color: "rgba(20,60,110,.95)",
            marginBottom: 12,
          }}
        >
          <span>Cart</span>
          <span>{CART.length} item{CART.length === 1 ? "" : "s"}</span>
        </div>

        {!CART.length && <p className="label" style={{ opacity: 0.8 }}>No items yet.</p>}

        {CART.map((l, i) => {
          const productName = getProductType?.(l.productTypeId)?.name || l.name;
          const fabObj = l.fabricId ? fabricById.get(String(l.fabricId)) : null;
          const seriesName = fabObj?.seriesId
            ? (seriesById.get(seriesKey({ id: fabObj.seriesId })) ??
               seriesById.get(seriesKey({ slug: fabObj.seriesId })) ??
               null)
            : null;

          return (
            <div
              key={l.id ?? `line-${i}`}
              className="row"
              style={{
                gap: 8,
                alignItems: "center",
                padding: "8px 0",
                borderTop: i ? "1px solid rgba(0,0,0,0.06)" : "none",
              }}
            >
              {/* Name + series/fabric */}
              <div style={{ flex: "1 1 220px", minWidth: 160 }}>
                <div style={{ fontWeight: 700 }}>{productName}</div>
                {fabObj && (
                  <div style={{ fontSize: 12, opacity: 0.85, fontStyle: "italic" }}>
                    {seriesName ? `${seriesName} — ` : ""}{fabObj.name}
                  </div>
                )}
              </div>

              {/* Price */}
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={l.unitPrice}
                onChange={(e) => updateCartLine(l.id, { unitPrice: +e.target.value || 0 })}
                style={{ width: 100 }}
              />

              {/* Qty with +/- buttons */}
              <div className="inline" style={{ alignItems: "center", gap: 4 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => updateCartLine(l.id, { qty: Math.max(1, l.qty - 1) })}
                >
                  –
                </button>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={l.qty}
                  onChange={(e) => updateCartLine(l.id, { qty: +e.target.value || 1 })}
                  style={{ width: 60, textAlign: "center" }}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => updateCartLine(l.id, { qty: l.qty + 1 })}
                >
                  +
                </button>
              </div>

              {/* Line total */}
              <div className="total" style={{ minWidth: 90, textAlign: "right" }}>
                ${((Number(l.unitPrice) || 0) * (Number(l.qty) || 0)).toFixed(2)}
              </div>

              {/* Remove */}
              <button className="btn btn-danger" onClick={() => removeCartLine(l.id)}>✕</button>
            </div>
          );
        })}

        {/* Totals */}
        <div className="grid" style={{ gap: 8, marginTop: 12 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="label">Item Amount</span>
            <span className="total">${itemsAmount.toFixed(2)}</span>
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="label">Discount</span>
            <span className="total">${Number(discount || 0).toFixed(2)}</span>
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="label">Total Amount</span>
            <span className="total">${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Record sale */}
        <div className="inline" style={{ justifyContent: "center", marginTop: 12 }}>
          <button
            className="btn btn-primary"
            disabled={!CART.length}
            onClick={recordSale}
          >
            Record Sale
          </button>
        </div>
      </section>
    </main>
  );
}
