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

// ─── Design tokens (matching App.jsx palette) ─────────────────────────────────
const C = {
  bg:      "#080a09",
  panel:   "#0f1210",
  border:  "#1c201e",
  text:    "#e2e8e4",
  muted:   "#4a5450",
  dim:     "#2e3a35",
  alice:   "#facc15",   // yellow — matches RSA color in sidebar
  bob:     "#60a5fa",   // blue
  code:    "#a3e635",   // lime for code values
  error:   "#f87171",
  success: "#4ade80",
};

const mono = "'DM Mono', 'Courier New', monospace";

// ─── Tiny reusable pieces ──────────────────────────────────────────────────────
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

// ─── Inline code span ──────────────────────────────────────────────────────────
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

// ─── Channel arrow (desktop only) ─────────────────────────────────────────────
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
function RsaToolMode() {
  const [subTab, setSubTab]         = useState("encrypt"); // 'encrypt' | 'decrypt'

  // Encrypt inputs
  const [tN, setTN]                 = useState("");
  const [tE, setTE]                 = useState("");
  const [tMsg, setTMsg]             = useState("");
  const [tCipher, setTCipher]       = useState(null);   // array of ints

  // Decrypt inputs
  const [dN, setDN]                 = useState("");
  const [dD, setDD]                 = useState("");
  const [dCipher, setDCipher]       = useState("");    // raw comma text
  const [dPlain, setDPlain]         = useState("");

  const [loading, setLoading]       = useState("");
  const [error, setError]           = useState("");

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

  const handleEncrypt = async () => {
    setError(""); setTCipher(null);
    if (!tN || !tE || !tMsg.trim()) { setError("n, e et le message sont requis."); return; }
    setLoading("enc");
    try {
      const res = await fetch(`${API_BASE}/rsa/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: tMsg.trim(), n: parseInt(tN), e: parseInt(tE) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erreur serveur");
      setTCipher(data.ciphertext);
    } catch (err) { setError(err.message); }
    finally { setLoading(""); }
  };

  const handleDecrypt = async () => {
    setError(""); setDPlain("");
    if (!dN || !dD || !dCipher.trim()) { setError("n, d et le chiffré sont requis."); return; }
    const cArr = dCipher.split(/[,\s]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (!cArr.length) { setError("Le chiffré doit être une liste d'entiers séparés par des virgules."); return; }
    setLoading("dec");
    try {
      const res = await fetch(`${API_BASE}/rsa/decrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciphertext: cArr, n: parseInt(dN), d: parseInt(dD) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erreur serveur");
      setDPlain(data.plaintext);
    } catch (err) { setError(err.message); }
    finally { setLoading(""); }
  };

  const tabStyle = (active, accent) => ({
    flex: 1, padding: "8px 0", fontFamily: mono, fontSize: "11px", letterSpacing: "1px",
    border: `0.5px solid ${active ? accent + "55" : C.border}`,
    background: active ? accent + "14" : "transparent",
    color: active ? accent : C.muted,
    cursor: "pointer", borderRadius: "6px", transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "14px", fontFamily: mono, color: C.text }}>

      {/* Sub-tab switcher */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button style={tabStyle(subTab === "encrypt", C.bob)} onClick={() => { setSubTab("encrypt"); setError(""); }}>
          ↑ CHIFFRER
        </button>
        <button style={tabStyle(subTab === "decrypt", C.alice)} onClick={() => { setSubTab("decrypt"); setError(""); }}>
          ↓ DÉCHIFFRER
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: C.error + "12", border: `0.5px solid ${C.error}44`,
          borderRadius: "8px", padding: "10px 14px", fontSize: "11px",
          color: C.error, fontFamily: mono,
        }}>
          ✕ {error}
        </div>
      )}

      {/* ── ENCRYPT panel ─────────────────────────────────────────────────── */}
      {subTab === "encrypt" && (
        <div style={{ display: "flex", gap: "14px", flex: 1, minHeight: 0 }}>

          {/* Inputs */}
          <div style={{
            flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
            borderRadius: "10px", padding: "18px", display: "flex",
            flexDirection: "column", gap: "14px", overflowY: "auto",
          }}>
            <div style={{ fontSize: "9px", color: C.bob, letterSpacing: "2px", marginBottom: "2px" }}>CLÉ PUBLIQUE</div>

            <div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "5px" }}>n — module RSA</div>
              <input id="tool-enc-n" value={tN} onChange={e => setTN(e.target.value)}
                placeholder="ex: 77" style={{ ...inputStyle, color: C.bob }} />
            </div>

            <div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "5px" }}>e — exposant public</div>
              <input id="tool-enc-e" value={tE} onChange={e => setTE(e.target.value)}
                placeholder="ex: 13" style={{ ...inputStyle, color: C.bob }} />
            </div>

            <div style={{ height: "0.5px", background: C.border }} />

            <div style={{ fontSize: "9px", color: C.bob, letterSpacing: "2px" }}>MESSAGE</div>
            <div>
              <textarea id="tool-enc-msg" value={tMsg} onChange={e => setTMsg(e.target.value)}
                placeholder="Texte à chiffrer..." rows={4}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, color: C.text }} />
            </div>

            <button
              style={btn(C.bob, loading === "enc" || !tN || !tE || !tMsg.trim())}
              disabled={loading === "enc" || !tN || !tE || !tMsg.trim()}
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

            {tCipher ? (
              <>
                <div style={{
                  background: C.bg, border: `0.5px solid ${C.bob}55`, borderRadius: "8px",
                  padding: "14px", fontFamily: mono, fontSize: "11px",
                  color: C.bob, wordBreak: "break-all", lineHeight: 1.8, marginBottom: "14px",
                }}>
                  [ {tCipher.join(",  ")} ]
                </div>

                {/* Per-char breakdown */}
                <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "10px" }}>DÉTAIL PAR CARACTÈRE</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {tMsg.trim().split("").map((ch, i) => (
                    <div key={i} style={{
                      background: C.bg, border: `0.5px solid ${C.border}`,
                      borderRadius: "6px", padding: "6px 10px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: "13px", color: C.text, fontFamily: mono }}>{ch}</div>
                      <div style={{ fontSize: "9px", color: C.muted }}>({ch.charCodeAt(0)})</div>
                      <div style={{ fontSize: "9px", color: C.dim, margin: "2px 0" }}>→</div>
                      <div style={{ fontSize: "10px", color: C.bob }}>{tCipher[i]}</div>
                    </div>
                  ))}
                </div>

                {/* Copy helper */}
                <button
                  style={{ ...btn(C.muted, false), marginTop: "auto", paddingTop: "8px" }}
                  onClick={() => navigator.clipboard.writeText(tCipher.join(", "))}
                >
                  ⎘ Copier les valeurs chiffrées
                </button>
              </>
            ) : (
              <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", color: C.dim,
              }}>
                Le résultat apparaîtra ici après chiffrement.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DECRYPT panel ─────────────────────────────────────────────────── */}
      {subTab === "decrypt" && (
        <div style={{ display: "flex", gap: "14px", flex: 1, minHeight: 0 }}>

          {/* Inputs */}
          <div style={{
            flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
            borderRadius: "10px", padding: "18px", display: "flex",
            flexDirection: "column", gap: "14px", overflowY: "auto",
          }}>
            <div style={{ fontSize: "9px", color: C.alice, letterSpacing: "2px", marginBottom: "2px" }}>CLÉ PRIVÉE</div>

            <div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "5px" }}>n — module RSA</div>
              <input id="tool-dec-n" value={dN} onChange={e => setDN(e.target.value)}
                placeholder="ex: 77" style={{ ...inputStyle, color: C.alice }} />
            </div>

            <div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "5px" }}>d — exposant privé</div>
              <input id="tool-dec-d" value={dD} onChange={e => setDD(e.target.value)}
                placeholder="ex: 37" style={{ ...inputStyle, color: C.alice }} />
            </div>

            <div style={{ height: "0.5px", background: C.border }} />

            <div style={{ fontSize: "9px", color: C.alice, letterSpacing: "2px" }}>MESSAGE CHIFFRÉ</div>
            <div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "5px" }}>Liste d'entiers séparés par des virgules</div>
              <textarea id="tool-dec-cipher" value={dCipher} onChange={e => setDCipher(e.target.value)}
                placeholder="ex: 57, 8, 64, 64, 36" rows={4}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, color: C.text }} />
            </div>

            <button
              style={btn(C.alice, loading === "dec" || !dN || !dD || !dCipher.trim())}
              disabled={loading === "dec" || !dN || !dD || !dCipher.trim()}
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

            {dPlain ? (
              <>
                <div style={{
                  background: C.bg, border: `0.5px solid ${C.success}55`, borderRadius: "8px",
                  padding: "14px", fontFamily: mono, fontSize: "20px",
                  color: C.success, letterSpacing: "4px", marginBottom: "14px",
                  textAlign: "center",
                }}>
                  {dPlain}
                </div>

                {/* Per-char breakdown */}
                <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", marginBottom: "10px" }}>DÉTAIL PAR CARACTÈRE</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {dCipher.split(/[,\s]+/).filter(Boolean).map((cv, i) => (
                    <div key={i} style={{
                      background: C.bg, border: `0.5px solid ${C.border}`,
                      borderRadius: "6px", padding: "6px 10px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: "10px", color: C.alice, fontFamily: mono }}>{cv}</div>
                      <div style={{ fontSize: "9px", color: C.dim, margin: "2px 0" }}>→</div>
                      <div style={{ fontSize: "13px", color: C.text }}>{dPlain[i] || ""}</div>
                      <div style={{ fontSize: "9px", color: C.muted }}>({dPlain.charCodeAt(i) || ""})</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", color: C.dim,
              }}>
                Le message déchiffré apparaîtra ici.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function RsaDemo() {
  const [mode, setMode] = useState("sim"); // 'sim' | 'tool'
  const [p, setP] = useState("7");
  const [q, setQ] = useState("11");
  const [message, setMessage] = useState("HI");
  const [keys, setKeys] = useState(null);
  const [ciphertext, setCiphertext] = useState(null);
  const [plaintext, setPlaintext] = useState("");
  const [steps, setSteps] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
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

  const reset = () => { setCiphertext(null); setPlaintext(""); };

  // ── Generate keys ────────────────────────────────────────────────────────────
  const generateKeys = async () => {
    setLoading("keys"); setError(""); setStatus(""); reset(); setSteps([]);
    try {
      const k = await postJson("/rsa/generate-keys", {
        p: parseInt(p, 10), q: parseInt(q, 10),
      });
      setKeys(k);
      setStatus(`n = ${k.n}  ·  phi(n) = ${k.phi}  ·  e = ${k.public_key.e}  ·  d = ${k.private_key.d}`);
      setSteps([
        { actor: "Alice", content: <><Code>p = {k.p}</Code> et <Code>q = {k.q}</Code> — deux nombres premiers choisis</> },
        { actor: "Alice", content: <><Code>n = p × q = {k.p} × {k.q} = {k.n}</Code> — module RSA</> },
        { actor: "Alice", content: <><Code>φ(n) = (p−1)(q−1) = {k.p - 1} × {k.q - 1} = {k.phi}</Code></> },
        { actor: "Alice", content: <><Code>e = {k.public_key.e}</Code> — exposant public tel que pgcd(e, φ(n)) = 1</> },
        { actor: "Alice", content: <><Code>d = {k.private_key.d}</Code> — clé privée via algorithme d'Euclide étendu</> },
        { actor: "Alice", content: <>publie <Code>(n={k.n}, e={k.public_key.e})</Code> · garde <Code>d={k.private_key.d}</Code> secret</> },
        { actor: "Bob",   content: <>reçoit la clé publique d'Alice : <Code>(n={k.n}, e={k.public_key.e})</Code></> },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  // ── Encrypt ──────────────────────────────────────────────────────────────────
  const encryptMessage = async () => {
    if (!keys || !message.trim()) return;
    setLoading("encrypt"); setError(""); setPlaintext("");
    try {
      const data = await postJson("/rsa/encrypt", {
        text: message.trim(), n: keys.n, e: keys.public_key.e,
      });
      setCiphertext(data.ciphertext);
      const chars = message.trim().split("");
      addStep("Bob", (
        <>
          chiffre avec <Code>c = m^{keys.public_key.e} mod {keys.n}</Code> :{" "}
          {chars.map((ch, i) => (
            <span key={i}>
              <Code>{ch}</Code>({ch.charCodeAt(0)})→<Code>{data.ciphertext[i]}</Code>
              {i < chars.length - 1 ? "  " : ""}
            </span>
          ))}
        </>
      ));
      addStep("Bob", <>envoie à Alice : <Code>[{data.ciphertext.join(", ")}]</Code></>);
    } catch (err) {
      setError(err.message); setCiphertext(null);
    } finally {
      setLoading("");
    }
  };

  // ── Decrypt ──────────────────────────────────────────────────────────────────
  const decryptMessage = async () => {
    if (!keys || !ciphertext) return;
    setLoading("decrypt"); setError("");
    try {
      const data = await postJson("/rsa/decrypt", {
        ciphertext, n: keys.n, d: keys.private_key.d,
      });
      setPlaintext(data.plaintext);
      addStep("Alice", (
        <>
          déchiffre avec <Code>m = c^{keys.private_key.d} mod {keys.n}</Code> :{" "}
          {ciphertext.map((v, i) => (
            <span key={i}>
              <Code>{v}</Code>→<Code>{data.plaintext.charCodeAt(i)}</Code>({data.plaintext[i]})
              {i < ciphertext.length - 1 ? "  " : ""}
            </span>
          ))}
        </>
      ));
      addStep("Alice", <>message récupéré : <Code>"{data.plaintext}"</Code></>);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  // ── Shared button style factory ──────────────────────────────────────────────
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

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      gap: "14px", fontFamily: mono, color: C.text, overflow: "hidden",
    }}>

      {/* ── Mode switcher ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button style={modeTabStyle(mode === "sim", C.alice)} onClick={() => setMode("sim")}>
          SIMULATION
        </button>
        <button style={modeTabStyle(mode === "tool", C.bob)} onClick={() => setMode("tool")}>
          OUTIL
        </button>
        <div style={{ marginLeft: "auto", fontSize: "9px", color: C.dim, letterSpacing: "1px" }}>
          {mode === "sim" ? "Alice & Bob — démonstration pédagogique" : "Chiffrement / Déchiffrement direct"}
        </div>
      </div>

      {mode === "tool" && <RsaToolMode />}
      {mode !== "tool" && <>

      {/* ── Row 1: params + key cards + channel ─────────────────────────────── */}
      <div style={{ display: "flex", gap: "14px", flex: 1, minHeight: 0 }}>

        {/* LEFT — Alice */}
        <div style={{
          width: "230px", flexShrink: 0, background: C.panel,
          border: `0.5px solid ${C.border}`, borderRadius: "10px",
          padding: "16px", display: "flex", flexDirection: "column", overflowY: "auto",
        }}>
          {/* Actor header */}
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
            label="n, d"
            value={keys ? `n = ${keys.n}\nd = ${keys.private_key.d}` : "en attente de génération"}
            accent={C.alice}
          />

          <Label>CLÉ PUBLIQUE — PARTAGÉE</Label>
          <KeyCard
            label="n, e"
            value={keys ? `n = ${keys.n}\ne = ${keys.public_key.e}` : "en attente de génération"}
            accent={C.bob}
          />

          <Divider />

          <Label>MESSAGE DÉCHIFFRÉ</Label>
          <div style={{
            background: C.bg, border: `0.5px solid ${plaintext ? C.success + "55" : C.border}`,
            borderRadius: "8px", padding: "10px 12px", minHeight: "42px",
            fontFamily: mono, fontSize: "13px", color: plaintext ? C.success : C.muted,
            letterSpacing: "2px", marginBottom: "10px",
          }}>
            {plaintext || "—"}
          </div>

          <button
            style={btn(C.alice, !ciphertext || loading === "decrypt")}
            disabled={!ciphertext || loading === "decrypt"}
            onClick={decryptMessage}
          >
            {loading === "decrypt" ? "⟳ déchiffrement..." : "↓ Déchiffrer (clé privée)"}
          </button>
        </div>

        {/* CENTER COLUMN — params + channel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "190px", flexShrink: 0 }}>

          {/* Params card */}
          <div style={{
            background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px",
            padding: "16px",
          }}>
            <Label>PARAMÈTRES RSA</Label>

            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px", letterSpacing: "1px" }}>p (premier)</div>
              <input
                id="rsa-p" type="number" min="2" value={p}
                onChange={(e) => setP(e.target.value)}
                style={{ ...inputStyle, color: C.alice }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px", letterSpacing: "1px" }}>q (premier)</div>
              <input
                id="rsa-q" type="number" min="2" value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ ...inputStyle, color: C.alice }}
              />
            </div>

            <button
              style={btn(C.alice, loading === "keys")}
              disabled={loading === "keys"}
              onClick={generateKeys}
            >
              {loading === "keys" ? "⟳ génération..." : "⇒ Générer les clés"}
            </button>

            {/* Status / error line */}
            {(status || error) && (
              <div style={{
                marginTop: "10px", fontSize: "9px", letterSpacing: "0.5px", lineHeight: 1.6,
                color: error ? C.error : C.muted, wordBreak: "break-all",
              }}>
                {error ? `✕ ${error}` : status}
              </div>
            )}
          </div>

          {/* Channel visual */}
          <div style={{
            flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
            borderRadius: "10px", padding: "16px",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: "20px",
          }}>
            <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "2px", textAlign: "center" }}>CANAL PUBLIC</div>
            <Channel label="clé publique →" color={C.bob} />
            <div style={{ height: "0.5px", width: "100%", background: C.border }} />
            <Channel label="← chiffré" reverse color={C.alice} />
            <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "1px", textAlign: "center", lineHeight: 1.6 }}>
              intercept.<br/>possible
            </div>
          </div>
        </div>

        {/* RIGHT — Bob */}
        <div style={{
          flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
          borderRadius: "10px", padding: "16px", display: "flex",
          flexDirection: "column", overflowY: "auto", minWidth: 0,
        }}>
          {/* Actor header */}
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
            label="n, e"
            value={keys ? `n = ${keys.n}\ne = ${keys.public_key.e}` : "en attente"}
            accent={C.bob}
          />

          <Label>MESSAGE À ENVOYER</Label>
          <textarea
            id="rsa-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex: HI"
            rows={3}
            style={{
              ...inputStyle, resize: "vertical", lineHeight: 1.6,
              marginBottom: "10px", color: C.bob,
            }}
          />

          <button
            style={btn(C.bob, !keys || !message.trim() || loading === "encrypt")}
            disabled={!keys || !message.trim() || loading === "encrypt"}
            onClick={encryptMessage}
          >
            {loading === "encrypt" ? "⟳ chiffrement..." : "↑ Chiffrer (clé publique)"}
          </button>

          <Divider />

          <Label>CHIFFRÉ ENVOYÉ À ALICE</Label>
          <div style={{
            background: C.bg, border: `0.5px solid ${ciphertext ? C.alice + "55" : C.border}`,
            borderRadius: "8px", padding: "10px 12px", minHeight: "42px",
            fontFamily: mono, fontSize: "11px", color: ciphertext ? C.alice : C.muted,
            wordBreak: "break-all", lineHeight: 1.7,
          }}>
            {ciphertext ? `[ ${ciphertext.join(",  ")} ]` : "—"}
          </div>
        </div>
      </div>

      {/* ── Row 2: step log ──────────────────────────────────────────────────── */}
      <div style={{
        background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px",
        padding: "14px 16px", height: "220px", display: "flex", flexDirection: "column",
      }}>
        <Label>JOURNAL DES ÉTAPES — RSA</Label>
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
