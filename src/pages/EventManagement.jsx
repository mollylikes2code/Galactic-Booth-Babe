// src/pages/EventManagement.jsx
// Active/Inactive Event UI + Snapshot (PDF). Sales come from useSales().

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSales } from "@/state/sales.jsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ---------- tiny toast ----------
const toast = {
  success: (m) => console.log("✅", m) || alert(m),
  error:   (m) => console.error("❌", m) || alert(m),
};

// ---------- local event registry (metadata only) ----------
const EVTS_KEY   = "bb:events";
const ACTIVE_KEY = "bb:activeEventId";

const readJSON = (k, f) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch { return f; } };
const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function uid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`; }

function getEvents() { return readJSON(EVTS_KEY, []); }
function setEvents(list) { writeJSON(EVTS_KEY, list); }
function getActiveId() { return readJSON(ACTIVE_KEY, null); }
function setActiveId(id) { writeJSON(ACTIVE_KEY, id); }

function getActiveEvent() {
  const id = getActiveId();
  if (!id) return null;
  return getEvents().find(e => e.id === id) || null;
}

function startEvent({ name, date, location }) {
  const evt = { id: uid("evt"), name: name.trim(), date: date || null, location: location || "", startedAt: new Date().toISOString(), endedAt: null };
  const all = getEvents();
  all.push(evt); setEvents(all); setActiveId(evt.id);
  return evt;
}
function endEvent(id) {
  const all = getEvents();
  const i = all.findIndex(e => e.id === id);
  if (i >= 0) { all[i] = { ...all[i], endedAt: new Date().toISOString() }; setEvents(all); }
  setActiveId(null);
  return all[i] || null;
}
function restoreEvent(id) { setActiveId(id); return getActiveEvent(); }

// ---------- PDF helpers ----------
function buildSnapshot(evt, sales) {
  const map = new Map();
  for (const order of sales) {
    for (const l of order.items || []) {
      const key = `${l.name}__${l.fabricId || ""}__${l.unitPrice}`;
      const prev = map.get(key) || { name: l.name, fabricId: l.fabricId || null, unitPrice: +l.unitPrice || 0, qty: 0 };
      prev.qty += +l.qty || 0; map.set(key, prev);
    }
  }
  const lines = Array.from(map.values()).map(l => ({ ...l, revenue: +(l.qty * l.unitPrice).toFixed(2) }));
  const gross = +lines.reduce((a,b)=>a+b.revenue,0).toFixed(2);
  return { id: `snap_${evt?.id || "none"}_${Date.now()}`, createdAt: new Date().toISOString(), event: evt, lines, totals: { gross } };
}

async function downloadSnapshotPDF(snapshot, node) {
  const canvas = await html2canvas(node, { scale: 2 });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const w = pdf.internal.pageSize.getWidth();
  const h = (canvas.height * w) / canvas.width;
  pdf.addImage(img, "PNG", 0, 20, w, h);
  const safe = (s) => (s || "Event").replace(/\s+/g, "_");
  pdf.save(`${safe(snapshot.event?.name)}_snapshot.pdf`);
}

export default function EventManagementPage() {
  const navigate = useNavigate();
  const salesApi = useSales();
  const allSales = salesApi.sales || [];

  // Active/inactive event
  const [active, setActive] = useState(() => getActiveEvent());
  const [events, setEvtList] = useState(() => getEvents());
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === EVTS_KEY || e.key === ACTIVE_KEY) {
        setActive(getActiveEvent());
        setEvtList(getEvents());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Filter orders within event window
  const eventSales = useMemo(() => {
    if (!active?.startedAt) return [];
    const start = new Date(active.startedAt).getTime();
    const end = active.endedAt ? new Date(active.endedAt).getTime() : Infinity;
    return (allSales || []).filter(o => {
      const t = new Date(o.createdAt || 0).getTime();
      return t >= start && t < end;
    });
  }, [active, allSales]);

  const totals = useMemo(() => {
    const gross = eventSales
      .flatMap(s => s.items || [])
      .reduce((a,l)=> a + (Number(l.unitPrice||0) * Number(l.qty||0)), 0);
    return { gross: +gross.toFixed(2) };
  }, [eventSales]);

  const itemTotals = useMemo(() => {
    const tally = {};
    for (const o of eventSales) {
      for (const l of o.items || []) {
        const key = `${l.name}__${l.fabricId || ""}`;
        const price = Number(l.unitPrice || 0);
        const qty = Number(l.qty || 0);
        if (!tally[key]) tally[key] = { name: l.name, fabricId: l.fabricId || null, qty: 0, revenue: 0 };
        tally[key].qty += qty;
        tally[key].revenue += qty * price;
      }
    }
    return Object.values(tally);
  }, [eventSales]);

  // create/restore/end
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0,10));
  const [newLoc, setNewLoc] = useState("");

  function onStartNew(e) {
    e?.preventDefault?.();
    if (!newName.trim()) return toast.error("Please enter an event name.");
    const evt = startEvent({ name: newName.trim(), date: newDate, location: newLoc });
    setShowNew(false); setNewName(""); setNewLoc("");
    setActive(evt); setEvtList(getEvents());
    toast.success("Event started.");
  }

  function onEndEvent() {
    if (!active) return;
    if (!confirm(`End event “${active.name}”? You can restore it later.`)) return;
    endEvent(active.id);
    setActive(getActiveEvent());
    setEvtList(getEvents());
    toast.success("Event ended.");
  }

  function onRestore(id) {
    restoreEvent(id);
    setActive(getActiveEvent());
    toast.success("Event restored.");
  }

  // Snapshot
  const [busy, setBusy] = useState(false);
  const [snap, setSnap] = useState(null);
  const printRef = useRef(null);

  async function onRecord() {
    if (!active) return toast.error("Start an event first.");
    if (busy) return;
    setBusy(true);
    try {
      const snapshot = buildSnapshot(active, eventSales);
      setSnap(snapshot);
      await new Promise((r)=>setTimeout(r,0));
      await downloadSnapshotPDF(snapshot, printRef.current);
      toast.success("Snapshot saved • PDF downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Snapshot failed");
    } finally {
      setBusy(false);
    }
  }

  // Pagination: latest 5 + load more
  const eventSalesSorted = useMemo(() => {
    return [...eventSales].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [eventSales]);

  const [visibleCount, setVisibleCount] = useState(5);
  useEffect(() => { setVisibleCount(5); }, [active?.id]);
  const visibleSales = eventSalesSorted.slice(0, visibleCount);

  const isActive = !!active;

  // === layout constraints for uniform look ===
  const shellStyle = { gap: 16, maxWidth: 900, margin: "0 auto", padding: 12 };
  const stackGap = { gap: 12 };
  const cardP = { padding: 12 };

  return (
    <main className="grid" style={shellStyle}>
      {/* [A] Header cluster (inside a card, with header inside) */}
      {isActive ? (
        <section className="card grid" style={{ ...cardP, ...stackGap }}>
          <div>
            <h3 style={{ margin: 0 }}>Active Event</h3>
            <div className="inline" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
              <h2 style={{ margin: 0 }}>{active.name}</h2>
            </div>
            <div className="inline" style={{ gap: 8, fontSize: 14, opacity: 0.85, marginTop: 6 }}>
              {active.date ? <span className="pill">{active.date}</span> : null}
              {active.location ? <span className="pill">• {active.location}</span> : null}
            </div>
          </div>

          <div className="inline" style={{ gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={onRecord} disabled={busy || eventSales.length===0}>
              {busy ? "Preparing…" : "Record Event Sales Snapshot"}
            </button>
            <button className="btn btn-danger" onClick={onEndEvent}>End Event</button>
            <button className="btn" onClick={() => navigate(-1)}>Back</button>
          </div>
        </section>
      ) : (
        <section className="card grid" style={{ ...cardP, ...stackGap }}>
          <h3 style={{ margin: 0 }}>Events</h3>
          {!showNew ? (
            <div className="grid" style={{ gap: 8 }}>
              <button className="btn btn-primary" onClick={() => setShowNew(true)}>Start New Event</button>
              {events.length > 0 && (
                <button className="btn" onClick={() => onRestore(events[events.length-1].id)}>
                  Restore Last Event
                </button>
              )}
              <button className="btn" onClick={() => navigate(-1)}>Back</button>
            </div>
          ) : (
            <form className="grid" style={{ gap: 8 }} onSubmit={onStartNew}>
              <div className="grid" style={{ gap: 4 }}>
                <label className="label">Event Name</label>
                <input className="input" value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="e.g., Fall Craft Fair" required />
              </div>
              <div className="grid" style={{ gap: 4 }}>
                <label className="label">Date</label>
                <input className="input" type="date" value={newDate || ""} onChange={(e)=>setNewDate(e.target.value)} />
              </div>
              <div className="grid" style={{ gap: 4 }}>
                <label className="label">Location</label>
                <input className="input" value={newLoc} onChange={(e)=>setNewLoc(e.target.value)} placeholder="e.g., Portland Expo" />
              </div>
              <div className="inline" style={{ gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={()=>setShowNew(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Start Event</button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* [B] Metrics stack — all cards same width/spacing */}
      {isActive ? (
        <section className="grid" style={stackGap}>
          {/* Gross Sales */}
          <div className="card" style={cardP}>
            <h3 style={{ marginTop: 0 }}>Gross Sales</h3>
            <div className="inline" style={{ alignItems: "center", justifyContent: "space-between" }}>
              <span className="label">Total revenue</span>
              <span className="total">${totals.gross.toFixed(2)}</span>
            </div>
          </div>

          {/* Sales Orders */}
          <div className="card" style={cardP}>
            <h3 style={{ marginTop: 0 }}>Sales Orders</h3>
            {eventSalesSorted.length === 0 && <div style={{ opacity: 0.6, padding: 8 }}>No sales yet.</div>}

            {visibleSales.map((s) => (
              <details key={s.id} className="card" style={{ marginBottom: 8 }}>
                <summary>SO# {s.id} — ${Number(s.total ?? s.subtotal ?? 0).toFixed(2)}</summary>
                <div className="grid" style={{ padding: 8, gap: 4 }}>
                  {(s.items || []).map((l, i) => (
                    <div key={i} className="inline row" style={{ justifyContent: "space-between" }}>
                      <span>
                        {l.name} × {l.qty ?? 0}
                        {l.fabricId ? ` — ${salesApi.getFabric?.(l.fabricId)?.name || l.fabricId}` : ""}
                      </span>
                      <span>${(Number(l.unitPrice || 0) * Number(l.qty || 0)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}

            {eventSalesSorted.length > 0 && (
              <div className="inline" style={{ gap: 8, paddingTop: 8, justifyContent: "center" }}>
                {visibleCount < eventSalesSorted.length && (
                  <button className="btn" onClick={() => setVisibleCount((n) => n + 5)}>Load more</button>
                )}
                {visibleCount > 5 && (
                  <button className="btn" onClick={() => setVisibleCount(5)}>Collapse</button>
                )}
              </div>
            )}
          </div>

          {/* Items Sold (Totals) */}
          <div className="card" style={cardP}>
            <h3 style={{ marginTop: 0 }}>Items Sold (Totals)</h3>
            {itemTotals.length === 0 && <div style={{ opacity: 0.6, padding: 8 }}>No items yet.</div>}
            {itemTotals.map((l, i) => (
              <div key={i} className="row inline" style={{ justifyContent: "space-between", padding: "4px 0" }}>
                <span>
                  {l.name}
                  {l.fabricId ? ` — ${salesApi.getFabric?.(l.fabricId)?.name || l.fabricId}` : ""} × {l.qty}
                </span>
                <span>${l.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="card" style={cardP}>
          <h3 style={{ marginTop: 0 }}>Past Events</h3>
          
          {events.length === 0 ? (
            <div style={{ opacity: 0.6, padding: 8 }}>No past events yet.</div>
          ) : (
            <div className="grid" style={{ gap: 8 }}>
              {[...events].reverse().map((e) => (
                <div key={e.id} className="row card" style={{ padding: 10, alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <strong>{e.name}</strong>
                    <div className="label" style={{ marginTop: 2, opacity: 0.8 }}>
                      {e.date || "—"} {e.location ? `• ${e.location}` : ""} {e.endedAt ? "• Ended" : "• Incomplete"}
                    </div>
                  </div>
                  <div className="inline" style={{ gap: 8 }}>
                    <button className="btn" onClick={() => onRestore(e.id)}>Restore</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Hidden print node for PDF */}
      {snap && (
        <div
          ref={printRef}
          style={{ position: "fixed", top: -9999, left: -9999, background: "#fff", padding: 24, width: 760 }}
        >
          <h2>{snap.event?.name || "Event"} — Snapshot</h2>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {snap.event?.date || ""} {snap.event?.location ? `• ${snap.event.location}` : ""}
          </div>
          <div style={{ marginTop: 8, fontWeight: 700 }}>Gross Sales: ${snap.totals.gross.toFixed(2)}</div>
          <h3>Items</h3>
          {snap.lines.map((l, idx) => (
            <div key={idx} className="row" style={{ justifyContent: "space-between" }}>
              <span>
                {l.name}
                {l.fabricId ? ` — ${salesApi.getFabric?.(l.fabricId)?.name || l.fabricId}` : ""} × {l.qty}
              </span>
              <span>${l.revenue.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
