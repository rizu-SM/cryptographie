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
  accent:  "#a78bfa",   // purple — RC4 brand colour
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

// ─── KSA State Visualiser (S-box preview) ────────────────────────────────────
function SBoxPreview({ keyStr }) {
  if (!keyStr) return null;
  // Simulate first 16 swaps of KSA for visual purposes only
  const S = Array.from({ length: 16 }, (_, i) => i);
  const key = [...keyStr].map(c => c.charCodeAt(0));
  let j = 0;
  for (let i = 0; i < 16; i++) {
    j = (j + S[i] + key[i % key.length]) % 16;
    [S[i], S[j]] = [S[j], S[i]];
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: "2px" }}>
      {S.map((v, i) => (
        <div key={i} style={{
          height: "20px", borderRadius: "3px",
          background: `hsl(${(v * 22) % 360}, 40%, 18%)`,
          border: `0.5px solid ${C.accent}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: mono, fontSize: "7px", color: C.accent + "99",
        }}>{v.toString(16).padStart(2, "0")}</div>
      ))}
    </div>
  );
}

// ─── Keystream byte display ───────────────────────────────────────────────────
function KeystreamByte({ byte, index }) {
  const hue = (byte * 1.4) % 360;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
    }}>
      <div style={{
        width: "28px", height: "28px", borderRadius: "5px",
        background: `hsla(${hue}, 60%, 25%, 0.6)`,
        border: `0.5px solid hsla(${hue}, 70%, 50%, 0.4)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: mono, fontSize: "8px", color: `hsl(${hue}, 80%, 70%)`,
        fontWeight: 500,
      }}>
        {byte.toString(16).padStart(2, "0")}
      </div>
      <div style={{ fontFamily: mono, fontSize: "7px", color: C.dim }}>{index}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Rc4Demo() {
  const [mode, setMode]         = useState("encrypt");
  const [plaintext, setPlaintext] = useState("Hello RC4!");
  const [key, setKey]           = useState("SECRET");
  const [cipherHex, setCipherHex] = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);

  // Simulate PRGA keystream from the key for visual (first 12 bytes)
  const keystreamPreview = (() => {
    if (!key) return [];
    try {
      const K = [...key].map(c => c.charCodeAt(0));
      const S = Array.from({ length: 256 }, (_, i) => i);
      let j = 0;
      for (let i = 0; i < 256; i++) {
        j = (j + S[i] + K[i % K.length]) % 256;
        [S[i], S[j]] = [S[j], S[i]];
      }
      let i2 = 0, j2 = 0;
      const bytes = [];
      for (let n = 0; n < 12; n++) {
        i2 = (i2 + 1) % 256;
        j2 = (j2 + S[i2]) % 256;
        [S[i2], S[j2]] = [S[j2], S[i2]];
        bytes.push(S[(S[i2] + S[j2]) % 256]);
      }
      return bytes;
    } catch { return []; }
  })();

  const handleEncrypt = async () => {
    if (!plaintext.trim() || !key.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callApi("/rc4/encrypt", { text: plaintext, key });
      setResult({ type: "encrypt", value: data.ciphertext });
      setCipherHex(data.ciphertext);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleDecrypt = async () => {
    if (!cipherHex.trim() || !key.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callApi("/rc4/decrypt", { text: cipherHex, key });
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

      {/* ── Row 1: Mode + Info bar ───────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>

        {/* Mode toggle */}
        <div style={{ background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <Label color={C.accent}>MODE</Label>
          <div style={{ display: "flex", gap: "6px" }}>
            {["encrypt", "decrypt"].map(m => (
              <button key={m} onClick={() => { setMode(m); setResult(null); setError(""); }}
                style={{ ...btn(C.accent, false), padding: "7px 16px", fontSize: "11px", background: mode === m ? C.accent + "20" : "transparent", border: `0.5px solid ${mode === m ? C.accent + "66" : C.border}`, color: mode === m ? C.accent : C.muted }}>
                {m === "encrypt" ? "↑ Chiffrer" : "↓ Déchiffrer"}
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm info */}
        <div style={{ flex: 1, background: C.panel, border: `0.5px solid ${C.accent}22`, borderRadius: "10px", padding: "14px" }}>
          <Label color={C.accent}>ALGORITHME — RC4 (Rivest Cipher 4)</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px", marginTop: "4px" }}>
            {[
              "Chiffrement par flot (stream cipher)",
              "Clé variable : 1 – 256 octets",
              "KSA : initialise S[0..255]",
              "PRGA : génère le flot de clés",
              "XOR texte ⊕ keystream",
              "Symétrique : même op chiffre/déchiffre",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 12px", background: C.bg, border: `0.5px solid ${C.accent}33`, borderRadius: "7px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: C.accent, flexShrink: 0 }} />
                <div style={{ fontFamily: mono, fontSize: "9px", color: C.muted }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: I/O + Visualiser ──────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "14px", flex: 1, minHeight: 0 }}>

        {/* LEFT — input panel */}
        <div style={{ flex: 1, background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>

          {/* Text area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Label>{mode === "encrypt" ? "TEXTE CLAIR" : "TEXTE CHIFFRÉ (hex)"}</Label>
            <textarea
              value={mode === "encrypt" ? plaintext : cipherHex}
              onChange={e => mode === "encrypt" ? setPlaintext(e.target.value) : setCipherHex(e.target.value)}
              placeholder={mode === "encrypt" ? "Entrez votre texte..." : "Collez le hex chiffré..."}
              style={{ flex: 1, ...inputStyle, resize: "none", lineHeight: 1.6, minHeight: "80px", color: mode === "encrypt" ? C.text : C.accent }}
            />
            {mode === "encrypt" && (
              <div style={{ fontSize: "10px", color: C.dim, marginTop: "5px", textAlign: "right" }}>
                {plaintext.length} octets — keystream de {plaintext.length} octets généré
              </div>
            )}
          </div>

          {/* Key field */}
          <div>
            <Label>CLÉ — TOUTE LONGUEUR (1 À 256 OCTETS)</Label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input value={key} onChange={e => { setKey(e.target.value); setResult(null); setError(""); }}
                placeholder="ex: SECRET"
                style={{ ...inputStyle, color: C.accent, flex: 1 }} />
              <div style={{
                padding: "6px 10px", fontFamily: mono, fontSize: "10px",
                background: key.length > 0 ? C.accent + "15" : C.border + "80",
                border: `0.5px solid ${key.length > 0 ? C.accent + "44" : C.border}`,
                borderRadius: "6px", color: key.length > 0 ? C.accent : C.muted, whiteSpace: "nowrap", flexShrink: 0,
              }}>
                {key.length} oct.
              </div>
            </div>
            <div style={{ fontSize: "9px", color: C.dim, marginTop: "4px" }}>
              Toute chaîne de caractères — la clé peut être un mot de passe
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            {mode === "encrypt" ? (
              <button onClick={handleEncrypt} disabled={!canEncrypt} style={{ ...btn(C.accent, !canEncrypt), flex: 1 }}>
                {loading ? "⟳ chiffrement RC4..." : "⇒ Chiffrer (RC4)"}
              </button>
            ) : (
              <button onClick={handleDecrypt} disabled={!canDecrypt} style={{ ...btn(C.accent, !canDecrypt), flex: 1 }}>
                {loading ? "⟳ déchiffrement RC4..." : "⇐ Déchiffrer (RC4)"}
              </button>
            )}
            <button onClick={() => { setResult(null); setError(""); setPlaintext(""); setCipherHex(""); }}
              style={{ ...btn(C.muted, false), background: "transparent", border: `0.5px solid ${C.border}`, color: C.muted, padding: "10px 16px" }}>
              Effacer
            </button>
          </div>
        </div>

        {/* CENTER — result panel */}
        <div style={{ width: "260px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{
            background: C.panel,
            border: `0.5px solid ${result ? C.accent + "55" : error ? C.error + "44" : C.border}`,
            borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px",
            flex: 1, transition: "border 0.25s",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Label color={result ? C.accent : undefined}>
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
              flex: 1, fontFamily: mono, fontSize: "11px",
              color: result ? C.accent : C.muted,
              wordBreak: "break-all", lineHeight: 1.8,
              border: `0.5px solid ${C.border}`, overflowY: "auto",
            }}>
              {result?.value
                ? result.value
                : error
                  ? <span style={{ color: C.error }}>✕ {error}</span>
                  : "— résultat ici —"}
            </div>

            {/* XOR illustration when result available */}
            {result?.type === "encrypt" && result.value && plaintext && (
              <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: "7px", padding: "8px 10px" }}>
                <div style={{ fontSize: "8px", color: C.dim, letterSpacing: "1px", marginBottom: "6px" }}>XOR — PREMIER OCTET</div>
                <div style={{ fontFamily: mono, fontSize: "9px", color: C.muted, lineHeight: 2 }}>
                  <span style={{ color: C.text }}>{plaintext.charCodeAt(0).toString(16).padStart(2, "0")}</span>
                  <span style={{ color: C.dim }}> ('{plaintext[0]}')</span>
                  <span style={{ color: C.dim }}> ⊕ </span>
                  <span style={{ color: C.accent }}>{keystreamPreview[0]?.toString(16).padStart(2, "0") ?? "??"}</span>
                  <span style={{ color: C.dim }}> (ks) = </span>
                  <span style={{ color: C.success }}>{result.value.slice(0, 2)}</span>
                </div>
              </div>
            )}

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

        {/* RIGHT — RC4 algorithm diagram */}
        <div style={{ width: "230px", flexShrink: 0, background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto" }}>
          <div>
            <Label color={C.accent}>RC4 — ÉTAPES INTERNES</Label>
            {[
              { phase: "KSA", steps: ["Initialiser S[0..255] = [0,1,...,255]", "j = 0", "For i = 0..255 :", "  j = (j + S[i] + K[i%len]) % 256", "  Swap S[i] ↔ S[j]"] },
              { phase: "PRGA", steps: ["i = 0,  j = 0", "For chaque octet du texte :", "  i = (i + 1) % 256", "  j = (j + S[i]) % 256", "  Swap S[i] ↔ S[j]", "  k = S[(S[i] + S[j]) % 256]"] },
              { phase: "XOR", steps: ["ciphertext[n] = plain[n] ⊕ k"] },
            ].map(({ phase, steps }) => (
              <div key={phase} style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "9px", color: C.accent, letterSpacing: "2px", marginBottom: "5px", borderBottom: `0.5px solid ${C.accent}22`, paddingBottom: "3px" }}>
                  {phase}
                </div>
                {steps.map((s, i) => (
                  <div key={i} style={{ fontFamily: mono, fontSize: "9px", color: C.muted, lineHeight: 1.8, letterSpacing: "0.3px" }}>{s}</div>
                ))}
              </div>
            ))}
          </div>

          {/* Symmetry note */}
          <div style={{ background: C.bg, border: `0.5px solid ${C.accent}33`, borderRadius: "7px", padding: "8px 10px" }}>
            <div style={{ fontSize: "9px", color: C.accent, letterSpacing: "1px", marginBottom: "4px" }}>SYMÉTRIE</div>
            <div style={{ fontSize: "9px", color: C.muted, lineHeight: 1.7 }}>
              Chiffrement = Déchiffrement<br/>
              C = P ⊕ KS  →  P = C ⊕ KS<br/>
              <span style={{ color: C.warn }}>⚠ Réutiliser la clé = vulnérable</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Live keystream preview ────────────────────────────────────── */}
      <div style={{ flexShrink: 0, background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <Label color={C.accent}>APERÇU DU FLOT DE CLÉS — 12 PREMIERS OCTETS (calculé depuis la clé)</Label>
          <div style={{ fontSize: "9px", color: C.dim, fontFamily: mono }}>clé : "{key || "—"}"</div>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
          {key ? keystreamPreview.map((b, i) => (
            <KeystreamByte key={i} byte={b} index={i} />
          )) : (
            <div style={{ fontSize: "10px", color: C.dim }}>Entrez une clé pour voir le flot généré...</div>
          )}
        </div>
        <div style={{ marginTop: "8px" }}>
          <Label color={C.accent}>APERÇU S-BOX — 16 PREMIERS SLOTS APRÈS KSA</Label>
          <SBoxPreview keyStr={key} />
        </div>
      </div>
    </div>
  );
}
