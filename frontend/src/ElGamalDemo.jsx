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
  if (!response.ok || data.error) throw new Error(data.error || "Erreur serveur");
  return data;
}

// ─── Design tokens (matching App.jsx) ─────────────────────────────────────────
const C = {
  bg:      "#080a09",
  panel:   "#0f1210",
  border:  "#1c201e",
  text:    "#e2e8e4",
  muted:   "#4a5450",
  dim:     "#2e3a35",
  alice:   "#fb923c",   // orange — matches ElGamal color in sidebar
  bob:     "#60a5fa",   // blue
  code:    "#a3e635",   // lime for code values
  error:   "#f87171",
  success: "#4ade80",
};

const mono = "'DM Mono', 'Courier New', monospace";

// ─── Reusable primitives ───────────────────────────────────────────────────────
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

const KeyCard = ({ label, value, accent }) => (
  <div style={{
    background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: "8px",
    padding: "12px 14px", marginBottom: "10px",
  }}>
    <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "2px", marginBottom: "6px", fontFamily: mono }}>
      {label}
    </div>
    <div style={{
      fontFamily: mono, fontSize: "12px", color: accent || C.code,
      whiteSpace: "pre-line", lineHeight: 1.7, wordBreak: "break-all",
    }}>
      {value || "—"}
    </div>
  </div>
);

const Divider = () => (
  <div style={{ height: "0.5px", background: C.border, margin: "14px 0" }} />
);

