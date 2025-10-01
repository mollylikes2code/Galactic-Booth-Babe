export default function DevPage() {
  return (
    <main className="grid" style={{gap:16, maxWidth:900, margin:"0 auto"}}>
      <h2>Developer Tools</h2>

      <section className="card">
        <h3>Catalog Backup / Restore</h3>
        {/* buttons you’ll wire later */}
        <div className="inline" style={{gap:8}}>
          <button className="btn">Export Catalog (JSON)</button>
          <button className="btn btn-primary">Import Catalog (JSON)</button>
        </div>
      </section>

      <section className="card">
        <h3>Import Fabrics (CSV)</h3>
        <p>Headers: <code>fabricName, series</code></p>
        <input type="file" accept=".csv" />
      </section>
    </main>
  );
}
