/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";

async function postJson(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || "Erreur HTTP");
  return data;
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:      "#080a09",
  panel:   "#0f1210",
  border:  "#1c201e",
  text:    "#e2e8e4",
  muted:   "#4a5450",
  dim:     "#2e3a35",
  share:   "#60a5fa",   // blue (parts)
  recover: "#2dd4bf",   // teal (reconstruct)
  accent:  "#facc15",   // yellow (params)
  code:    "#a3e635",   // lime
  error:   "#f87171",
  success: "#4ade80",
};

const mono = "'DM Mono', 'Courier New', monospace";

// ─── Reusable pieces ───────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "2px", marginBottom: "8px", fontFamily: mono }}>
    {children}
  </div>
);

const Badge = ({ color, children }) => (
  <span style={{
    display: "inline-block", padding: "1px 7px", borderRadius: "4px",
    fontSize: "9px", fontFamily: mono, letterSpacing: "1px", marginRight: "6px",
    background: color + "18", color, border: `0.5px solid ${color}44`,
  }}>
    {children}
  </span>
);

const KeyCard = ({ label, value, accent, success, error }) => {
  let borderColor = C.border;
  let titleColor = C.muted;
  if (success) { borderColor = C.success + "55"; titleColor = C.success; }
  if (error) { borderColor = C.error + "55"; titleColor = C.error; }

  return (
    <div style={{
      background: C.bg, border: `0.5px solid ${borderColor}`, borderRadius: "8px",
      padding: "12px 14px", marginBottom: "10px",
    }}>
      <div style={{ fontSize: "9px", color: titleColor, letterSpacing: "2px", marginBottom: "6px", fontFamily: mono }}>
        {label}
      </div>
      <div style={{
        fontFamily: mono, fontSize: "12px", color: error ? C.error : (accent || C.code),
        whiteSpace: "pre-line", lineHeight: 1.7, wordBreak: "break-all",
      }}>
        {value || "—"}
      </div>
    </div>
  );
};

const Divider = () => (
  <div style={{ height: "0.5px", background: C.border, margin: "14px 0" }} />
);

