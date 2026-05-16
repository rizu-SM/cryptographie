/* eslint-disable react/prop-types */
import { useState } from "react";

const API_BASE = "http://localhost:5000/api";

async function callApi(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `Erreur HTTP ${res.status}`);
  return data;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      "#080a09",
  panel:   "#0f1210",
  border:  "#1c201e",
  text:    "#e2e8e4",
  muted:   "#4a5450",
  dim:     "#2e3a35",
  accent:  "#22d3ee",   // cyan — DES brand colour
  code:    "#a3e635",
  error:   "#f87171",
  success: "#4ade80",
  warn:    "#fb923c",
};
const mono = "'DM Mono', 'Courier New', monospace";

// ─── Primitives ───────────────────────────────────────────────────────────────
const Label = ({ children, color }) => (
  <div style={{ fontSize: "9px", color: color || C.dim, letterSpacing: "2px", marginBottom: "6px", fontFamily: mono }}>
    {children}
  </div>
);

const inputStyle = {
  width: "100%", background: C.bg, border: `0.5px solid ${C.border}`,
  borderRadius: "6px", padding: "8px 12px", fontFamily: mono,
  fontSize: "12px", color: C.text, outline: "none", boxSizing: "border-box",
};

const btn = (accent, disabled) => ({
  padding: "10px 20px", border: `0.5px solid ${disabled ? C.border : accent + "55"}`,
  borderRadius: "7px", background: disabled ? C.panel : accent + "18",
  color: disabled ? C.muted : accent, fontFamily: mono, fontSize: "12px",
  cursor: disabled ? "not-allowed" : "pointer", letterSpacing: "0.5px",
  transition: "all 0.15s", fontWeight: 500,
});

