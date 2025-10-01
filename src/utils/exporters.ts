// src/utils/exporters.ts
// Helpers for building export rows, creating CSVs, and posting to a Google Apps Script endpoint.

// ---------- Types ----------
export type EventInfo = {
  id: string;
  name: string;
  startedAt: string;   // ISO
  endedAt?: string | null;
  location?: string | null;
};

export type SaleLine = {
  id?: string;
  name?: string;
  productName?: string;
  unitPrice?: number;
  price?: number;
  qty?: number;
  quantity?: number;
  fabricName?: string | null;
};

export type Sale = {
  id?: string;
  eventId?: string | null;
  eventName?: string | null;
  salesOrderNumber?: string;
  subtotal?: number;
  total?: number;

  // timestamps (any that exists)
  recordedAtISO?: string;
  createdAtISO?: string;
  createdAt?: string;
  timestampISO?: string;
  timestamp?: string;
  date?: string;

  // items
  lines?: SaleLine[];
  items?: SaleLine[];
  note?: string | null;
};

export type Row = {
  eventName: string;
  eventId: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:MM (24h)
  timestampISO: string;  // full ISO
  salesOrderNumber: string;
  total: number;
  itemsList: string;
  itemsJSON: string;
  notes?: string | null;
};

export type SheetConfig = {
  endpointUrl: string;    // Apps Script deployed web app URL
  sheetId?: string;       // optional: override spreadsheet ID
  sheetName?: string;     // optional: override tab name (default: "Sales")
  authToken?: string;     // optional: bearer token checked by Apps Script
};

export const defaultSheetConfig: SheetConfig = {
  endpointUrl: "",        // set later in Settings or via .env
  sheetName: "Sales",
  authToken: "",
};

// ---------- Helpers ----------
const pad2 = (n: number) => String(n).padStart(2, "0");

export function buildSalesOrderNumber(eventName: string, whenISO: string) {
  const d = new Date(whenISO);
  const y = d.getFullYear() % 100;
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  const slug =
    String(eventName || "Event")
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .slice(0, 40) || "Event";
  return `${slug}-${y}${m}${day}-${hh}${mm}`;
}

function humanItems(lines: SaleLine[] = []): string {
  return lines
    .map((l) => {
      const name = l.name || l.productName || "Item";
      const qty = l.qty ?? l.quantity ?? 1;
      const fabric = l.fabricName ? ` — ${l.fabricName}` : "";
      return `${qty}× ${name}${fabric}`;
    })
    .join(" • ");
}

export function buildRowsForEvent(evt: EventInfo, sales: Sale[]): Row[] {
  const rows: Row[] = [];
  for (const s of sales) {
    const ts =
      s.recordedAtISO ||
      s.createdAtISO ||
      s.timestampISO ||
      s.createdAt ||
      s.timestamp ||
      s.date ||
      new Date().toISOString();

    const d = new Date(ts);
    const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    const orderNo = s.salesOrderNumber || buildSalesOrderNumber(evt.name, ts);
    const lines = s.lines || s.items || [];

    rows.push({
      eventName: evt.name,
      eventId: evt.id,
      date,
      time,
      timestampISO: new Date(ts).toISOString(),
      salesOrderNumber: orderNo,
      total: Number(s.total ?? s.subtotal ?? 0),
      itemsList: humanItems(lines),
      itemsJSON: JSON.stringify(lines),
      notes: s.note ?? null,
    });
  }
  return rows;
}

export function toCSV(rows: Row[]): string {
  const headers = [
    "eventName",
    "eventId",
    "date",
    "time",
    "timestampISO",
    "salesOrderNumber",
    "total",
    "itemsList",
    "itemsJSON",
    "notes",
  ];
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.eventName,
        r.eventId,
        r.date,
        r.time,
        r.timestampISO,
        r.salesOrderNumber,
        r.total,
        r.itemsList,
        r.itemsJSON,
        r.notes ?? "",
      ]
        .map(esc)
        .join(",")
    );
  }
  return lines.join("\n");
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- ONE implementation of postToSheetBatch ----------
export async function postToSheetBatch(rows: Row[], cfg: SheetConfig) {
  if (!cfg?.endpointUrl) {
    throw new Error("Missing endpointUrl for Google Sheet exporter.");
  }

  const payload = {
    rows,
    sheetId: cfg.sheetId || undefined,
    sheetName: cfg.sheetName || "Sales",
  };

  const res = await fetch(cfg.endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cfg.authToken ? { Authorization: `Bearer ${cfg.authToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Sheets export failed: ${res.status} ${res.statusText} — ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return { ok: true, text };
  }
}
