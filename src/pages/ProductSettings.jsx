// src/pages/ProductSettings.jsx
import { useMemo, useState } from "react";
import { useSales } from "@/state/sales.jsx"; // keep your existing hook import

const UNITS = ["each", "bulk"];

export default function ProductSettings() {
  const {
    productTypes = [],
    addProductType,
    removeProductType,
  } = useSales();

  // --- Add New Product (stacked form) ---
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unitLabel, setUnitLabel] = useState("each");

  const onAdd = (e) => {
    e?.preventDefault?.();
    const clean = name.trim();
    if (!clean) return;
    addProductType({
      name: clean,
      defaultPrice: Number(price) || 0,
      unitLabel,
      isActive: true,
    });
    setName("");
    setPrice("");
    setUnitLabel("each");
  };

  const TYPES = useMemo(() => productTypes ?? [], [productTypes]);

  // shared row grid (no fixed widths; wraps cleanly on small screens)
  const rowGrid = {
    display: "grid",
    gap: 8,
    gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) auto",
    alignItems: "center",
  };

  const headerCell = {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    opacity: 0.85,
    whiteSpace: "nowrap",
  };

  return (
    <main className="wrap" style={{ overflowX: "hidden" }}>
      {/* ---------- New Product (STACKED) ---------- */}
      <section className="card" style={{ overflow: "hidden" }}>
        <h2 style={{ marginBottom: 12 }}>New Product</h2>

        <form onSubmit={onAdd} className="grid" style={{ gap: 10 }}>
          <div className="row">
            <label>Name:</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (e.g., Keychain)"
            />
          </div>

          <div className="row">
            <label>Default Price:</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="row">
            <label>Unit of Measurement:</label>
            <select
              className="select"
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="inline" style={{ justifyContent: "flex-end" }}>
            <button className="primary" type="submit">
              Add
            </button>
          </div>
        </form>
      </section>

      {/* ---------- Existing Types (READ-ONLY + DELETE) ---------- */}
      <section className="card" style={{ overflowX: "hidden" }}>
        <div className="row" style={{ ...rowGrid, marginBottom: 6 }}>
          <div style={headerCell}>Name</div>
          <div style={headerCell}>Price</div>
          <div style={headerCell}>Unit</div>
          <div style={{ ...headerCell, textAlign: "right" }}>Actions</div>
        </div>

        <div className="grid" style={{ gap: 8 }}>
          {TYPES.length === 0 && (
            <p className="muted">No product types yet.</p>
          )}

          {TYPES.map((p, i) => (
            <div
              key={p.id ?? `type-${i}`}
              className="row"
              style={{
                ...rowGrid,
                padding: "8px 10px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* READ-ONLY cells (no inline editing) */}
              <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>{p.name}</div>
              <div>${Number(p.defaultPrice || 0).toFixed(2)}</div>
              <div>{String(p.unitLabel || "each")}</div>

              <div className="inline" style={{ justifyContent: "flex-end" }}>
                <button
                  className="danger"
                  onClick={() => removeProductType(p.id)}
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
