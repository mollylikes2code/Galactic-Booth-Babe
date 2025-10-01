// src/components/BackupButtons.jsx
import { useSales } from "@/state/sales.jsx";

export default function BackupButtons() {
  const { exportJSON, importJSON } = useSales();

  const download = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "gbb-backup.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const upload = async () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "application/json";
    input.onchange = async (e) => {
      const file = e.target.files?.[0]; if (!file) return;
      const text = await file.text();
      const ok = importJSON(text);
      alert(ok ? "Imported!" : "Import failed (bad JSON).");
    };
    input.click();
  };

  return (
    <div className="inline">
      <button className="btn" onClick={download}>Backup</button>
      <button className="btn btn-primary" onClick={upload}>Restore</button>
    </div>
  );
}
