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
  accent:  "#34d399",   // emerald — AES brand colour
  accent2: "#10b981",
  code:    "#a3e635",
  error:   "#f87171",
  success: "#4ade80",
  warn:    "#fb923c",
  info:    "#60a5fa",
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

// ─── AES key strength badge ────────────────────────────────────────────────────
function KeyStrength({ len }) {
  let label = "—", color = C.muted;
  if (len === 16) { label = "AES-128 ✓"; color = C.accent; }
  else if (len === 24) { label = "AES-192 ✓"; color = C.info; }
  else if (len === 32) { label = "AES-256 ✓"; color = C.success; }
  else if (len > 0 && len < 16) { label = `${len}/16 oct.`; color = C.warn; }
  else if (len > 16 && len < 24) { label = `${len}/24 oct.`; color = C.warn; }
  else if (len > 24 && len < 32) { label = `${len}/32 oct.`; color = C.warn; }
  else if (len > 32) { label = `${len} trop long`; color = C.error; }

  return (
    <div style={{
      padding: "6px 10px", fontFamily: mono, fontSize: "10px",
      background: color + "15", border: `0.5px solid ${color}44`,
      borderRadius: "6px", color, whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {label}
    </div>
  );
}

// ─── AES Rounds info ──────────────────────────────────────────────────────────
function RoundRow({ round, step, color }) {
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
      <div style={{ width: "24px", height: "18px", borderRadius: "4px", background: color + "18", border: `0.5px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: mono, fontSize: "8px", color }}>{round}</span>
      </div>
      <div style={{ fontFamily: mono, fontSize: "9px", color: C.muted, letterSpacing: "0.5px" }}>{step}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AesDemo() {
  const [mode, setMode] = useState("encrypt");
  const [plaintext, setPlaintext] = useState("Hello AES!");
  const [key, setKey]             = useState("1234567890ABCDEF");  // 16 bytes
  const [cipherHex, setCipherHex] = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [copied, setCopied]       = useState(false);

  const keyLen   = new TextEncoder().encode(key).length;
  const keyValid = [16, 24, 32].includes(keyLen);

  const handleEncrypt = async () => {
    if (!plaintext.trim() || !keyValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callApi("/aes/encrypt", { text: plaintext, key });
      setResult({ type: "encrypt", value: data.ciphertext });
      setCipherHex(data.ciphertext);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleDecrypt = async () => {
    if (!cipherHex.trim() || !keyValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callApi("/aes/decrypt", { ciphertext: cipherHex, key });
      setResult({ type: "decrypt", value: data.plaintext });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleCopy = () => {
    const val = result?.value;
    if (val) navigator.clipboard.writeText(val).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const canEncrypt = plaintext.trim() && keyValid && !loading;
  const canDecrypt = cipherHex.trim() && keyValid && !loading;

  const rounds = keyLen === 32 ? 14 : keyLen === 24 ? 12 : 10;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "14px", fontFamily: mono, color: C.text, overflow: "hidden" }}>

      {/* ── Top: Mode + Key size selector ────────────────────────────────────── */}
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

        {/* Key presets */}
        <div style={{ background: C.panel, border: `0.5px solid ${C.accent}22`, borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label color={C.accent}>TAILLE DE CLÉ — RACCOURCIS</Label>
          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { bits: 128, ex: "1234567890ABCDEF", label: "AES-128" },
              { bits: 192, ex: "1234567890ABCDEF12345678", label: "AES-192" },
              { bits: 256, ex: "1234567890ABCDEF1234567890ABCDEF", label: "AES-256" },
            ].map(({ bits, ex, label }) => {
              const active = keyLen === ex.length;
              return (
                <button key={bits} onClick={() => { setKey(ex); setResult(null); setError(""); }}
                  style={{ ...btn(active ? C.accent : C.muted, false), padding: "5px 10px", fontSize: "10px", background: active ? C.accent + "18" : "transparent", border: `0.5px solid ${active ? C.accent + "55" : C.border}`, color: active ? C.accent : C.muted }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode info */}
        <div style={{ flex: 1, background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", color: C.accent, fontFamily: mono, fontWeight: 500, marginBottom: "4px" }}>
              AES-CBC — {keyLen === 16 ? "128" : keyLen === 24 ? "192" : keyLen === 32 ? "256" : "?"} bits
            </div>
            <div style={{ fontSize: "9px", color: C.muted, fontFamily: mono, lineHeight: 1.6 }}>
              Blocs 128-bit · IV aléatoire 16 oct. · Padding PKCS#7 · {rounds} tours
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle: I/O + AES diagram ────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "14px", flex: 1, minHeight: 0 }}>

        {/* LEFT — inputs */}
        <div style={{ flex: 1, background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>

          {/* Plaintext / Ciphertext input */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Label>{mode === "encrypt" ? "TEXTE CLAIR" : "TEXTE CHIFFRÉ (hex — avec IV)"}</Label>
            <textarea
              value={mode === "encrypt" ? plaintext : cipherHex}
              onChange={e => mode === "encrypt" ? setPlaintext(e.target.value) : setCipherHex(e.target.value)}
              placeholder={mode === "encrypt" ? "Entrez votre texte..." : "Collez le hex (IV + ciphertext)..."}
              style={{ flex: 1, ...inputStyle, resize: "none", lineHeight: 1.6, color: mode === "encrypt" ? C.text : C.accent, minHeight: "80px" }}
            />
            {mode === "encrypt" && (
              <div style={{ fontSize: "10px", color: C.dim, marginTop: "5px", textAlign: "right" }}>
                {plaintext.length} car. → {Math.ceil(plaintext.length / 16)} bloc(s) de 128-bit (+ IV 16 oct.)
              </div>
            )}
          </div>

          {/* Key field */}
          <div>
            <Label>CLÉ AES — 16 | 24 | 32 OCTETS</Label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input value={key} onChange={e => { setKey(e.target.value); setResult(null); setError(""); }}
                placeholder="ex: 1234567890ABCDEF"
                style={{ ...inputStyle, color: keyValid ? C.accent : C.warn, flex: 1 }} />
              <KeyStrength len={keyLen} />
            </div>
            {!keyValid && key.length > 0 && (
              <div style={{ fontSize: "9px", color: C.warn, marginTop: "4px" }}>
                ⚠ Longueur invalide — utilisez exactement 16, 24 ou 32 octets
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            {mode === "encrypt" ? (
              <button onClick={handleEncrypt} disabled={!canEncrypt} style={{ ...btn(C.accent, !canEncrypt), flex: 1 }}>
                {loading ? "⟳ chiffrement AES-CBC..." : "⇒ Chiffrer (AES)"}
              </button>
            ) : (
              <button onClick={handleDecrypt} disabled={!canDecrypt} style={{ ...btn(C.accent, !canDecrypt), flex: 1 }}>
                {loading ? "⟳ déchiffrement AES-CBC..." : "⇐ Déchiffrer (AES)"}
              </button>
            )}
            <button onClick={() => { setResult(null); setError(""); setPlaintext(""); setCipherHex(""); }}
              style={{ ...btn(C.muted, false), background: "transparent", border: `0.5px solid ${C.border}`, color: C.muted, padding: "10px 16px" }}>
              Effacer
            </button>
          </div>
        </div>

        {/* CENTER — result */}
        <div style={{ width: "260px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{
            background: C.panel,
            border: `0.5px solid ${result ? C.accent + "55" : error ? C.error + "44" : C.border}`,
            borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px",
            transition: "border 0.25s", flex: 1,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Label color={result ? C.accent : undefined}>
                {result?.type === "encrypt" ? "CHIFFRÉ (HEX + IV)" : result?.type === "decrypt" ? "TEXTE DÉCHIFFRÉ" : "RÉSULTAT"}
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
              flex: 1, fontFamily: mono, fontSize: "10px",
              color: result ? C.accent : C.muted,
              wordBreak: "break-all", lineHeight: 1.8,
              border: `0.5px solid ${C.border}`, overflowY: "auto",
            }}>
              {result?.value
                ? <>
                    {result.type === "encrypt" && (
                      <div style={{ fontSize: "8px", color: C.dim, marginBottom: "6px", letterSpacing: "1px" }}>
                        IV (16 oct.) + CIPHERTEXT :
                      </div>
                    )}
                    {result.value}
                  </>
                : error
                  ? <span style={{ color: C.error }}>✕ {error}</span>
                  : "— résultat ici —"}
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {result?.value && (
                <button onClick={handleCopy}
                  style={{ ...btn(C.accent, false), padding: "6px 12px", fontSize: "10px", flex: 1, color: copied ? C.success : C.accent }}>
                  {copied ? "Copié ✓" : "Copier"}
                </button>
              )}
              {result?.type === "encrypt" && (
                <button onClick={() => { setMode("decrypt"); setResult(null); setError(""); }}
                  style={{ ...btn(C.success, false), padding: "6px 12px", fontSize: "10px", flex: 1 }}>
                  ↓ Déchiffrer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — AES diagram */}
        <div style={{ width: "230px", flexShrink: 0, background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "14px", overflowY: "auto" }}>
          <Label color={C.accent}>STRUCTURE AES — {rounds} TOURS</Label>
          <div style={{ marginBottom: "10px" }}>
            <RoundRow round="0" step="AddRoundKey (clé initiale)" color={C.accent} />
          </div>
          {Array.from({ length: rounds - 1 }, (_, i) => (
            <div key={i} style={{ marginBottom: "6px" }}>
              <div style={{ fontSize: "8px", color: C.accent + "88", marginBottom: "3px" }}>Tour {i + 1}</div>
              <RoundRow round="→" step="SubBytes (S-Box)" color={C.info} />
              <RoundRow round="→" step="ShiftRows" color={C.info} />
              <RoundRow round="→" step="MixColumns" color={C.info} />
              <RoundRow round="→" step="AddRoundKey" color={C.accent} />
            </div>
          ))}
          <div style={{ marginTop: "6px" }}>
            <div style={{ fontSize: "8px", color: C.success + "88", marginBottom: "3px" }}>Tour final ({rounds})</div>
            <RoundRow round="→" step="SubBytes" color={C.success} />
            <RoundRow round="→" step="ShiftRows" color={C.success} />
            <RoundRow round="→" step="AddRoundKey" color={C.success} />
          </div>
          <div style={{ marginTop: "10px", padding: "8px 10px", background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: "6px" }}>
            <div style={{ fontSize: "8px", color: C.dim, lineHeight: 1.7 }}>
              Mode : CBC<br/>
              IV : 16 octets aléatoires<br/>
              Padding : PKCS#7<br/>
              Résultat : hex(IV + chiffré)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