// ─── Info panel showing DES steps ─────────────────────────────────────────────
function StepBadge({ label, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      padding: "7px 12px", background: C.bg,
      border: `0.5px solid ${color}33`, borderRadius: "7px",
    }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
      <div style={{ fontFamily: mono, fontSize: "10px", color: C.muted }}>{label}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DesDemo() {
  const [mode, setMode] = useState("encrypt"); // "encrypt" | "decrypt"
  const [plaintext, setPlaintext] = useState("Hello DES");
  const [key, setKey]             = useState("DESCRYPT");
  const [cipherHex, setCipherHex] = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [copied, setCopied]       = useState(false);

  const handleEncrypt = async () => {
    if (!plaintext.trim() || !key.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callApi("/des/encrypt", { text: plaintext, key });
      setResult({ type: "encrypt", value: data.ciphertext });
      setCipherHex(data.ciphertext);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleDecrypt = async () => {
    if (!cipherHex.trim() || !key.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callApi("/des/decrypt", { text: cipherHex, key });
      setResult({ type: "decrypt", value: data.plaintext });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleCopy = () => {
    const val = result?.value;
    if (val) navigator.clipboard.writeText(val).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const canEncrypt = plaintext.trim() && key.trim() && !loading;
  const canDecrypt = cipherHex.trim() && key.trim() && !loading;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "14px", fontFamily: mono, color: C.text, overflow: "hidden" }}>

      {/* ── Top: Mode + Info ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
        {/* Mode toggle */}
        <div style={{ background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label color={C.accent}>MODE</Label>
          <div style={{ display: "flex", gap: "6px" }}>
            {["encrypt", "decrypt"].map(m => (
              <button key={m} onClick={() => { setMode(m); setResult(null); setError(""); }}
                style={{ ...btn(C.accent, false), background: mode === m ? C.accent + "20" : "transparent", border: `0.5px solid ${mode === m ? C.accent + "66" : C.border}`, color: mode === m ? C.accent : C.muted, padding: "7px 16px", fontSize: "11px" }}>
                {m === "encrypt" ? "↑ Chiffrer" : "↓ Déchiffrer"}
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm info */}
        <div style={{ flex: 1, background: C.panel, border: `0.5px solid ${C.accent}22`, borderRadius: "10px", padding: "14px" }}>
          <Label color={C.accent}>ALGORITHME — DES (Data Encryption Standard)</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px", marginTop: "4px" }}>
            <StepBadge label="Clé 64-bit (56 utiles)" color={C.accent} />
            <StepBadge label="Bloc 64-bit" color={C.accent} />
            <StepBadge label="16 tours Feistel" color={C.accent} />
            <StepBadge label="Permutation IP/FP + 8 S-Boxes" color={C.accent} />
          </div>
        </div>
      </div>

      {/* ── Middle: Inputs ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "14px", flex: 1, minHeight: 0 }}>

        {/* LEFT — plaintext / cipher input */}
        <div style={{ flex: 1, background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>

          {/* Plaintext panel */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Label>{mode === "encrypt" ? "TEXTE CLAIR" : "TEXTE CHIFFRÉ (hex)"}</Label>
            <textarea
              value={mode === "encrypt" ? plaintext : cipherHex}
              onChange={e => mode === "encrypt" ? setPlaintext(e.target.value) : setCipherHex(e.target.value)}
              placeholder={mode === "encrypt" ? "Entrez votre texte..." : "Collez le hex chiffré..."}
              style={{ flex: 1, ...inputStyle, resize: "none", lineHeight: 1.6, color: mode === "encrypt" ? C.text : C.accent, minHeight: "80px" }}
            />
            {mode === "encrypt" && (
              <div style={{ fontSize: "10px", color: C.dim, marginTop: "5px", textAlign: "right" }}>
                {plaintext.length} car. · 1 bloc de 8 octets (64-bit) traité à la fois
              </div>
            )}
          </div>

          {/* Key */}
          <div>
            <Label>CLÉ — 8 CARACTÈRES (64-BIT)</Label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input value={key} onChange={e => setKey(e.target.value)} placeholder="ex: DESCRYPT"
                maxLength={8}
                style={{ ...inputStyle, color: C.accent, flex: 1 }} />
              <div style={{
                padding: "6px 10px", fontFamily: mono, fontSize: "10px",
                background: key.length === 8 ? C.success + "15" : C.warn + "15",
                border: `0.5px solid ${key.length === 8 ? C.success + "44" : C.warn + "44"}`,
                borderRadius: "6px", color: key.length === 8 ? C.success : C.warn, whiteSpace: "nowrap",
              }}>
                {key.length}/8
              </div>
            </div>
            <div style={{ fontSize: "9px", color: C.dim, marginTop: "4px" }}>
              Exactement 8 caractères (56 bits effectifs, bit de parité ignoré)
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            {mode === "encrypt" ? (
              <button onClick={handleEncrypt} disabled={!canEncrypt} style={{ ...btn(C.accent, !canEncrypt), flex: 1 }}>
                {loading ? "⟳ chiffrement..." : "⇒ Chiffrer (DES)"}
              </button>
            ) : (
              <button onClick={handleDecrypt} disabled={!canDecrypt} style={{ ...btn(C.accent, !canDecrypt), flex: 1 }}>
                {loading ? "⟳ déchiffrement..." : "⇐ Déchiffrer (DES)"}
              </button>
            )}
            <button onClick={() => { setResult(null); setError(""); setPlaintext(""); setCipherHex(""); }}
              style={{ ...btn(C.muted, false), background: "transparent", border: `0.5px solid ${C.border}`, color: C.muted, padding: "10px 16px" }}>
              Effacer
            </button>
          </div>
        </div>

        {/* RIGHT — output + DES flow diagram */}
        <div style={{ width: "280px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Result */}
          <div style={{
            background: C.panel,
            border: `0.5px solid ${result ? (result.type === "encrypt" ? C.accent + "55" : C.success + "55") : error ? C.error + "44" : C.border}`,
            borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px",
            transition: "border 0.25s",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Label color={result ? (result.type === "encrypt" ? C.accent : C.success) : undefined}>
                {result?.type === "encrypt" ? "TEXTE CHIFFRÉ (HEX)" : result?.type === "decrypt" ? "TEXTE DÉCHIFFRÉ" : "RÉSULTAT"}
              </Label>
              <span style={{
                fontSize: "9px", padding: "2px 8px", borderRadius: "4px",
                background: result ? C.accent + "18" : error ? C.error + "18" : C.border + "80",
                color: result ? C.accent : error ? C.error : C.muted,
                border: `0.5px solid ${result ? C.accent + "44" : error ? C.error + "44" : C.border}`,
              }}>
                {result ? "Succès" : error ? "Erreur" : "En attente"}
              </span>
            </div>
            <div style={{
              background: C.bg, borderRadius: "7px", padding: "10px 12px",
              minHeight: "56px", fontFamily: mono, fontSize: "11px",
              color: result ? (result.type === "encrypt" ? C.accent : C.success) : C.muted,
              wordBreak: "break-all", lineHeight: 1.7,
              border: `0.5px solid ${C.border}`,
            }}>
              {result?.value || (error ? <span style={{ color: C.error }}>✕ {error}</span> : "— résultat ici —")}
            </div>
            {result?.value && (
              <button onClick={handleCopy}
                style={{ ...btn(C.accent, false), padding: "6px 12px", fontSize: "10px", alignSelf: "flex-end", color: copied ? C.success : C.accent }}>
                {copied ? "Copié ✓" : "Copier"}
              </button>
            )}
            {/* Quick decrypt button after encrypt */}
            {result?.type === "encrypt" && (
              <button onClick={() => { setMode("decrypt"); setResult(null); setError(""); }}
                style={{ ...btn(C.success, false), padding: "7px 12px", fontSize: "10px" }}>
                ↓ Passer en déchiffrement
              </button>
            )}
          </div>

          {/* DES Structure visual */}
          <div style={{ background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "14px", flex: 1 }}>
            <Label color={C.accent}>STRUCTURE DES — RÉSEAU FEISTEL</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { label: "Permutation initiale (IP)", color: C.accent },
                { label: "Split L₀ | R₀ (32-bit each)", color: C.muted },
                { label: "× 16 Rounds Feistel", color: C.accent },
                { label: "  ├ Expansion E(R) 32→48", color: C.dim },
                { label: "  ├ XOR ⊕ Sous-clé Kᵢ", color: C.dim },
                { label: "  ├ Substitution 8 S-Boxes", color: C.dim },
                { label: "  └ Permutation P", color: C.dim },
                { label: "Swap final R₁₆ | L₁₆", color: C.muted },
                { label: "Permutation finale (FP)", color: C.accent },
              ].map((s, i) => (
                <div key={i} style={{ fontFamily: mono, fontSize: "9px", color: s.color, letterSpacing: "0.5px", lineHeight: 1.8 }}>
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom: key schedule info ────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "12px 16px" }}>
        <Label>CALENDRIER DE CLÉS — 16 SOUS-CLÉS 48-BIT</Label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} style={{
              padding: "4px 8px", borderRadius: "5px",
              background: C.bg, border: `0.5px solid ${C.accent}33`,
              fontFamily: mono, fontSize: "9px", color: C.accent,
            }}>
              K{i + 1}
            </div>
          ))}
        </div>
        <div style={{ fontSize: "9px", color: C.dim, marginTop: "8px" }}>
          PC-1 (64→56 bits) → 16 décalages circulaires → PC-2 (56→48 bits) par tour
        </div>
      </div>
    </div>
  );
}
