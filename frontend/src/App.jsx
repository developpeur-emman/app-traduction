 import { useState, useRef, useCallback } from "react";

const LANGUAGES = [
  { code: "FR", label: "Français" },
  { code: "EN-GB", label: "Anglais" },
  { code: "ES", label: "Espagnol" },
  { code: "PT-BR", label: "Portugais (Brésil)" },
  { code: "DE", label: "Allemand" },
  { code: "IT", label: "Italien" },
  { code: "AR", label: "Arabe" },
];

export default function App() {
  const [file, setFile] = useState(null);
  const [sourceLang, setSourceLang] = useState("FR");
  const [targetLang, setTargetLang] = useState("EN-GB");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".docx")) {
      setError("Seuls les fichiers .docx sont acceptés.");
      return;
    }
    setError("");
    setFile(f);
    setStatus("idle");
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const simulateTranslate = async () => {
    if (!file) return;
    setStatus("loading");
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_lang", targetLang);
    formData.append("source_lang", sourceLang);
    try {
      const response = await fetch("http://localhost:8000/translate", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Erreur traduction");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `traduit_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  const reset = () => { setFile(null); setStatus("idle"); setError(""); };

  return (
    <div style={styles.root}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        select option { background: #0d1526; }
      `}</style>
      <div style={styles.gridBg} />
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>⟁</span>
            <span style={styles.logoText}>DocTranslate</span>
          </div>
          <p style={styles.tagline}>Traduction de documents sans perte de mise en page</p>
        </div>

        <div style={styles.card}>
          <div style={styles.langRow}>
            <div style={styles.langGroup}>
              <label style={styles.label}>Langue source</label>
              <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} style={styles.select}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div style={styles.arrow}>→</div>
            <div style={styles.langGroup}>
              <label style={styles.label}>Langue cible</label>
              <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} style={styles.select}>
                {LANGUAGES.filter((l) => l.code !== sourceLang).map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <div
            style={{ ...styles.dropZone, ...(dragging ? styles.dropZoneActive : {}), ...(file ? styles.dropZoneFile : {}) }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input ref={fileInputRef} type="file" accept=".docx" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            {file ? (
              <div style={styles.fileInfo}>
                <span style={{ fontSize: 28 }}>📄</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <p style={styles.fileName}>{file.name}</p>
                  <p style={styles.fileSize}>{(file.size / 1024).toFixed(1)} Ko</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); reset(); }} style={styles.removeBtn}>✕</button>
              </div>
            ) : (
              <div>
                <div style={styles.dropIcon}>⬆</div>
                <p style={styles.dropText}>Glisse ton fichier .docx ici</p>
                <p style={styles.dropSub}>ou clique pour sélectionner</p>
              </div>
            )}
          </div>

          {error && <div style={styles.errorBox}>⚠ {error}</div>}
          {status === "done" && <div style={styles.successBox}>✓ Traduction terminée — fichier prêt au téléchargement !</div>}

          <button onClick={simulateTranslate} disabled={!file || status === "loading"} style={{ ...styles.btn, ...(!file || status === "loading" ? styles.btnDisabled : {}) }}>
            {status === "loading"
              ? <span style={styles.btnContent}><span style={styles.spinner} /> Traduction en cours...</span>
              : <span style={styles.btnContent}>⟁ Traduire le document</span>}
          </button>
        </div>

        <div style={styles.footer}>
          <div style={styles.badge}>✓ Mise en page conservée</div>
          <div style={styles.badge}>✓ DeepL Free</div>
          <div style={styles.badge}>✓ .docx → .docx</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: { minHeight: "100vh", background: "#0a0e1a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',sans-serif", position: "relative", overflow: "hidden", padding: "24px 16px" },
  gridBg: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(20,220,160,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(20,220,160,0.04) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" },
  container: { width: "100%", maxWidth: 500, position: "relative", zIndex: 1, animation: "fadeUp 0.5s ease" },
  header: { textAlign: "center", marginBottom: 28 },
  logo: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 },
  logoIcon: { fontSize: 28, color: "#14DCA0" },
  logoText: { fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" },
  tagline: { color: "#6b7a99", fontSize: 13, margin: 0 },
  card: { background: "#111827", border: "1px solid #1e2d45", borderRadius: 16, padding: "28px 24px", boxShadow: "0 0 60px rgba(20,220,160,0.06)" },
  langRow: { display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 22 },
  langGroup: { flex: 1, display: "flex", flexDirection: "column", gap: 6 },
  label: { color: "#6b7a99", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.8px" },
  select: { background: "#0d1526", border: "1px solid #1e2d45", borderRadius: 8, color: "#e2e8f0", padding: "10px 12px", fontSize: 14, cursor: "pointer", outline: "none", width: "100%" },
  arrow: { color: "#14DCA0", fontSize: 20, paddingBottom: 8, flexShrink: 0 },
  dropZone: { border: "2px dashed #1e2d45", borderRadius: 12, padding: "30px 20px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", marginBottom: 16, background: "#0d1526" },
  dropZoneActive: { borderColor: "#14DCA0", background: "rgba(20,220,160,0.05)" },
  dropZoneFile: { borderColor: "#14DCA0", borderStyle: "solid" },
  dropIcon: { fontSize: 30, color: "#2a3a5c", marginBottom: 8 },
  dropText: { color: "#e2e8f0", fontSize: 14, fontWeight: 500, margin: "0 0 4px" },
  dropSub: { color: "#4a5568", fontSize: 12, margin: 0 },
  fileInfo: { display: "flex", alignItems: "center", gap: 12 },
  fileName: { color: "#e2e8f0", fontSize: 13, fontWeight: 500, margin: "0 0 2px" },
  fileSize: { color: "#4a5568", fontSize: 12, margin: 0 },
  removeBtn: { background: "none", border: "none", color: "#4a5568", cursor: "pointer", fontSize: 16, padding: 4 },
  errorBox: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  successBox: { background: "rgba(20,220,160,0.08)", border: "1px solid rgba(20,220,160,0.2)", color: "#14DCA0", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  btn: { width: "100%", background: "linear-gradient(135deg,#14DCA0,#0ea5e9)", border: "none", borderRadius: 10, color: "#0a0e1a", fontWeight: 700, fontSize: 15, padding: "13px", cursor: "pointer", letterSpacing: "0.3px" },
  btnDisabled: { opacity: 0.3, cursor: "not-allowed" },
  btnContent: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  spinner: { display: "inline-block", width: 14, height: 14, border: "2px solid rgba(10,14,26,0.3)", borderTopColor: "#0a0e1a", borderRadius: "50%", animation: "spin 0.7s linear infinite" },
  footer: { display: "flex", justifyContent: "center", gap: 10, marginTop: 18, flexWrap: "wrap" },
  badge: { background: "rgba(20,220,160,0.06)", border: "1px solid rgba(20,220,160,0.15)", color: "#14DCA0", borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 500 },
};
