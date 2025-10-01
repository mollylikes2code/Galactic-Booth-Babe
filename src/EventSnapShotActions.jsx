// EventSnapshotActions.jsx
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useState, useRef } from "react";
import { toast } from "@/ui/toast"; // or your own

export default function EventSnapshotActions({ eventId }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef(null); // points at hidden snapshot DOM

  const recordAndDownloadPDF = async () => {
    if (busy) return;
    setBusy(true);

    try {
      // 1) build rollup on client or fetch from server
      const rollup = await buildEventRollup(eventId); // your function

      // 2) persist immutable snapshot (no user click)
      const saved = await saveSnapshot(rollup); // POST -> returns {id, slug, ...}

      // 3) render hidden snapshot into DOM for capture
      await renderHiddenSnapshot(ref, saved); // set state to show hidden DOM

      // 4) rasterize -> PDF
      const node = ref.current;
      const canvas = await html2canvas(node, { scale: window.devicePixelRatio || 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      const x = (pageW - w) / 2;
      const y = 24;

      pdf.addImage(imgData, "PNG", x, y, w, h, "", "FAST");
      const fname = `${saved.event.name.replaceAll(" ","")}_${saved.event.date}_${saved.event.location.replaceAll(" ","")}_snapshot.pdf`;
      pdf.save(fname);

      toast.success("Snapshot saved and PDF downloaded.");
    } catch (e) {
      console.error(e);
      toast.error("Couldn’t create snapshot. Try again.");
    } finally {
      setBusy(false);
      hideHiddenSnapshot(); // unmount hidden DOM
    }
  };

  return (
    <>
      <button className="btn btn-primary" onClick={recordAndDownloadPDF} disabled={busy}>
        {busy ? "Preparing…" : "Download PDF"}
      </button>

      {/* Hidden printable snapshot DOM */}
      <div ref={ref} style={{ position:"fixed", top:-9999, left:-9999 }}>
        <EventSnapshotView dataSource="snapshotState" />
      </div>
    </>
  );
}