function StepEntry({ index, actor, children }) {
  let color = C.accent;
  if (actor === "Distribution") color = C.share;
  if (actor === "Reconstruction") color = C.recover;
  if (actor === "Système") color = C.success;
  if (actor === "Erreur") color = C.error;

  return (
    <div style={{
      display: "flex", gap: "10px", alignItems: "flex-start",
      padding: "10px 12px", marginBottom: "6px",
      background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "8px",
    }}>
      <div style={{
        width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
        background: color + "22", border: `0.5px solid ${color}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "9px", color, fontFamily: mono, fontWeight: 500,
      }}>
        {index}
      </div>
      <div style={{ fontFamily: mono, fontSize: "11px", color: C.text, lineHeight: 1.7 }}>
        <Badge color={color}>{actor}</Badge>
        {children}
      </div>
    </div>
  );
}

function Code({ children }) {
  return (
    <code style={{
      fontFamily: mono, fontSize: "11px", color: C.code,
      background: "#0a150e", border: `0.5px solid ${C.border}`,
      borderRadius: "3px", padding: "0 5px",
    }}>
      {children}
    </code>
  );
}

function ShareCard({ index, share, isSelected, onToggle }) {
  return (
    <div
      onClick={() => onToggle(index)}
      style={{
        background: isSelected ? C.recover + "11" : C.bg,
        border: `0.5px solid ${isSelected ? C.recover : C.border}`,
        borderRadius: "6px", padding: "8px 10px", cursor: "pointer",
        transition: "all 0.15s", userSelect: "none",
        display: "flex", flexDirection: "column", gap: "4px"
      }}
    >
      <div style={{ fontSize: "10px", color: isSelected ? C.recover : C.share, fontWeight: 500 }}>
        Part {index + 1}
      </div>
      <div style={{ fontSize: "11px", fontFamily: mono, color: C.text }}>
        <span style={{ color: C.muted }}>x=</span>{share.x} <br/>
        <span style={{ color: C.muted }}>y=</span>{share.y}
      </div>
    </div>
  );
}

// ─── Tool Mode ─────────────────────────────────────────────────────────────────
function ShamirToolMode() {
  const [subTab, setSubTab] = useState("split");

  const [tSecret, setTSecret] = useState("");
  const [tPrime, setTPrime] = useState("");
  const [tThreshold, setTThreshold] = useState("");
  const [tNumShares, setTNumShares] = useState("");
  const [tCoeffs, setTCoeffs] = useState("");
  const [splitResult, setSplitResult] = useState(null);

  const [rPrime, setRPrime] = useState("");
  const [rShares, setRShares] = useState("");
  const [reconstructResult, setReconstructResult] = useState(null);

  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  const inputStyle = {
    width: "100%", background: C.bg, border: `0.5px solid ${C.border}`,
    borderRadius: "6px", padding: "7px 10px", fontFamily: mono,
    fontSize: "12px", color: C.text, outline: "none", boxSizing: "border-box",
  };

  const btn = (accent, disabled) => ({
    width: "100%", padding: "9px 12px",
    border: `0.5px solid ${disabled ? C.border : accent + "55"}`,
    borderRadius: "7px", background: disabled ? C.panel : accent + "16",
    color: disabled ? C.muted : accent, fontFamily: mono, fontSize: "11px",
    cursor: disabled ? "not-allowed" : "pointer", letterSpacing: "0.5px",
    transition: "all 0.15s", fontWeight: 500,
  });

  const tabStyle = (active, accent) => ({
    flex: 1, padding: "8px 0", fontFamily: mono, fontSize: "11px", letterSpacing: "1px",
    border: `0.5px solid ${active ? accent + "55" : C.border}`,
    background: active ? accent + "14" : "transparent",
    color: active ? accent : C.muted,
    cursor: "pointer", borderRadius: "6px", transition: "all 0.15s",
  });

  const handleSplit = async () => {
    setError(""); setSplitResult(null);
    if (!tSecret || !tPrime || !tThreshold || !tNumShares) {
      setError("Les champs S, p, t et n sont requis."); return;
    }
    setLoading("split");
    
    let cList = null;
    if (tCoeffs.trim()) {
      cList = tCoeffs.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    }
    try {
      const data = await postJson("/partage-secret/shamir/split", {
        secret: parseInt(tSecret, 10),
        prime: parseInt(tPrime, 10),
        threshold: parseInt(tThreshold, 10),
        num_shares: parseInt(tNumShares, 10),
        ...(cList && cList.length > 0 ? { coefficients: cList } : {})
      });
      setSplitResult(data);
    } catch(err) { setError(err.message); }
    finally { setLoading(""); }
  };

  const handleReconstruct = async () => {
    setError(""); setReconstructResult(null);
    if (!rPrime || !rShares.trim()) { setError("p et les parts sont requis."); return; }
    
    const rawPairs = rShares.match(/\d+[\s:,\-]+\d+/g);
    if (!rawPairs) {
      setError("Format des parts invalide. Utilisez 'x,y' ou 'x:y' ou '(x, y)'."); return;
    }
    
    const sharesArr = rawPairs.map(str => {
      const match = str.match(/(\d+)[\s:,\-]+(\d+)/);
      if (match) return { x: parseInt(match[1]), y: parseInt(match[2]) };
      return null;
    }).filter(Boolean);

    if (sharesArr.length < 2) {
      setError("Au moins 2 parts sont requises."); return;
    }

    setLoading("reconstruct");
    try {
      const data = await postJson("/partage-secret/shamir/reconstruct", {
        prime: parseInt(rPrime, 10),
        shares: sharesArr
      });
      setReconstructResult(data);
    } catch(err) { setError(err.message); }
    finally { setLoading(""); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "14px", fontFamily: mono, color: C.text }}>
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button style={tabStyle(subTab === "split", C.share)} onClick={() => { setSubTab("split"); setError(""); }}>
          ⑂ CRÉER DES PARTS
        </button>
        <button style={tabStyle(subTab === "reconstruct", C.recover)} onClick={() => { setSubTab("reconstruct"); setError(""); }}>
          ⊕ RECONSTRUIRE LE SECRET
        </button>
      </div>

      {error && (
        <div style={{ background: C.error + "12", border: `0.5px solid ${C.error}44`, borderRadius: "8px", padding: "10px 14px", fontSize: "11px", color: C.error, fontFamily: mono, flexShrink: 0 }}>
          ✕ {error}
        </div>
      )}

      {subTab === "split" && (
        <div style={{ display: "flex", gap: "14px", flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto" }}>
            <div style={{ fontSize: "9px", color: C.share, letterSpacing: "2px" }}>PARAMÈTRES</div>
            <div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "5px" }}>Secret (S)</div>
              <input value={tSecret} onChange={e => setTSecret(e.target.value)} placeholder="ex: 1234" type="number" style={{ ...inputStyle, color: C.share }} />
            </div>
            <div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "5px" }}>Premier (p)</div>
              <input value={tPrime} onChange={e => setTPrime(e.target.value)} placeholder="ex: 2089" type="number" style={{ ...inputStyle, color: C.share }} />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "5px" }}>Seuil (t)</div>
                <input value={tThreshold} onChange={e => setTThreshold(e.target.value)} placeholder="ex: 3" type="number" style={{ ...inputStyle, color: C.share }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "5px" }}>Parts (n)</div>
                <input value={tNumShares} onChange={e => setTNumShares(e.target.value)} placeholder="ex: 5" type="number" style={{ ...inputStyle, color: C.share }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "5px" }}>Coefficients (optionnel)</div>
              <input value={tCoeffs} onChange={e => setTCoeffs(e.target.value)} placeholder="ex: 166, 94" style={{ ...inputStyle, color: C.text }} />
            </div>
            
            <button style={btn(C.share, loading === "split" || !tSecret || !tPrime || !tThreshold || !tNumShares)} 
              disabled={loading === "split" || !tSecret || !tPrime || !tThreshold || !tNumShares} 
              onClick={handleSplit}>
              {loading === "split" ? "⟳ création..." : "Créer les parts"}
            </button>
          </div>

          <div style={{ flex: 1, background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ fontSize: "9px", color: C.share, letterSpacing: "2px", marginBottom: "14px" }}>RÉSULTAT</div>
            {splitResult ? (
              <>
                <Label>POLYNÔME</Label>
                <div style={{ background: C.bg, border: `0.5px solid ${C.share}55`, borderRadius: "8px", padding: "10px 14px", fontFamily: mono, fontSize: "12px", color: C.share, marginBottom: "14px", wordBreak: "break-all" }}>
                  {splitResult.polynomial}
                </div>
                <Label>PARTS GÉNÉRÉES</Label>
                <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: "8px", padding: "10px 14px", fontFamily: mono, fontSize: "11px", color: C.text, display: "grid", gap: "6px" }}>
                  {splitResult.shares.map((s, i) => (
                    <div key={i}><span style={{ color: C.muted }}>{s.x} : </span> {s.y}</div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: C.dim }}>Les parts apparaîtront ici.</div>
            )}
          </div>
        </div>
      )}

      {subTab === "reconstruct" && (
        <div style={{ display: "flex", gap: "14px", flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto" }}>
            <div style={{ fontSize: "9px", color: C.recover, letterSpacing: "2px" }}>PARAMÈTRES</div>
            <div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "5px" }}>Premier (p)</div>
              <input value={rPrime} onChange={e => setRPrime(e.target.value)} placeholder="ex: 2089" type="number" style={{ ...inputStyle, color: C.recover }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "5px" }}>Parts (ex: 1:456, 2:789)</div>
              <textarea value={rShares} onChange={e => setRShares(e.target.value)} placeholder="(1, 234)\n(2, 567)\n..." style={{ flex: 1, ...inputStyle, resize: "none", lineHeight: 1.6, color: C.text }} />
            </div>
            
            <button style={btn(C.recover, loading === "reconstruct" || !rPrime || !rShares.trim())} 
              disabled={loading === "reconstruct" || !rPrime || !rShares.trim()} 
              onClick={handleReconstruct}>
              {loading === "reconstruct" ? "⟳ calcul..." : "Reconstruire"}
            </button>
          </div>

          <div style={{ flex: 1, background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ fontSize: "9px", color: C.recover, letterSpacing: "2px", marginBottom: "14px" }}>RÉSULTAT</div>
            {reconstructResult ? (
              <>
                <Label>SECRET (S)</Label>
                <div style={{ background: C.bg, border: `0.5px solid ${C.success}55`, borderRadius: "8px", padding: "14px", fontFamily: mono, fontSize: "20px", color: C.success, letterSpacing: "4px", marginBottom: "14px", textAlign: "center" }}>
                  {reconstructResult.secret}
                </div>
                <Label>TERMES DE LAGRANGE</Label>
                <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: "8px", padding: "10px 14px", fontFamily: mono, fontSize: "10px", color: C.muted, whiteSpace: "pre-wrap" }}>
                  {reconstructResult.lagrange_terms.map((t, idx) => (
                    <div key={idx}><span style={{ color: C.recover }}>x={t.x}:</span> λ={t.lagrange_coefficient} → {t.term}</div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: C.dim }}>Le secret apparaîtra ici.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ShamirSecretDemo() {
  const [mode, setMode] = useState("sim"); // 'sim' | 'tool'
  const [secret, setSecret] = useState("1234");
  const [prime, setPrime] = useState("2089");
  const [threshold, setThreshold] = useState("3");
  const [numShares, setNumShares] = useState("5");
  const [coeffs, setCoeffs] = useState("166, 94");

  const [splitData, setSplitData] = useState(null);
  const [selectedShares, setSelectedShares] = useState(new Set());
  const [reconstructData, setReconstructData] = useState(null);

  const [steps, setSteps] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  const logRef = useRef(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [steps]);

  const addStep = (actor, content) => setSteps((s) => [...s, { actor, content }]);

  const resetAll = () => {
    setSplitData(null);
    setSelectedShares(new Set());
    setReconstructData(null);
    setSteps([]);
    setStatus("");
    setError("");
  };

  const handleSplit = async () => {
    if (!secret || !prime || !threshold || !numShares) {
      setError("Les champs S, p, t et n sont requis.");
      return;
    }
    setLoading("split"); setError(""); setStatus(""); resetAll();

    let cList = null;
    if (coeffs.trim()) {
      cList = coeffs.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    }

    try {
      const data = await postJson("/partage-secret/shamir/split", {
        secret: parseInt(secret, 10),
        prime: parseInt(prime, 10),
        threshold: parseInt(threshold, 10),
        num_shares: parseInt(numShares, 10),
        ...(cList && cList.length > 0 ? { coefficients: cList } : {})
      });
      setSplitData(data);
      
      // Auto-select first t shares
      const initialSelection = new Set();
      for (let i = 0; i < data.threshold; i++) initialSelection.add(i);
      setSelectedShares(initialSelection);

      setStatus(`Polynôme généré : ${data.polynomial}`);
      addStep("Distribution", <>Secret placé en <Code>f(0) = {data.secret}</Code>.</>);
      addStep("Distribution", <>Génération du polynôme de degré <Code>{data.threshold - 1}</Code> : <Code>{data.polynomial}</Code>.</>);
      addStep("Distribution", <><Code>{data.num_shares}</Code> parts calculées.</>);
      addStep("Système", <>Sélectionnez au moins <Code>t={data.threshold}</Code> parts pour reconstruire le secret.</>);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  const toggleShare = (index) => {
    setSelectedShares(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    setReconstructData(null); // invalidate previous reconstruction
    setStatus("");
    setError("");
  };

  const handleReconstruct = async () => {
    if (!splitData) return;
    
    const sharesArr = Array.from(selectedShares).sort((a,b) => a-b).map(i => splitData.shares[i]);
    if (sharesArr.length < splitData.threshold) {
      setError(`Il faut sélectionner au moins ${splitData.threshold} parts.`);
      return;
    }

    setLoading("reconstruct"); setError(""); setStatus(""); setReconstructData(null);
    try {
      const data = await postJson("/partage-secret/shamir/reconstruct", {
        prime: splitData.prime,
        shares: sharesArr
      });
      setReconstructData(data);

      const isMatch = data.secret === splitData.secret;
      setStatus(isMatch ? "Secret reconstruit avec succès !" : "Le secret reconstruit est différent.");
      
      addStep("Reconstruction", <>Interpolation avec <Code>{sharesArr.length}</Code> parts sélectionnées.</>);
      addStep("Reconstruction", <>Somme des termes de Lagrange mod <Code>{data.prime}</Code> = <Code>{data.secret}</Code>.</>);
      if (isMatch) {
        addStep("Système", <>Succès : Le secret reconstitué correspond au secret d'origine.</>);
      } else {
        addStep("Erreur", <>Échec : Le secret reconstitué ({data.secret}) ne correspond pas ({splitData.secret}).</>);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  const btn = (accent, disabled) => ({
    width: "100%", padding: "9px 12px", border: `0.5px solid ${disabled ? C.border : accent + "55"}`,
    borderRadius: "7px", background: disabled ? C.panel : accent + "16",
    color: disabled ? C.muted : accent, fontFamily: mono, fontSize: "11px",
    cursor: disabled ? "not-allowed" : "pointer", letterSpacing: "0.5px",
    transition: "all 0.15s", fontWeight: 500,
  });

  const inputStyle = {
    width: "100%", background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: "6px",
    padding: "7px 10px", fontFamily: mono, fontSize: "12px", color: C.text, outline: "none", boxSizing: "border-box"
  };

  const modeTabStyle = (active, accent) => ({
    padding: "6px 18px", fontFamily: mono, fontSize: "10px", letterSpacing: "1.5px",
    border: `0.5px solid ${active ? accent + "66" : C.border}`,
    background: active ? accent + "16" : "transparent",
    color: active ? accent : C.muted,
    cursor: "pointer", borderRadius: "6px", transition: "all 0.15s",
  });

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      gap: "14px", fontFamily: mono, color: C.text, overflow: "hidden",
    }}>

      {/* ── Mode switcher ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
        <button style={modeTabStyle(mode === "sim", C.share)} onClick={() => setMode("sim")}>
          SIMULATION
        </button>
        <button style={modeTabStyle(mode === "tool", C.recover)} onClick={() => setMode("tool")}>
          OUTIL
        </button>
        <div style={{ marginLeft: "auto", fontSize: "9px", color: C.dim, letterSpacing: "1px" }}>
          {mode === "sim" ? "Distribution et reconstruction interactive" : "Création de parts / Reconstruction directe"}
        </div>
      </div>

      {mode === "tool" && <ShamirToolMode />}
      {mode !== "tool" && <>

      {/* ── Row 1: Setup / Distribution / Recovery ─────────────────────────── */}
      <div style={{ display: "flex", gap: "14px", flex: 1, minHeight: 0 }}>

        {/* LEFT — Params */}
        <div style={{
          width: "240px", flexShrink: 0, background: C.panel,
          border: `0.5px solid ${C.border}`, borderRadius: "10px",
          padding: "16px", display: "flex", flexDirection: "column", overflowY: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
              background: C.accent + "18", border: `0.5px solid ${C.accent}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", color: C.accent, fontWeight: 500,
            }}>⚙</div>
            <div>
              <div style={{ fontSize: "12px", color: C.accent, fontWeight: 500 }}>Paramètres</div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px" }}>Initialisation</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <div style={{ flex: 1 }}>
              <Label>SECRET (S)</Label>
              <input type="number" min="0" value={secret} onChange={(e) => setSecret(e.target.value)} style={{ ...inputStyle, color: C.accent }} />
            </div>
            <div style={{ flex: 1 }}>
              <Label>PREMIER (p)</Label>
              <input type="number" min="3" value={prime} onChange={(e) => setPrime(e.target.value)} style={{ ...inputStyle, color: C.accent }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <div style={{ flex: 1 }}>
              <Label>SEUIL (t)</Label>
              <input type="number" min="2" value={threshold} onChange={(e) => setThreshold(e.target.value)} style={{ ...inputStyle, color: C.accent }} />
            </div>
            <div style={{ flex: 1 }}>
              <Label>PARTS (n)</Label>
              <input type="number" min="2" value={numShares} onChange={(e) => setNumShares(e.target.value)} style={{ ...inputStyle, color: C.accent }} />
            </div>
          </div>

          <Label>COEFFICIENTS (optionnel)</Label>
          <input 
            type="text" value={coeffs} onChange={(e) => setCoeffs(e.target.value)} 
            placeholder="ex: 166, 94"
            style={{ ...inputStyle, color: C.text, marginBottom: "14px" }} 
          />
          
          <button style={btn(C.share, loading === "split")} disabled={loading === "split"} onClick={handleSplit}>
            {loading === "split" ? "⟳ création..." : "Créer les parts"}
          </button>

          {(status || error) && (
            <div style={{
              marginTop: "14px", fontSize: "10px", letterSpacing: "0.5px", lineHeight: 1.6,
              color: error ? C.error : C.muted, wordBreak: "break-all",
            }}>
              {error ? `✕ ${error}` : status}
            </div>
          )}
        </div>

        {/* CENTER — Distribution */}
        <div style={{ 
          flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
          borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", overflowY: "auto", minWidth: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
              background: C.share + "18", border: `0.5px solid ${C.share}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "14px", color: C.share, fontWeight: 500,
            }}>⑂</div>
            <div>
              <div style={{ fontSize: "12px", color: C.share, fontWeight: 500 }}>Distribution</div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px" }}>Polynôme et parts</div>
            </div>
          </div>

          <Label>POLYNÔME f(x)</Label>
          <KeyCard
            label={`Degré ${splitData ? splitData.threshold - 1 : "?"}`}
            value={splitData ? splitData.polynomial : "—"}
            accent={C.share}
          />

          <Divider />

          <Label>PARTS GÉNÉRÉES (cliquez pour sélectionner)</Label>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px"
          }}>
            {splitData ? splitData.shares.map((share, i) => (
              <ShareCard 
                key={i} index={i} share={share} 
                isSelected={selectedShares.has(i)}
                onToggle={toggleShare}
              />
            )) : (
              <div style={{ fontSize: "11px", color: C.dim, padding: "10px 0" }}>Aucune part générée.</div>
            )}
          </div>
        </div>

        {/* RIGHT — Recovery */}
        <div style={{
          width: "280px", flexShrink: 0, background: C.panel,
          border: `0.5px solid ${C.border}`, borderRadius: "10px",
          padding: "16px", display: "flex", flexDirection: "column", overflowY: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
              background: C.recover + "18", border: `0.5px solid ${C.recover}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", color: C.recover, fontWeight: 500,
            }}>⊕</div>
            <div>
              <div style={{ fontSize: "12px", color: C.recover, fontWeight: 500 }}>Reconstruction</div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px" }}>Interpolation de Lagrange</div>
            </div>
          </div>

          <Label>PARTS SÉLECTIONNÉES ({selectedShares.size}/{splitData ? splitData.threshold : "?"})</Label>
          <div style={{
            background: C.bg, border: `0.5px solid ${selectedShares.size >= (splitData?.threshold || 99) ? C.recover + "55" : C.border}`, 
            borderRadius: "8px", padding: "10px", marginBottom: "14px",
            fontFamily: mono, fontSize: "11px", color: C.text, minHeight: "60px"
          }}>
            {selectedShares.size > 0 ? (
              Array.from(selectedShares).sort((a,b) => a-b).map(i => splitData.shares[i]).map((s, idx) => (
                <div key={idx}>({s.x}, {s.y})</div>
              ))
            ) : <span style={{color: C.dim}}>—</span>}
          </div>

          <button 
            style={{...btn(C.recover, !splitData || selectedShares.size < splitData.threshold || loading === "reconstruct"), marginBottom: "14px"}} 
            disabled={!splitData || selectedShares.size < splitData.threshold || loading === "reconstruct"} 
            onClick={handleReconstruct}
          >
            {loading === "reconstruct" ? "⟳ calcul..." : "Reconstruire"}
          </button>

          <Label>TERMES DE LAGRANGE</Label>
          <div style={{
            background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: "8px", 
            padding: "10px", marginBottom: "14px", overflowX: "auto",
            fontFamily: mono, fontSize: "10px", color: C.muted, minHeight: "60px",
            whiteSpace: "pre"
          }}>
            {reconstructData ? reconstructData.lagrange_terms.map((t, idx) => (
              <div key={idx}><span style={{color: C.recover}}>x={t.x}:</span> λ={t.lagrange_coefficient} → {t.term}</div>
            )) : "—"}
          </div>

          <Label>SECRET RECONSTRUIT</Label>
          <KeyCard
            label="S = f(0)"
            value={reconstructData ? reconstructData.secret : "—"}
            accent={C.recover}
            success={reconstructData && reconstructData.secret === splitData?.secret}
            error={reconstructData && reconstructData.secret !== splitData?.secret}
          />
        </div>
      </div>

      {/* ── Row 2: step log ──────────────────────────────────────────────────── */}
      <div style={{
        background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px",
        padding: "14px 16px", height: "220px", display: "flex", flexDirection: "column", flexShrink: 0
      }}>
        <Label>JOURNAL DES ÉTAPES — PARTAGE DE SECRET</Label>
        <div ref={logRef} style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          {steps.length === 0 ? (
            <div style={{ fontSize: "11px", color: C.dim, fontFamily: mono, padding: "8px 0" }}>
              Configurez les paramètres et créez les parts pour commencer...
            </div>
          ) : (
            steps.map((s, i) => (
              <StepEntry key={i} index={i + 1} actor={s.actor}>
                {s.content}
              </StepEntry>
            ))
          )}
        </div>
      </div>
      </>}
    </div>
  );
}
