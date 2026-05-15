import { useState, useCallback } from "react";
import RsaDemo from "./RsaDemo.jsx";
import ElGamalDemo from "./ElGamalDemo.jsx";
import RsaSignatureDemo from "./RsaSignatureDemo.jsx";
import DiffieHellmanDemo from "./DiffieHellmanDemo.jsx";
import ShamirSecretDemo from "./ShamirSecretDemo.jsx";

const API_BASE = "http://localhost:5000/api";

async function callBackend(algoId, mode, inputText, keyValues) {
  const isEncrypt = mode === "chiffrer";
  let url = "";
  let body = {};

  switch (algoId) {
    case "cesar":
      url = `${API_BASE}/caesar/${isEncrypt ? "encrypt" : "decrypt"}`;
      body = { text: inputText, key: parseInt(keyValues.k) || 0 };
      break;
    case "affine":
      url = `${API_BASE}/affine/${isEncrypt ? "encrypt" : "decrypt"}`;
      body = { text: inputText, a: parseInt(keyValues.a) || 1, b: parseInt(keyValues.b) || 0 };
      break;
    case "vigenere":
      url = `${API_BASE}/vigenere/${isEncrypt ? "encrypt" : "decrypt"}`;
      body = { text: inputText, key: keyValues.key || "" };
      break;
    case "hill":
      url = `${API_BASE}/hill/${isEncrypt ? "encrypt" : "decrypt"}`;
      body = {
        text: inputText,
        key_matrix: [
          [parseInt(keyValues.a11) || 1, parseInt(keyValues.a12) || 2],
          [parseInt(keyValues.a21) || 3, parseInt(keyValues.a22) || 4],
        ],
      };
      break;
    case "playfair":
      url = `${API_BASE}/playfair/${isEncrypt ? "encrypt" : "decrypt"}`;
      body = { text: inputText, key: keyValues.key || "" };
      break;
    default:
      throw new Error("Algorithme non supporté");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erreur serveur");
  return data.ciphertext ?? data.plaintext ?? "";
}

const ALGORITHMS = {
  classique: [
    { id: "cesar", name: "César", sub: "Décalage simple", color: "#4ade80", keyFields: [{ id: "k", label: "Décalage (k)", placeholder: "ex: 3", hint: "0 – 25" }] },
    { id: "affine", name: "Affine", sub: "ax + b mod 26", color: "#60a5fa", keyFields: [{ id: "a", label: "Coefficient a", placeholder: "ex: 5", hint: "Copremier avec 26" }, { id: "b", label: "Décalage b", placeholder: "ex: 8", hint: "0 – 25" }] },
    { id: "vigenere", name: "Vigenère", sub: "Clé alphabétique", color: "#a78bfa", keyFields: [{ id: "key", label: "Mot-clé", placeholder: "ex: SECRET", hint: "Lettres seulement" }] },
    { id: "hill", name: "Hill", sub: "Matrice 2×2", color: "#f97316", keyFields: [{ id: "a11", label: "a", placeholder: "1", hint: "" }, { id: "a12", label: "b", placeholder: "2", hint: "" }, { id: "a21", label: "c", placeholder: "3", hint: "" }, { id: "a22", label: "d", placeholder: "4", hint: "det(M) ≠ 0 mod 26" }] },
    { id: "playfair", name: "Playfair", sub: "Grille 5×5", color: "#f472b6", keyFields: [{ id: "key", label: "Mot-clé", placeholder: "ex: MONARCHY", hint: "Grille 5×5 générée" }] },
  ],
  symetrique: [
    { id: "des", name: "DES", sub: "64-bit block", color: "#22d3ee", keyFields: [{ id: "key", label: "Clé (hex 64-bit)", placeholder: "133457799BBCDFF1", hint: "Bientôt disponible" }], comingSoon: true },
    { id: "aes", name: "AES", sub: "128 / 256-bit", color: "#34d399", keyFields: [{ id: "key", label: "Clé", placeholder: "0123456789ABCDEF...", hint: "Bientôt disponible" }], comingSoon: true },
  ],
  asymetrique: [
    { id: "rsa", name: "RSA", sub: "Clé publique", color: "#facc15", keyFields: [] },
    { id: "elgamal", name: "ElGamal", sub: "Logarithme discret", color: "#fb923c", keyFields: [] },
    { id: "rsa-signature", name: "RSA Signature", sub: "Signer & vérifier", color: "#a78bfa", keyFields: [] },
  ],
  partage: [
    { id: "diffie-hellman", name: "Diffie-Hellman", sub: "Échange de clés", color: "#ec4899", keyFields: [] },
    { id: "shamir", name: "Shamir", sub: "Partage de secret", color: "#60a5fa", keyFields: [] },
  ],
};

const GROUP_LABELS = { classique: "CRYPTO CLASSIQUE", symetrique: "CRYPTO SYMÉTRIQUE", asymetrique: "CRYPTO ASYMÉTRIQUE", partage: "PARTAGE DE SECRET" };
const findGroup = (id) => Object.keys(ALGORITHMS).find((k) => ALGORITHMS[k].some((a) => a.id === id));

export default function App() {
  const [activeAlgo, setActiveAlgo] = useState(ALGORITHMS.classique[0]);
  const [mode, setMode] = useState("chiffrer");
  const [inputText, setInputText] = useState("");
  const [keyValues, setKeyValues] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleAlgoSelect = useCallback((algo) => {
    setActiveAlgo(algo); setKeyValues({}); setResult(null); setError(null); setInputText("");
  }, []);

  const handleKeyChange = useCallback((id, val) => {
    setKeyValues((prev) => ({ ...prev, [id]: val }));
  }, []);

  const handleAction = async () => {
    if (!inputText.trim() || activeAlgo.comingSoon) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const text = await callBackend(activeAlgo.id, mode, inputText, keyValues);
      setResult({ text, status: "success" });
    } catch (err) {
      setError(err.message);
      setResult({ text: "", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
    }
  };

  const handleClear = () => { setInputText(""); setKeyValues({}); setResult(null); setError(null); };

  const ac = activeAlgo.color;
  const isHill = activeAlgo.id === "hill";
  const isRsaDemo = activeAlgo.id === "rsa";
  const isElGamalDemo = activeAlgo.id === "elgamal";
  const isRsaSigDemo = activeAlgo.id === "rsa-signature";
  const isDiffieHellmanDemo = activeAlgo.id === "diffie-hellman";
  const isShamirDemo = activeAlgo.id === "shamir";

  const inputStyle = { width: "100%", background: "#0a0c0b", border: "0.5px solid #1c201e", borderRadius: "6px", padding: "7px 10px", fontFamily: "inherit", fontSize: "12px", color: "#e2e8e4", outline: "none" };
  const labelStyle = { fontSize: "9px", color: "#2e3a35", letterSpacing: "2px", marginBottom: "10px" };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; }
        body { background: #080a09; font-family: 'DM Mono', 'Courier New', monospace; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #1c201e; border-radius: 2px; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", width: "100vw", background: "#080a09" }}>

        {/* SIDEBAR */}
        <div style={{ width: "220px", background: "#0f1210", borderRight: "0.5px solid #1c201e", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "24px 18px 16px", borderBottom: "0.5px solid #1c201e" }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "#e2e8e4", letterSpacing: "3px" }}>CRYPTO</div>
            <div style={{ fontSize: "9px", color: "#3a4440", letterSpacing: "2px", marginTop: "3px" }}>SUITE / v2.0</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 10px" }}>
            {Object.entries(ALGORITHMS).map(([gk, algos]) => (
              <div key={gk} style={{ marginBottom: "22px" }}>
                <div style={{ fontSize: "9px", color: "#2a3530", letterSpacing: "2px", marginBottom: "6px", padding: "0 6px" }}>{GROUP_LABELS[gk]}</div>
                {algos.map((algo) => {
                  const active = activeAlgo.id === algo.id;
                  return (
                    <div key={algo.id} onClick={() => handleAlgoSelect(algo)}
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "7px", cursor: "pointer", marginBottom: "2px", background: active ? "#161c19" : "transparent", opacity: algo.comingSoon ? 0.45 : 1, transition: "background 0.12s" }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#131815"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: algo.color, flexShrink: 0, boxShadow: active ? `0 0 8px ${algo.color}99` : "none" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", color: active ? "#e2e8e4" : "#6a7870", fontWeight: 500 }}>
                          {algo.name}{algo.comingSoon && <span style={{ fontSize: "8px", color: "#3a4440", marginLeft: "6px" }}>bientôt</span>}
                        </div>
                        <div style={{ fontSize: "10px", color: "#3a4440", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{algo.sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#0d0f0e" }}>

          {/* TOPBAR */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "0.5px solid #1c201e", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e88" }} />
              <div>
                <div style={{ fontSize: "15px", color: "#e2e8e4", fontWeight: 500 }}>
                  Chiffrement {activeAlgo.name}
                  {activeAlgo.comingSoon && <span style={{ fontSize: "11px", color: "#3a4440", marginLeft: "10px", fontWeight: 400 }}>— bientôt disponible</span>}
                </div>
                <div style={{ fontSize: "10px", color: "#3a4440", marginTop: "2px" }}>{GROUP_LABELS[findGroup(activeAlgo.id)]} · {activeAlgo.sub}</div>
              </div>
            </div>
            {!isRsaDemo && !isElGamalDemo && !isRsaSigDemo && !isDiffieHellmanDemo && !isShamirDemo && (
            <div style={{ display: "flex", background: "#161c19", borderRadius: "8px", padding: "3px", gap: "2px" }}>
              {["chiffrer", "dechiffrer"].map((m) => (
                <button key={m} onClick={() => { setMode(m); setResult(null); setError(null); }}
                  style={{ padding: "6px 18px", borderRadius: "6px", fontSize: "11px", fontFamily: "inherit", cursor: "pointer", border: "none", fontWeight: 500, letterSpacing: "0.5px", background: mode === m ? "#1f3028" : "transparent", color: mode === m ? ac : "#3a4440", transition: "all 0.15s" }}>
                  {m === "chiffrer" ? "↑ Chiffrer" : "↓ Déchiffrer"}
                </button>
              ))}
            </div>
            )}
          </div>

          {/* CONTENT */}
          <div style={{ flex: 1, padding: "20px 28px", display: "flex", flexDirection: "column", gap: "14px", overflow: "hidden" }}>
            {isRsaDemo ? (
              <RsaDemo />
            ) : isElGamalDemo ? (
              <ElGamalDemo />
            ) : isRsaSigDemo ? (
              <RsaSignatureDemo />
            ) : isDiffieHellmanDemo ? (
              <DiffieHellmanDemo />
            ) : isShamirDemo ? (
              <ShamirSecretDemo />
            ) : (
              <>

            {/* PANELS */}
            <div style={{ display: "flex", gap: "14px", flex: 1, minHeight: 0 }}>

              {/* Text panel */}
              <div style={{ flex: 1, background: "#0f1210", border: "0.5px solid #1c201e", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column" }}>
                <div style={labelStyle}>{mode === "chiffrer" ? "TEXTE CLAIR" : "TEXTE CHIFFRÉ"}</div>
                <textarea
                  value={inputText} onChange={(e) => setInputText(e.target.value)}
                  placeholder={mode === "chiffrer" ? "Entrez votre texte ici..." : "Entrez le texte chiffré..."}
                  disabled={activeAlgo.comingSoon}
                  style={{ flex: 1, background: "#0a0c0b", border: "0.5px solid #1c201e", borderRadius: "7px", padding: "12px", fontFamily: "inherit", fontSize: "13px", color: ac, resize: "none", outline: "none", lineHeight: 1.6, opacity: activeAlgo.comingSoon ? 0.4 : 1 }}
                />
                <div style={{ fontSize: "10px", color: "#2e3a35", marginTop: "8px", textAlign: "right" }}>{inputText.length} caractères</div>
              </div>

              {/* Key panel */}
              <div style={{ width: "200px", background: "#0f1210", border: "0.5px solid #1c201e", borderRadius: "10px", padding: "16px", flexShrink: 0, overflowY: "auto" }}>
                <div style={labelStyle}>CLÉ — {activeAlgo.name.toUpperCase()}</div>
                {isHill ? (
                  <>
                    <div style={{ fontSize: "10px", color: "#4a5450", marginBottom: "10px" }}>Matrice 2×2</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      {activeAlgo.keyFields.map((f) => (
                        <div key={f.id}>
                          <div style={{ fontSize: "9px", color: "#3a4440", marginBottom: "4px" }}>{f.label}</div>
                          <input value={keyValues[f.id] || ""} onChange={(e) => handleKeyChange(f.id, e.target.value)} placeholder={f.placeholder} style={{ ...inputStyle, textAlign: "center", padding: "6px 4px" }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: "9px", color: "#2e3a35" }}>det(M) ≠ 0 mod 26</div>
                  </>
                ) : (
                  activeAlgo.keyFields.map((f) => (
                    <div key={f.id} style={{ marginBottom: "14px" }}>
                      <div style={{ fontSize: "10px", color: "#4a5450", marginBottom: "6px" }}>{f.label}</div>
                      <input value={keyValues[f.id] || ""} onChange={(e) => handleKeyChange(f.id, e.target.value)} placeholder={f.placeholder} disabled={activeAlgo.comingSoon} style={{ ...inputStyle, opacity: activeAlgo.comingSoon ? 0.4 : 1 }} />
                      {f.hint && <div style={{ fontSize: "9px", color: "#2e3a35", marginTop: "4px" }}>{f.hint}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#1a0f0f", border: "0.5px solid #4a1a1a", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#f87171", flexShrink: 0 }}>
                ✕ {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
              <button onClick={handleAction} disabled={loading || activeAlgo.comingSoon || !inputText.trim()}
                style={{ flex: 1, padding: "12px", background: loading ? "#0f2018" : "#152a1e", border: `0.5px solid ${ac}44`, borderRadius: "8px", fontFamily: "inherit", fontSize: "13px", color: (loading || activeAlgo.comingSoon || !inputText.trim()) ? ac + "55" : ac, cursor: (loading || activeAlgo.comingSoon || !inputText.trim()) ? "not-allowed" : "pointer", fontWeight: 500, letterSpacing: "0.5px", transition: "all 0.15s" }}>
                {loading ? "⟳ En cours..." : mode === "chiffrer" ? "⇒ Chiffrer" : "⇐ Déchiffrer"}
              </button>
              <button onClick={handleClear}
                style={{ padding: "12px 20px", background: "transparent", border: "0.5px solid #1c201e", borderRadius: "8px", fontFamily: "inherit", fontSize: "12px", color: "#4a5450", cursor: "pointer", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#8a9890"} onMouseLeave={e => e.currentTarget.style.color = "#4a5450"}>
                Effacer
              </button>
            </div>

            {/* Result */}
            <div style={{ background: "#0f1210", border: `0.5px solid ${result?.status === "success" ? ac + "44" : result?.status === "error" ? "#4a1a1a" : "#1c201e"}`, borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, transition: "border 0.25s" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={labelStyle}>{mode === "chiffrer" ? "TEXTE CHIFFRÉ" : "TEXTE DÉCHIFFRÉ"}</div>
                <div style={{ fontSize: "14px", color: result?.status === "success" ? ac : "#2e3a35", wordBreak: "break-all", lineHeight: 1.5 }}>
                  {result?.text || "— résultat ici —"}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", marginLeft: "14px", flexShrink: 0 }}>
                <span style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "5px", background: result?.status === "success" ? "#152a1e" : result?.status === "error" ? "#1a0f0f" : "#161c19", color: result?.status === "success" ? ac : result?.status === "error" ? "#f87171" : "#3a4440", border: `0.5px solid ${result?.status === "success" ? ac + "44" : result?.status === "error" ? "#4a1a1a" : "#1c201e"}` }}>
                  {result?.status === "success" ? "Succès" : result?.status === "error" ? "Erreur" : "En attente"}
                </span>
                <button onClick={handleCopy} disabled={!result?.text}
                  style={{ fontSize: "10px", padding: "4px 10px", borderRadius: "5px", background: "transparent", border: "0.5px solid #1c201e", color: copied ? ac : "#4a5450", cursor: result?.text ? "pointer" : "default", fontFamily: "inherit" }}>
                  {copied ? "Copié ✓" : "Copier"}
                </button>
              </div>
            </div>

              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