// ─── Step log entry ────────────────────────────────────────────────────────────
function StepEntry({ index, actor, children }) {
  const color = actor === "Alice" ? C.alice : C.bob;
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

// ─── Channel arrow ─────────────────────────────────────────────────────────────
function Channel({ label, reverse, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
      <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", fontFamily: mono, textAlign: "center" }}>
        {label}
      </div>
      <div style={{
        width: "60px", height: "1px", background: color,
        position: "relative", transform: reverse ? "rotate(180deg)" : "none",
      }}>
        <div style={{
          position: "absolute", right: "-1px", top: "-4px",
          width: "8px", height: "8px",
          borderRight: `1.5px solid ${color}`, borderBottom: `1.5px solid ${color}`,
          transform: "rotate(-45deg)",
        }} />
      </div>
    </div>
  );
}

// ─── Tool Mode: direct encrypt / decrypt ─────────────────────────────────────
function ElGamalToolMode() {
  const [subTab, setSubTab] = useState("encrypt");

  // Encrypt
  const [eP, setEP] = useState("");
  const [eG, setEG] = useState("");
  const [eY, setEY] = useState("");
  const [eM, setEM] = useState("");
  const [eResult, setEResult] = useState(null); // { C1, C2 }

  // Decrypt
  const [dP, setDP] = useState("");
  const [dS, setDS] = useState("");
  const [dC1, setDC1] = useState("");
  const [dC2, setDC2] = useState("");
  const [dResult, setDResult] = useState(null); // integer M

  const [loading, setLoading] = useState("");
  const [error, setError]     = useState("");

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

  const handleEncrypt = async () => {
    setError(""); setEResult(null);
    const missing = !eP || !eG || !eY || eM === "";
    if (missing) { setError("p, g, y et M sont tous requis."); return; }
    const Mint = parseInt(eM, 10);
    if (isNaN(Mint) || Mint < 0) { setError("M doit être un entier ≥ 0."); return; }
    setLoading("enc");
    try {
      const res = await fetch(`${API_BASE}/elgamal/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ M: Mint, y: parseInt(eY), g: parseInt(eG), p: parseInt(eP) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erreur serveur");
      setEResult(data.ciphertext);
    } catch (err) { setError(err.message); }
    finally { setLoading(""); }
  };

  const handleDecrypt = async () => {
    setError(""); setDResult(null);
    if (!dP || !dS || !dC1 || !dC2) { setError("p, s, C1 et C2 sont tous requis."); return; }
    setLoading("dec");
    try {
      const res = await fetch(`${API_BASE}/elgamal/decrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ C1: parseInt(dC1), C2: parseInt(dC2), s: parseInt(dS), p: parseInt(dP) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erreur serveur");
      setDResult(data.plaintext);
    } catch (err) { setError(err.message); }
    finally { setLoading(""); }
  };

  const Field = ({ label, value, onChange, placeholder, color }) => (
    <div>
      <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "5px" }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={{ ...inputStyle, color: color || C.text }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "14px", fontFamily: mono, color: C.text }}>

      {/* Sub-tab */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button style={tabStyle(subTab === "encrypt", C.bob)} onClick={() => { setSubTab("encrypt"); setError(""); }}>↑ CHIFFRER</button>
        <button style={tabStyle(subTab === "decrypt", C.alice)} onClick={() => { setSubTab("decrypt"); setError(""); }}>↓ DÉCHIFFRER</button>
      </div>

      {error && (
        <div style={{
          background: C.error + "12", border: `0.5px solid ${C.error}44`,
          borderRadius: "8px", padding: "10px 14px", fontSize: "11px", color: C.error,
        }}>✕ {error}</div>
      )}

      {/* ── ENCRYPT ── */}
      {subTab === "encrypt" && (
        <div style={{ display: "flex", gap: "14px", flex: 1, minHeight: 0 }}>

          {/* Inputs */}
          <div style={{
            flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
            borderRadius: "10px", padding: "18px", display: "flex",
            flexDirection: "column", gap: "12px", overflowY: "auto",
          }}>
            <div style={{ fontSize: "9px", color: C.bob, letterSpacing: "2px" }}>CLÉ PUBLIQUE</div>
            <Field label="p — nombre premier" value={eP} onChange={setEP} placeholder="ex: 2357" color={C.bob} />
            <Field label="g — générateur" value={eG} onChange={setEG} placeholder="ex: 2" color={C.bob} />
            <Field label="y — clé publique (g^s mod p)" value={eY} onChange={setEY} placeholder="ex: 1185" color={C.bob} />
            <div style={{ height: "0.5px", background: C.border }} />
            <div style={{ fontSize: "9px", color: C.bob, letterSpacing: "2px" }}>MESSAGE</div>
            <Field label="M — entier à chiffrer (0 ≤ M < p)" value={eM} onChange={setEM} placeholder="ex: 2035" />
            <button
              style={btn(C.bob, loading === "enc" || !eP || !eG || !eY || eM === "")}
              disabled={loading === "enc" || !eP || !eG || !eY || eM === ""}
              onClick={handleEncrypt}
            >
              {loading === "enc" ? "⟳ chiffrement..." : "↑ Chiffrer"}
            </button>
          </div>

          {/* Output */}
          <div style={{
            flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
            borderRadius: "10px", padding: "18px", display: "flex",
            flexDirection: "column", overflowY: "auto",
          }}>
            <div style={{ fontSize: "9px", color: C.bob, letterSpacing: "2px", marginBottom: "14px" }}>RÉSULTAT — CHIFFRÉ</div>
            {eResult ? (
              <>
                {/* C1 */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "6px" }}>C1 = g^k mod p</div>
                  <div style={{
                    background: C.bg, border: `0.5px solid ${C.bob}55`, borderRadius: "8px",
                    padding: "12px 14px", fontFamily: mono, fontSize: "15px",
                    color: C.bob, letterSpacing: "2px",
                  }}>{eResult.C1}</div>
                </div>
                {/* C2 */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "6px" }}>C2 = M · y^k mod p</div>
                  <div style={{
                    background: C.bg, border: `0.5px solid ${C.bob}55`, borderRadius: "8px",
                    padding: "12px 14px", fontFamily: mono, fontSize: "15px",
                    color: C.bob, letterSpacing: "2px",
                  }}>{eResult.C2}</div>
                </div>
                <button
                  style={{ ...btn(C.muted, false), marginTop: "auto" }}
                  onClick={() => navigator.clipboard.writeText(`C1=${eResult.C1}, C2=${eResult.C2}`)}
                >⎘ Copier C1 et C2</button>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: C.dim }}>
                Le résultat (C1, C2) apparaîtra ici.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DECRYPT ── */}
      {subTab === "decrypt" && (
        <div style={{ display: "flex", gap: "14px", flex: 1, minHeight: 0 }}>

          {/* Inputs */}
          <div style={{
            flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
            borderRadius: "10px", padding: "18px", display: "flex",
            flexDirection: "column", gap: "12px", overflowY: "auto",
          }}>
            <div style={{ fontSize: "9px", color: C.alice, letterSpacing: "2px" }}>CLÉ PRIVÉE</div>
            <Field label="p — nombre premier" value={dP} onChange={setDP} placeholder="ex: 2357" color={C.alice} />
            <Field label="s — clé privée secrète" value={dS} onChange={setDS} placeholder="ex: 1751" color={C.alice} />
            <div style={{ height: "0.5px", background: C.border }} />
            <div style={{ fontSize: "9px", color: C.alice, letterSpacing: "2px" }}>CHIFFRÉ</div>
            <Field label="C1" value={dC1} onChange={setDC1} placeholder="ex: 1430" />
            <Field label="C2" value={dC2} onChange={setDC2} placeholder="ex: 697" />
            <button
              style={btn(C.alice, loading === "dec" || !dP || !dS || !dC1 || !dC2)}
              disabled={loading === "dec" || !dP || !dS || !dC1 || !dC2}
              onClick={handleDecrypt}
            >
              {loading === "dec" ? "⟳ déchiffrement..." : "↓ Déchiffrer"}
            </button>
          </div>

          {/* Output */}
          <div style={{
            flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
            borderRadius: "10px", padding: "18px", display: "flex",
            flexDirection: "column", overflowY: "auto",
          }}>
            <div style={{ fontSize: "9px", color: C.alice, letterSpacing: "2px", marginBottom: "14px" }}>RÉSULTAT — DÉCHIFFRÉ</div>
            {dResult !== null ? (
              <>
                <div style={{
                  background: C.bg, border: `0.5px solid ${C.success}55`, borderRadius: "8px",
                  padding: "20px", fontFamily: mono, fontSize: "28px",
                  color: C.success, letterSpacing: "4px", textAlign: "center", marginBottom: "16px",
                }}>M = {dResult}</div>
                {dResult >= 32 && dResult < 127 && (
                  <div style={{
                    background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: "8px",
                    padding: "12px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "6px" }}>CARACTÈRE ASCII</div>
                    <div style={{ fontFamily: mono, fontSize: "24px", color: C.text }}>'{String.fromCharCode(dResult)}'</div>
                  </div>
                )}
                <div style={{
                  marginTop: "14px", background: C.bg, border: `0.5px solid ${C.border}`,
                  borderRadius: "8px", padding: "12px 14px",
                }}>
                  <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "8px" }}>FORMULE APPLIQUÉE</div>
                  <div style={{ fontFamily: mono, fontSize: "11px", color: C.dim, lineHeight: 1.8 }}>
                    R = C1^s mod p<br/>
                    M = C2 · R⁻¹ mod p
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: C.dim }}>
                M déchiffré apparaîtra ici.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ElGamalDemo() {
  const [mode, setMode] = useState("sim"); // 'sim' | 'tool'

  // Key generation params
  const [bits, setBits] = useState("32");
  const [customP, setCustomP] = useState("");
  const [customG, setCustomG] = useState("");
  const [customS, setCustomS] = useState("");

  // State
  const [keys, setKeys] = useState(null);
  const [M, setM] = useState("42");         // integer to encrypt
  const [charInput, setCharInput] = useState(""); // optional char helper
  const [ciphertext, setCiphertext] = useState(null); // { C1, C2 }
  const [plaintext, setPlaintext] = useState(null);

  const [steps, setSteps] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState("");

  const modeTabStyle = (active, accent) => ({
    padding: "6px 18px", fontFamily: mono, fontSize: "10px", letterSpacing: "1.5px",
    border: `0.5px solid ${active ? accent + "66" : C.border}`,
    background: active ? accent + "16" : "transparent",
    color: active ? accent : C.muted,
    cursor: "pointer", borderRadius: "6px", transition: "all 0.15s",
  });

  const logRef = useRef(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [steps]);

  const addStep = (actor, content) => setSteps((s) => [...s, { actor, content }]);

  const reset = () => { setCiphertext(null); setPlaintext(null); };

  // ── Char helper: fill M from a character ─────────────────────────────────────
  const applyChar = (ch) => {
    if (ch.length > 0) setM(String(ch.charCodeAt(0)));
  };

  // ── Generate keys ─────────────────────────────────────────────────────────────
  const generateKeys = async () => {
    setLoading("keys"); setError(""); setStatus(""); reset(); setSteps([]);
    try {
      const body = { bits: parseInt(bits, 10) };
      if (customP) body.p = parseInt(customP, 10);
      if (customG) body.g = parseInt(customG, 10);
      if (customS) body.s = parseInt(customS, 10);

      const k = await postJson("/elgamal/generate-keys", body);
      setKeys(k);

      const { y, g, p } = k.public_key;
      const { s } = k.private_key;

      setStatus(`p = ${p}  ·  g = ${g}  ·  s = ${s}  ·  y = ${y}`);
      setSteps([
        { actor: "Alice", content: <><Code>p = {p}</Code> — grand nombre premier sûr</> },
        { actor: "Alice", content: <><Code>g = {g}</Code> — générateur du groupe multiplicatif mod p</> },
        { actor: "Alice", content: <><Code>s = {s}</Code> — clé privée (secret aléatoire)</> },
        { actor: "Alice", content: <><Code>y = g^s mod p = {g}^{s} mod {p} = {y}</Code> — clé publique calculée</> },
        { actor: "Alice", content: <>publie <Code>(p={p}, g={g}, y={y})</Code> · garde <Code>s={s}</Code> secret</> },
        { actor: "Bob",   content: <>reçoit la clé publique d'Alice : <Code>(p={p}, g={g}, y={y})</Code></> },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  // ── Encrypt ───────────────────────────────────────────────────────────────────
  const encryptMessage = async () => {
    if (!keys || M === "") return;
    const Mint = parseInt(M, 10);
    if (isNaN(Mint) || Mint < 0 || Mint >= keys.public_key.p) {
      setError(`M doit être un entier dans [0, p−1] = [0, ${keys.public_key.p - 1}]`);
      return;
    }
    setLoading("encrypt"); setError(""); setPlaintext(null);
    try {
      const { y, g, p } = keys.public_key;
      const data = await postJson("/elgamal/encrypt", { M: Mint, y, g, p });
      const { C1, C2 } = data.ciphertext;
      setCiphertext({ C1, C2 });

      addStep("Bob", <>choisit un aléatoire <Code>k</Code> et calcule :<br />
        <Code>C1 = g^k mod p</Code> et <Code>C2 = M · y^k mod p</Code></>);
      addStep("Bob", <>envoie le chiffré à Alice : <Code>(C1={C1}, C2={C2})</Code></>);
    } catch (err) {
      setError(err.message); setCiphertext(null);
    } finally {
      setLoading("");
    }
  };

  // ── Decrypt ───────────────────────────────────────────────────────────────────
  const decryptMessage = async () => {
    if (!keys || !ciphertext) return;
    setLoading("decrypt"); setError("");
    try {
      const { C1, C2 } = ciphertext;
      const { s } = keys.private_key;
      const { p } = keys.public_key;
      const data = await postJson("/elgamal/decrypt", { C1, C2, s, p });
      setPlaintext(data.plaintext);

      addStep("Alice", <>calcule <Code>R = C1^s mod p = {C1}^{s} mod {p}</Code></>);
      addStep("Alice", <>récupère <Code>M = C2 · R⁻¹ mod p = {data.plaintext}</Code>{" "}
        {data.plaintext >= 32 && data.plaintext < 127
          ? <>(→ char : <Code>{String.fromCharCode(data.plaintext)}</Code>)</>
          : null}
      </>);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  // ── Shared styles ─────────────────────────────────────────────────────────────
  const btn = (accent, disabled) => ({
    width: "100%", padding: "9px 12px", border: `0.5px solid ${disabled ? C.border : accent + "55"}`,
    borderRadius: "7px", background: disabled ? C.panel : accent + "16",
    color: disabled ? C.muted : accent, fontFamily: mono, fontSize: "11px",
    cursor: disabled ? "not-allowed" : "pointer", letterSpacing: "0.5px",
    transition: "all 0.15s", fontWeight: 500,
  });

  const inputStyle = {
    width: "100%", background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: "6px",
    padding: "7px 10px", fontFamily: mono, fontSize: "12px", color: C.text, outline: "none",
  };

  const mValid = keys && M !== "" && !isNaN(parseInt(M, 10))
    && parseInt(M, 10) >= 0 && parseInt(M, 10) < keys.public_key.p;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      gap: "14px", fontFamily: mono, color: C.text, overflow: "hidden",
    }}>

      {/* ── Mode switcher ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button style={modeTabStyle(mode === "sim", C.alice)} onClick={() => setMode("sim")}>SIMULATION</button>
        <button style={modeTabStyle(mode === "tool", C.bob)} onClick={() => setMode("tool")}>OUTIL</button>
        <div style={{ marginLeft: "auto", fontSize: "9px", color: C.dim, letterSpacing: "1px" }}>
          {mode === "sim" ? "Alice & Bob — démonstration pédagogique" : "Chiffrement / Déchiffrement direct"}
        </div>
      </div>

      {mode === "tool" && <ElGamalToolMode />}
      {mode !== "tool" && <>

      {/* ── Row 1: panels ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "14px", flex: 1, minHeight: 0 }}>

        {/* LEFT — Alice */}
        <div style={{
          width: "230px", flexShrink: 0, background: C.panel,
          border: `0.5px solid ${C.border}`, borderRadius: "10px",
          padding: "16px", display: "flex", flexDirection: "column", overflowY: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
              background: C.alice + "18", border: `0.5px solid ${C.alice}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", color: C.alice, fontWeight: 500,
            }}>A</div>
            <div>
              <div style={{ fontSize: "12px", color: C.alice, fontWeight: 500 }}>Alice</div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px" }}>Propriétaire des clés</div>
            </div>
          </div>

          <Label>CLÉ PRIVÉE — SECRET</Label>
          <KeyCard
            label="s"
            value={keys ? `s = ${keys.private_key.s}` : "en attente de génération"}
            accent={C.alice}
          />

          <Label>CLÉ PUBLIQUE — PARTAGÉE</Label>
          <KeyCard
            label="p, g, y"
            value={keys
              ? `p = ${keys.public_key.p}\ng = ${keys.public_key.g}\ny = ${keys.public_key.y}`
              : "en attente de génération"}
            accent={C.bob}
          />

          <Divider />

          <Label>MESSAGE DÉCHIFFRÉ (M)</Label>
          <div style={{
            background: C.bg, border: `0.5px solid ${plaintext !== null ? C.success + "55" : C.border}`,
            borderRadius: "8px", padding: "10px 12px", minHeight: "42px",
            fontFamily: mono, fontSize: "13px", marginBottom: "10px",
            color: plaintext !== null ? C.success : C.muted, letterSpacing: "2px",
          }}>
            {plaintext !== null
              ? <>M = {plaintext}{plaintext >= 32 && plaintext < 127
                  ? <span style={{ color: C.muted, fontSize: "11px" }}> ({String.fromCharCode(plaintext)})</span>
                  : null}</>
              : "—"}
          </div>

          <button
            style={btn(C.alice, !ciphertext || loading === "decrypt")}
            disabled={!ciphertext || loading === "decrypt"}
            onClick={decryptMessage}
          >
            {loading === "decrypt" ? "⟳ déchiffrement..." : "↓ Déchiffrer (clé privée s)"}
          </button>
        </div>

        {/* CENTER — params + channel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "200px", flexShrink: 0 }}>

          {/* Params card */}
          <div style={{
            background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px",
            padding: "16px",
          }}>
            <Label>PARAMÈTRES ELGAMAL</Label>

            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px", letterSpacing: "1px" }}>bits (auto)</div>
              <select
                value={bits} onChange={(e) => setBits(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="16">16 bits</option>
                <option value="32">32 bits</option>
                <option value="64">64 bits</option>
              </select>
            </div>

            <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "1px", margin: "8px 0 6px" }}>
              — ou fixer manuellement —
            </div>

            {[
              { label: "p (premier sûr)", id: "p", val: customP, set: setCustomP, color: C.alice },
              { label: "g (générateur)", id: "g", val: customG, set: setCustomG, color: C.bob },
              { label: "s (clé privée)", id: "s", val: customS, set: setCustomS, color: C.alice },
            ].map(({ label, id, val, set, color }) => (
              <div key={id} style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px", letterSpacing: "1px" }}>{label}</div>
                <input
                  type="number" min="2" value={val} placeholder="auto"
                  onChange={(e) => set(e.target.value)}
                  style={{ ...inputStyle, color }}
                />
              </div>
            ))}

            <button
              style={{ ...btn(C.alice, loading === "keys"), marginTop: "4px" }}
              disabled={loading === "keys"}
              onClick={generateKeys}
            >
              {loading === "keys" ? "⟳ génération..." : "⇒ Générer les clés"}
            </button>

            {(status || error) && (
              <div style={{
                marginTop: "10px", fontSize: "9px", letterSpacing: "0.5px", lineHeight: 1.6,
                color: error ? C.error : C.muted, wordBreak: "break-all",
              }}>
                {error ? `✕ ${error}` : status}
              </div>
            )}
          </div>

          {/* Channel */}
          <div style={{
            flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
            borderRadius: "10px", padding: "16px",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: "18px",
          }}>
            <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "2px", textAlign: "center" }}>CANAL PUBLIC</div>
            <Channel label="clé publique →" color={C.bob} />
            <div style={{ height: "0.5px", width: "100%", background: C.border }} />
            <Channel label="← (C1, C2)" reverse color={C.alice} />
            <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "1px", textAlign: "center", lineHeight: 1.6 }}>
              intercept.<br />possible
            </div>
          </div>
        </div>

        {/* RIGHT — Bob */}
        <div style={{
          flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
          borderRadius: "10px", padding: "16px", display: "flex",
          flexDirection: "column", overflowY: "auto", minWidth: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
              background: C.bob + "18", border: `0.5px solid ${C.bob}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", color: C.bob, fontWeight: 500,
            }}>B</div>
            <div>
              <div style={{ fontSize: "12px", color: C.bob, fontWeight: 500 }}>Bob</div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px" }}>Expéditeur du message</div>
            </div>
          </div>

          <Label>CLÉ PUBLIQUE D'ALICE — REÇUE</Label>
          <KeyCard
            label="p, g, y"
            value={keys
              ? `p = ${keys.public_key.p}\ng = ${keys.public_key.g}\ny = ${keys.public_key.y}`
              : "en attente"}
            accent={C.bob}
          />

          {/* Message M input */}
          <Label>MESSAGE M (entier, 0 ≤ M &lt; p)</Label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
            <input
              id="elgamal-M"
              type="number" min="0"
              value={M}
              onChange={(e) => { setM(e.target.value); setCharInput(""); }}
              style={{ ...inputStyle, color: C.bob, flex: 1 }}
            />
          </div>

          {/* Char helper */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px", alignItems: "center" }}>
            <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", flexShrink: 0 }}>
              ou char :
            </div>
            <input
              maxLength={1}
              value={charInput}
              onChange={(e) => { setCharInput(e.target.value); applyChar(e.target.value); }}
              placeholder="A"
              style={{ ...inputStyle, width: "48px", textAlign: "center", color: C.bob }}
            />
            {keys && M !== "" && (
              <div style={{ fontSize: "9px", color: mValid ? C.success : C.error, letterSpacing: "0.5px" }}>
                {mValid ? `M = ${M} ✓` : `hors [0, ${keys.public_key.p - 1}]`}
              </div>
            )}
          </div>

          <button
            style={btn(C.bob, !keys || !mValid || loading === "encrypt")}
            disabled={!keys || !mValid || loading === "encrypt"}
            onClick={encryptMessage}
          >
            {loading === "encrypt" ? "⟳ chiffrement..." : "↑ Chiffrer (clé publique y)"}
          </button>

          <Divider />

          <Label>CHIFFRÉ ENVOYÉ À ALICE</Label>
          <div style={{
            background: C.bg, border: `0.5px solid ${ciphertext ? C.alice + "55" : C.border}`,
            borderRadius: "8px", padding: "10px 12px", minHeight: "52px",
            fontFamily: mono, fontSize: "11px", lineHeight: 1.7,
            color: ciphertext ? C.alice : C.muted, wordBreak: "break-all",
          }}>
            {ciphertext
              ? <><Code>C1</Code> = {ciphertext.C1}<br /><Code>C2</Code> = {ciphertext.C2}</>
              : "—"}
          </div>
        </div>
      </div>

      {/* ── Row 2: step log ──────────────────────────────────────────────────── */}
      <div style={{
        background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px",
        padding: "14px 16px", height: "220px", display: "flex", flexDirection: "column",
      }}>
        <Label>JOURNAL DES ÉTAPES — ELGAMAL</Label>
        <div ref={logRef} style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          {steps.length === 0 ? (
            <div style={{ fontSize: "11px", color: C.dim, fontFamily: mono, padding: "8px 0" }}>
              Générez les clés pour commencer...
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
