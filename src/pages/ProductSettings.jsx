// src/pages/ProductSettings.jsx
import { useState, useMemo } from "react";
import { useSales } from "@/state/sales.jsx";

const UNITS = ["each", "bulk"];

// All 4 columns flexible: no fixed width
const GRID_COLS = "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)";

export default function ProductSettings() {
  const {
    productTypes = [],
    addProductType,
    updateProductType,
    removeProductType,
  } = useSales();

  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [unitLabel, setUnitLabel] = useState("each");
  const [customUnit, setCustomUnit] = useState("");

  const isCustom = unitLabel === "custom";
  const resolvedUnit = isCustom ? (customUnit.trim() || "each") : unitLabel;

  const onAdd = () => {
    const clean = name.trim();
    if (!clean) return;
    addProductType({
      name: clean,
      defaultPrice: +price || 0,
      unitLabel: resolvedUnit,
      isActive: true,
    });
    setName(""); setPrice(0); setUnitLabel("each"); setCustomUnit("");
  };

  const pageStyle = {
    gap: 16,
    maxWidth: 900,
    margin: "0 auto",
    padding: 12,
    overflowX: "hidden",
  };

  const rowGrid = {
    display: "grid",
    gap: 8,
    gridTemplateColumns: GRID_COLS,
    alignItems: "center",
  };

  const headerCell = {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    opacity: 0.85,
    textAlign: "left",
    whiteSpace: "nowrap",
  };

  const stickyHeader = {
    position: "sticky",
    top: 0,
    zIndex: 1,
    background:
      "linear-gradient(180deg, rgba(255,255,255,.95), rgba(255,255,255,.85))",
    backdropFilter: "blur(6px)",
    padding: "6px 6px 8px",
    borderBottom: "1px solid rgba(0,0,0,.06)",
  };

  const inputFull = { width: "100%", boxSizing: "border-box", minWidth: 0 };

  const TYPES = useMemo(() => productTypes ?? [], [productTypes]);

  return (
    <main className="grid" style={pageStyle}>
      {/* Create new product type */}
      <section className="card" style={{ padding: 12, overflowX: "hidden" }}>
        <div style={stickyHeader}>
          <div className="row" style={rowGrid}>
            <div className="label" style={headerCell}>New Product</div>
            <div className="label" style={headerCell}>default price</div>
            <div className="label" style={headerCell}>Unit of measurement</div>
            
          </div>
        </div>

        <div className="row" style={{ ...rowGrid, marginTop: 8 }}>
          <input
            className="input"
            style={inputFull}
            placeholder="Name (e.g., Keychain)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="input"
            style={inputFull}
            type="number"
            min="0"
            step="0.01"
            placeholder="Default $"
            value={price}
            onChange={(e) => setPrice(+e.target.value || 0)}
          />

          <div className="inline" style={{ gap: 8, minWidth: 0 }}>
            <select
              className="select"
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value)}
              style={{ ...inputFull }}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
              <option value="custom">custom…</option>
            </select>
            {isCustom && (
              <input
                className="input"
                style={{ width: 140, maxWidth: "100%" }}
                placeholder='e.g., "pair"'
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
              />
            )}
          </div>

          <button className="btn btn-primary" onClick={onAdd}>Add</button>
        </div>
      </section>

      {/* Existing product types */}
      <section
        className="card"
        style={{ padding: 12, overflowX: "hidden", overflowY: "auto" }}
      >
        <div style={stickyHeader}>
          <div className="row" style={rowGrid}>
            <div className="label" style={headerCell}>Name</div>
            <div className="label" style={headerCell}>Default Price</div>
            <div className="label" style={headerCell}>Unit</div>
            <div className="label" style={{ ...headerCell, textAlign: "right" }}>Actions</div>
          </div>
        </div>

        <div className="grid" style={{ gap: 8, marginTop: 8 }}>
          {TYPES.map((p, i) => {
            const normalized = String(p.unitLabel || "each").toLowerCase();
            const showCustom = normalized !== "each" && normalized !== "bulk";

            return (
              <div key={p.id ?? `type-${i}`} className="row" style={rowGrid}>
                <input
                  className="input"
                  style={inputFull}
                  value={p.name}
                  onChange={(e) => updateProductType(p.id, { name: e.target.value })}
                />

                <input
                  className="input"
                  style={inputFull}
                  type="number"
                  min="0"
                  step="0.01"
                  value={p.defaultPrice}
                  onChange={(e) =>
                    updateProductType(p.id, { defaultPrice: +e.target.value || 0 })
                  }
                />

                <select
                  className="select"
                  style={inputFull}
                  value={showCustom ? "custom" : normalized}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "custom") {
                      updateProductType(p.id, { unitLabel: p.unitLabel || "each" });
                    } else {
                      updateProductType(p.id, { unitLabel: v });
                    }
                  }}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                  <option value="custom">custom…</option>
                </select>

                <button className="btn btn-danger" onClick={() => removeProductType(p.id)}>
                  Delete
                </button>

                {showCustom && (
                  <div
                    className="inline"
                    style={{ marginTop: 8, gridColumn: "1 / -1", gap: 8 }}
                  >
                    <span className="label">Custom unit label:</span>
                    <input
                      className="input"
                      style={{ width: 200, maxWidth: "100%" }}
                      defaultValue={p.unitLabel}
                      placeholder='e.g., "pair"'
                      onBlur={(e) =>
                        updateProductType(p.id, {
                          unitLabel: (e.target.value || "each").trim(),
                        })
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}

          {!TYPES.length && (
            <p className="label" style={{ opacity: 0.8 }}>
              No product types yet.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
