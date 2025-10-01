// src/pages/AddFabric.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSales } from "@/state/sales.jsx";

export default function AddFabricPage() {
  const { series, fabrics, addSeries, addFabric, removeFabric } = useSales();

  // ---------- helpers ----------
  const k = (o, fallback) =>
    String(
      o?.id ??
        o?._id ??
        o?.key ??
        o?.slug ??
        o?.code ??
        o?.name ??
        fallback
    );

  // ---------- Add form state ----------
  const firstSeriesId = series?.[0]?.id ?? "";
  const [name, setName] = useState("");
  const [sid, setSid] = useState(firstSeriesId);

  // keep sid valid when series list updates
  useEffect(() => {
    if (!series?.length) return setSid("");
    // if current sid is no longer present, reset to first
    const exists = series.some(s => String(s.id) === String(sid));
    if (!exists) setSid(series[0].id);
  }, [series, sid]);

  const onNewSeries = () => {
    const v = prompt("New series name?");
    if (!v) return;
    const s = addSeries(v);
    if (s?.id) setSid(s.id);
  };

  const onSave = () => {
    const clean = name.trim();
    if (!clean) return;
    addFabric({ name: clean, seriesId: sid || null, isActive: true });
    setName("");
    setSid(series?.[0]?.id || "");
  };

  // ---------- Library (search + group + manage) ----------
  const [q, setQ] = useState("");
  const [manage, setManage] = useState(false);

  const seriesById = useMemo(() => {
    const m = new Map((series || []).map((s) => [s.id, s.name]));
    m.set(null, "Unsorted");
    return m;
  }, [series]);

  const grouped = useMemo(() => {
    const arr = (fabrics || []).map((f) => ({
      ...f,
      seriesTitle: seriesById.get(f.seriesId ?? null) || "Unsorted",
      seriesKey: f.seriesId ?? "unsorted",
    }));

    const filtered = q.trim()
      ? arr.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()))
      : arr;

    const bySeries = new Map();
    for (const f of filtered) {
      const bucket = f.seriesKey;
      if (!bySeries.has(bucket)) bySeries.set(bucket, []);
      bySeries.get(bucket).push(f);
    }

    return [...bySeries.entries()]
      .map(([key, items]) => ({
        key,
        title: key === "unsorted" ? "Unsorted" : seriesById.get(key) || "Unsorted",
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort(
        (a, b) =>
          (a.title === "Unsorted") - (b.title === "Unsorted") ||
          a.title.localeCompare(b.title)
      );
  }, [fabrics, q, seriesById]);

  return (
    <div className="grid" style={{ display: "grid", gap: 16 }}>
      {/* Add fabric */}
      <div className="card">
        <div className="label" style={{ marginBottom: 6, fontWeight: 700 }}>
          Add New Fabric
        </div>

        <div className="grid" style={{ display: "grid", gap: 10 }}>
          <label className="label">Pattern / Fabric Name</label>
          <input
            className="input"
            placeholder="e.g., Eevee Friends"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="label" style={{ marginTop: 6 }}>
            Series
          </label>
          <div className="inline" style={{ gap: 8 }}>
            <select
              className="select"
              value={sid}
              onChange={(e) => setSid(e.target.value)}
            >
              <option value="">Unsorted</option>
              {(series || []).map((s, i) => (
                <option key={k(s, i)} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button type="button" className="btn" onClick={onNewSeries}>
              + New
            </button>
          </div>
        </div>

        <div className="inline" style={{ justifyContent: "flex-end", marginTop: 10 }}>
          <button className="btn btn-primary" onClick={onSave}>
            Save Fabric
          </button>
        </div>
      </div>

      {/* Library */}
      <div className="card fabrics-card">
        <div className="inline" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <div className="label" style={{ fontWeight: 700 }}>
            Fabrics <span className="pill">{fabrics?.length ?? 0}</span>
          </div>
          <div className="inline" style={{ gap: 8 }}>
            <input
              className="input"
              placeholder="Search fabrics…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ width: 220 }}
            />
            <button
              className={"btn" + (manage ? " btn-danger" : "")}
              onClick={() => setManage((m) => !m)}
            >
              {manage ? "Done" : "Manage"}
            </button>
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="label" style={{ opacity: 0.8 }}>
            No fabrics match your search.
          </div>
        ) : (
          <div className="grid" style={{ display: "grid", gap: 12 }}>
            {grouped.map((g, gi) => (
              <section key={String(g?.key ?? g?.title ?? gi)}>
                <div className="inline" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                  <div className="label" style={{ fontWeight: 700 }}>
                    {g.title}
                  </div>
                  <div className="pill">{g.items.length}</div>
                </div>

                <ul className="fabric-list">
                  {(g.items || []).map((f, fi) => (
                    <FabricRow
                      key={k(f, `${g.key}:${f?.name ?? ""}:${fi}`)}
                      f={f}
                      seriesTitle={g.title}
                      manage={manage}
                      onDelete={() => {
                        if (confirm(`Delete “${f.name}”?`)) {
                          removeFabric(f.id);
                        }
                      }}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FabricRow({ f, seriesTitle, manage, onDelete }) {
  return (
    <li className="fabric-item row">
      <div className="fabric-thumb">
        <span>✦</span>
      </div>

      <div className="fabric-body">
        <div className="fabric-title">{f.name}</div>
        {/* Hide the redundant series name on this page via CSS if desired */}
        <div className="fabric-meta">{seriesTitle}</div>
      </div>

      {manage && (
        <button className="btn btn-danger" onClick={onDelete}>
          Delete
        </button>
      )}
    </li>
  );
}
