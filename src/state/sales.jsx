// src/state/sales.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// ---------- Context + Hook ----------
const SalesCtx = createContext(null);

export function useSales() {
  const ctx = useContext(SalesCtx);
  if (!ctx) throw new Error("useSales must be used inside <SalesProvider>");
  return ctx;
}

// ---------- LocalStorage helpers ----------
const LS_KEY = "gbb_store_v1"; // one key for everything
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ---------- Seed & migration ----------
// replace your seed.productTypes with this:
const seed = {
  productTypes: [
    { id: "pt-keychain", name: "Keychain", defaultPrice: 8, unitLabel: "each",  packSize: 1, isActive: true },
    { id: "pt-sticker",  name: "Sticker",  defaultPrice: 3, unitLabel: "each",  packSize: 1, isActive: true }
  ],
  series: [],     // ✅ ensure this exists
  fabrics: [],    // ✅ ensure this exists
  cart: [],
  sales: []
};
const asArr = (v) => Array.isArray(v) ? v : [];
function migrate(data) {
  const d = (data && typeof data === "object") ? data : {};
  return {
    productTypes: asArr(d.productTypes).map(p => ({
      id: p.id,
      name: p.name,
      defaultPrice: Number(p.defaultPrice) || 0,
      // NEW: map old 'usesFabric' to a sensible default; default to 'each' and 1
      unitLabel: (p.unitLabel ?? "each"),
      packSize: Math.max(1, Number(p.packSize) || 1),
      isActive: p.isActive !== false
    })),
    series: asArr(d.series),
    fabrics: asArr(d.fabrics),
    cart: asArr(d.cart),
    sales: asArr(d.sales)
  };
}
function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

// ---------- Provider ----------
export function SalesProvider({ children }) {
  const [store, setStore] = useState(() => {
    const raw = readJSON(LS_KEY, null);
    if (!raw) return seed;
    const m = migrate(raw);
    return {
      productTypes: m.productTypes.length ? m.productTypes : seed.productTypes,
      series:       m.series.length       ? m.series       : seed.series,
      fabrics:      m.fabrics.length      ? m.fabrics      : seed.fabrics,
      cart: m.cart,
      sales: m.sales
    };
  });

  useEffect(() => { writeJSON(LS_KEY, store); }, [store]);

  // ---------- Series ----------
const addSeries = (name) => {
  const clean = String(name || "").trim();
  if (!clean) return null;
  const s = { id: uid("ser"), name: clean, isActive: true };
  setStore(st => ({ ...st, series: [...st.series, s] }));
  return s;
};
const updateSeries = (id, patch) => setStore(st => ({
  ...st,
  series: st.series.map(s => s.id === id ? { ...s, ...patch } : s)
}));
const removeSeries = (id) => setStore(st => ({
  ...st,
  series: st.series.filter(s => s.id !== id),
  fabrics: st.fabrics.map(f => f.seriesId === id ? { ...f, seriesId: null } : f)
}));


  // ---------- Product Types ----------
const addProductType = (pt) => setStore(s => ({
  ...s,
  productTypes: [
    ...s.productTypes,
    {
      id: pt.id || uid("pt"),
      name: (pt.name || "New Product").trim(),
      defaultPrice: Number(pt.defaultPrice) || 0,
      unitLabel: (pt.unitLabel || "each").trim(),            // NEW
      packSize: Math.max(1, Number(pt.packSize) || 1),       // NEW
      isActive: pt.isActive ?? true
    }
  ]
}));

  const updateProductType = (id, patch) => setStore(s => ({
    ...s,
    productTypes: s.productTypes.map(p => p.id === id ? { ...p, ...patch } : p)
  }));
  const removeProductType = (id) => setStore(s => ({
    ...s,
    productTypes: s.productTypes.filter(p => p.id !== id)
  }));

  // ---------- Fabrics ----------
  const addFabric = (f) => setStore(s => ({
    ...s,
    fabrics: [...s.fabrics, { id: f.id || uid("f"), ...f }]
  }));
  const updateFabric = (id, patch) => setStore(s => ({
    ...s,
    fabrics: s.fabrics.map(f => f.id === id ? { ...f, ...patch } : f)
  }));
  const removeFabric = (id) => setStore(s => ({
    ...s,
    fabrics: s.fabrics.filter(f => f.id !== id)
  }));

  // ---------- Cart ----------
  const addCartLine = ({ productTypeId, name, unitPrice, qty = 1, fabricId = null }) => {
    const id = uid("line");
    setStore(s => ({
      ...s,
      cart: [...s.cart, { id, productTypeId, name, unitPrice: +unitPrice || 0, qty: +qty || 1, fabricId }]
    }));
    return id;
  };
  const updateCartLine = (id, patch) => setStore(s => ({
    ...s,
    cart: s.cart.map(l => l.id === id ? { ...l, ...patch } : l)
  }));
  const removeCartLine = (id) => setStore(s => ({ ...s, cart: s.cart.filter(l => l.id !== id) }));
  const clearCart = () => setStore(s => ({ ...s, cart: [] }));

  const cartSubtotal = useMemo(
    () => store.cart.reduce((sum, l) => sum + (+l.unitPrice || 0) * (+l.qty || 0), 0),
    [store.cart]
  );

  // ---------- Sales ----------
  const createSaleFromCart = ({ customer = "", note = "" } = {}) => {
    const order = {
      id: `SO-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customer,
      items: store.cart.map(it => ({ ...it })),
      subtotal: cartSubtotal,
      total: cartSubtotal, // add tax/discount later
      note
    };
    setStore(s => ({ ...s, sales: [order, ...s.sales], cart: [] }));
    return order;
  };
  const deleteSale = (orderId) =>
    setStore(s => ({ ...s, sales: s.sales.filter(o => o.id !== orderId) }));

  // ---------- Getters / Derived ----------
  const productTypesActive = useMemo(
    () => store.productTypes.filter(p => p.isActive),
    [store.productTypes]
  );
  const fabricsActive = useMemo(
    () => store.fabrics.filter(f => f.isActive !== false),
    [store.fabrics]
  );
  const getProductType = (id) => store.productTypes.find(p => p.id === id) || null;
  const getFabric = (id) => store.fabrics.find(f => f.id === id) || null;
  const latestSales = useMemo(() => store.sales.slice(0, 50), [store.sales]);

  // ---------- Backup / Restore ----------
  const exportJSON = () => JSON.stringify(store, null, 2);
  const importJSON = (text) => {
    try {
      const parsed = JSON.parse(text);
      const m = migrate(parsed);
      setStore({
        productTypes: m.productTypes.length ? m.productTypes : seed.productTypes,
        series:       m.series.length       ? m.series       : seed.series,
        fabrics:      m.fabrics.length      ? m.fabrics      : seed.fabrics,
        cart: m.cart || [],
        sales: m.sales || []
      });
      return true;
    } catch {
      return false;
    }
  };

  const value = {
    // raw store pieces
    store,
    productTypes: store.productTypes,
    series: store.series,
    fabrics: store.fabrics,
    cart: store.cart,
    sales: store.sales,

    // derived
    productTypesActive,
    fabricsActive,
    cartSubtotal,
    latestSales,

    // ops
    addProductType, updateProductType, removeProductType,
    addFabric, updateFabric, removeFabric,
    addCartLine, updateCartLine, removeCartLine, clearCart,
    createSaleFromCart, deleteSale,
    getProductType, getFabric, addSeries, updateSeries, removeSeries,

    // backup / restore
    exportJSON, importJSON
  };

  return <SalesCtx.Provider value={value}>{children}</SalesCtx.Provider>;
}
