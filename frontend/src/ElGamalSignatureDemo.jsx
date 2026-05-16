/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";

async function postJson(path, body) {
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
  alice:   "#8fb3ff",   // blue-lavender for signer A
  bob:     "#5eead4",   // teal for verifier B
  code:    "#a3e635",
  error:   "#f87171",
  success: "#4ade80",
  warn:    "#fb923c",
  accent:  "#f6bd60",
};
const mono = "'DM Mono', 'Courier New', monospace";

// ─── Primitives ───────────────────────────────────────────────────────────────
const Label = ({ children, color }) => (
  <div style={{
    fontSize: "9px", color: color || C.dim, letterSpacing: "2px",
    marginBottom: "6px", fontFamily: mono,
  }}>{children}</div>
);

const Divider = () => (
  <div style={{ height: "0.5px", background: C.border, margin: "10px 0" }} />
);

function Code({ children }) {
  return (
    <code style={{
      fontFamily: mono, fontSize: "10px", color: C.accent,
      background: "#0a150e", border: `0.5px solid ${C.border}`,
      borderRadius: "3px", padding: "0 4px", wordBreak: "break-all",
    }}>{children}</code>
  );
}

const Readout = ({ value, accent, minH, small }) => (
  <div style={{
    background: C.bg, border: `0.5px solid ${accent ? accent + "55" : C.border}`,
    borderRadius: "7px", padding: "8px 12px", minHeight: small ? "34px" : (minH || "50px"),
    fontFamily: mono, fontSize: "10px", color: accent || C.muted,
    wordBreak: "break-all", lineHeight: 1.7, whiteSpace: "pre-wrap",
  }}>{value || "—"}</div>
);

const btn = (accent, disabled) => ({
  width: "100%", padding: "8px 12px",
  border: `0.5px solid ${disabled ? C.border : accent + "55"}`,
  borderRadius: "7px", background: disabled ? C.panel : accent + "16",
  color: disabled ? C.muted : accent, fontFamily: mono, fontSize: "11px",
  cursor: disabled ? "not-allowed" : "pointer", letterSpacing: "0.5px",
  transition: "all 0.15s", fontWeight: 500,
});

const inputStyle = {
  width: "100%", background: C.bg, border: `0.5px solid ${C.border}`,
  borderRadius: "6px", padding: "7px 10px", fontFamily: mono,
  fontSize: "12px", color: C.text, outline: "none", boxSizing: "border-box",
};

// ─── Step log entry ───────────────────────────────────────────────────────────
function StepEntry({ index, children }) {
  return (
    <div style={{
      display: "flex", gap: "10px", alignItems: "flex-start",
      padding: "9px 12px", marginBottom: "5px",
      background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "8px",
    }}>
      <div style={{
        width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
        background: C.accent + "22", border: `0.5px solid ${C.accent}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "9px", color: C.accent, fontFamily: mono, fontWeight: 500,
      }}>{index}</div>
      <div style={{ fontFamily: mono, fontSize: "11px", color: C.text, lineHeight: 1.7, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Flow column ──────────────────────────────────────────────────────────────
function FlowNode({ label, sub, color }) {
  return (
    <div style={{
      background: C.bg, border: `0.5px solid ${color ? color + "44" : C.border}`,
      borderRadius: "8px", padding: "7px 8px", textAlign: "center", width: "100%",
    }}>
      <div style={{ fontFamily: mono, fontSize: "9px", color: color || C.text, fontWeight: 500, marginBottom: "2px", lineHeight: 1.4 }}>{label}</div>
      <div style={{ fontFamily: mono, fontSize: "8px", color: C.muted, lineHeight: 1.4 }}>{sub}</div>
    </div>
  );
}

function FlowArrow({ color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", margin: "3px 0" }}>
      <div style={{ width: "1px", height: "16px", background: color || C.dim }} />
      <div style={{
        width: "6px", height: "6px", borderRight: `1.5px solid ${color || C.dim}`,
        borderBottom: `1.5px solid ${color || C.dim}`, transform: "rotate(45deg)",
      }} />
    </div>
  );
}

// ─── Formula box ─────────────────────────────────────────────────────────────
function FormulaBox({ title, lines }) {
  return (
    <div style={{
      background: C.panel, border: `0.5px solid ${C.border}`,
      borderRadius: "8px", padding: "12px 14px",
    }}>
      <div style={{ fontSize: "9px", color: C.accent, letterSpacing: "2px", marginBottom: "8px", fontFamily: mono }}>
        {title}
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: mono, fontSize: "11px", color: C.text, lineHeight: 1.8 }}>
          <Code>{l}</Code>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ElGamalSignatureDemo() {
  // Params
  const [p, setP]               = useState("467");
  const [g, setG]               = useState("");
  const [x, setX]               = useState("127");
  const [k, setK]               = useState("127");
  const [hashAlgo, setHashAlgo] = useState("sha256");
  const [message, setMessage]   = useState("Bonjour Bob");

  // State
  const [keys, setKeys]   = useState(null);
  const [signed, setSigned] = useState(null);
  const [verif, setVerif] = useState(null);
  const [steps, setSteps] = useState([]);
  const [status, setStatus] = useState({ text: "Générez les clés pour commencer.", kind: "" });
  const [loading, setLoading] = useState("");

  const logRef = useRef(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [steps]);

  const addStep = (content) => setSteps(s => [...s, content]);

  const resetSignature = () => {
    setSigned(null); setVerif(null); setSteps([]);
  };

  const intOrNull = (val) => {
    const v = val.trim();
    return v === "" ? null : parseInt(v, 10);
  };

  // ── Generate keys ─────────────────────────────────────────────────────────
  const generateKeys = async () => {
    resetSignature();
    setLoading("keys");
    setStatus({ text: "Génération de la clé publique y = g^x mod p...", kind: "" });
    try {
      const body = { p: intOrNull(p), g: intOrNull(g), x: intOrNull(x) };
      Object.keys(body).forEach(key => body[key] === null && delete body[key]);
      const result = await postJson("/signature/elgamal/generate-keys", body);
      setKeys(result);
      setG(String(result.public_key.g));
      setX(String(result.private_key.x));
      addStep(<>A choisit <Code>p={result.public_key.p}</Code>, <Code>g={result.public_key.g}</Code> et la clé privée <Code>x={result.private_key.x}</Code>.</>);
      addStep(<>A calcule la clé publique <Code>y = g^x mod p = {result.public_key.y}</Code>.</>);
      setStatus({ text: "Clés prêtes. Tu peux signer le message.", kind: "good" });
    } catch (err) {
      setStatus({ text: err.message, kind: "bad" });
    } finally {
      setLoading("");
    }
  };

  // ── Sign ──────────────────────────────────────────────────────────────────
  const signMessage = async () => {
    if (!keys) return;
    resetSignature();
    setLoading("sign");
    setStatus({ text: "Calcul de r et s...", kind: "" });
    try {
      const kVal = intOrNull(k);
      const result = await postJson("/signature/elgamal/sign", {
        message,
        hash_algorithm: hashAlgo,
        p: keys.public_key.p,
        g: keys.public_key.g,
        x: keys.private_key.x,
        ...(kVal !== null ? { k: kVal } : {}),
      });
      setSigned(result);
      setK(String(result.k));
      addStep(<>A choisit <Code>k={result.k}</Code> avec <Code>pgcd(k, p-1)=1</Code>.</>);
      addStep(<>A calcule <Code>r = g^k mod p = {result.r}</Code>.</>);
      addStep(<>A calcule <Code>s = k⁻¹(H(m) - x·r) mod (p-1) = {result.s}</Code>.</>);
      addStep(<>La signature envoyée est <Code>(r, s) = ({result.r}, {result.s})</Code>.</>);
      setStatus({ text: "Signature calculée. Bob peut vérifier.", kind: "good" });
    } catch (err) {
      setStatus({ text: err.message, kind: "bad" });
    } finally {
      setLoading("");
    }
  };

  // ── Verify ────────────────────────────────────────────────────────────────
  const verifyMessage = async () => {
    if (!keys || !signed) return;
    setLoading("verify");
    setStatus({ text: "Vérification de u = v...", kind: "" });
    try {
      const result = await postJson("/signature/elgamal/verify", {
        message,
        hash_algorithm: signed.hash_algorithm,
        r: signed.r,
        s: signed.s,
        p: keys.public_key.p,
        g: keys.public_key.g,
        y: keys.public_key.y,
      });
      setVerif(result);
      addStep(<>B vérifie d'abord <Code>0 &lt; r &lt; p</Code> : <Code>{String(result.range_valid)}</Code>.</>);
      addStep(<>B calcule <Code>u = y^r · r^s mod p = {result.u}</Code>.</>);
      addStep(<>B calcule <Code>v = g^H(m) mod p = {result.v}</Code>.</>);
      addStep(result.valid
        ? <><span style={{ color: C.success }}>✓</span> B accepte car <Code>u = v</Code>.</>
        : <><span style={{ color: C.error }}>✕</span> B refuse car <Code>u ≠ v</Code>.</>
      );
      setStatus({ text: "Vérification terminée.", kind: result.valid ? "good" : "bad" });
    } catch (err) {
      setStatus({ text: err.message, kind: "bad" });
    } finally {
      setLoading("");
    }
  };

  // ── Tamper test ───────────────────────────────────────────────────────────
  const tamperTest = async () => {
    if (!keys || !signed) return;
    setLoading("tamper");
    setStatus({ text: "Test avec message modifié et même signature...", kind: "" });
    try {
      const changed = `${message}!`;
      const result = await postJson("/signature/elgamal/verify", {
        message: changed,
        hash_algorithm: signed.hash_algorithm,
        r: signed.r,
        s: signed.s,
        p: keys.public_key.p,
        g: keys.public_key.g,
        y: keys.public_key.y,
      });
      setVerif({ ...result, tampered: true });
      addStep(<><span style={{ color: C.warn }}>⚠</span> Test anti-modification : avec <Code>{changed}</Code>, la vérification donne <Code>{String(result.valid)}</Code>.</>);
      setStatus({ text: "Le message modifié est rejeté.", kind: "bad" });
    } catch (err) {
      setStatus({ text: err.message, kind: "bad" });
    } finally {
      setLoading("");
    }
  };

  const keysReady  = !!keys;
  const canSign    = keysReady && message.trim() && !loading;
  const canVerify  = !!signed && !loading;

  const hashOptions = ["sha256", "sha1", "md5", "md4", "sha512"];

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      gap: "12px", fontFamily: mono, color: C.text, overflow: "hidden",
    }}>

      {/* ── Row 1: config bar ──────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>

        {/* Public params */}
        <div style={{
          flex: 1, background: C.panel, border: `0.5px solid ${C.accent}33`,
          borderRadius: "10px", padding: "13px",
        }}>
          <Label color={C.accent}>PARAMÈTRES PUBLICS — p, g</Label>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px" }}>p (premier)</div>
              <input id="elgsig-p" type="number" value={p} onChange={e => setP(e.target.value)}
                style={{ ...inputStyle, color: C.accent }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px" }}>g (générateur, auto si vide)</div>
              <input id="elgsig-g" type="number" value={g} onChange={e => setG(e.target.value)}
                placeholder="auto" style={{ ...inputStyle, color: C.accent }} />
            </div>
          </div>
        </div>

        {/* Secret of A */}
        <div style={{
          flex: 1, background: C.panel, border: `0.5px solid ${C.alice}33`,
          borderRadius: "10px", padding: "13px",
        }}>
          <Label color={C.alice}>SECRET DE A — clé privée</Label>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px" }}>x</div>
              <input id="elgsig-x" type="number" value={x} onChange={e => setX(e.target.value)}
                style={{ ...inputStyle, color: C.alice }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px" }}>k aléatoire</div>
              <input id="elgsig-k" type="number" value={k} onChange={e => setK(e.target.value)}
                style={{ ...inputStyle, color: C.alice }} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          width: "230px", flexShrink: 0, background: C.panel,
          border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "13px",
          display: "flex", flexDirection: "column", gap: "7px",
        }}>
          <Label>HACHAGE</Label>
          <select id="elgsig-hash" value={hashAlgo} onChange={e => setHashAlgo(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer", marginBottom: "2px" }}>
            {hashOptions.map(h => <option key={h} value={h}>{h.toUpperCase()}</option>)}
          </select>
          <button style={btn(C.alice, loading === "keys")}
            disabled={loading === "keys"} onClick={generateKeys}>
            {loading === "keys" ? "⟳ génération..." : "⇒ Générer les clés"}
          </button>
          {/* Status */}
          <div style={{
            fontSize: "10px", lineHeight: 1.5, marginTop: "2px",
            color: status.kind === "good" ? C.success : status.kind === "bad" ? C.error : C.muted,
          }}>{status.text}</div>
        </div>
      </div>

      {/* ── Row 2: arena ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", flex: 1, minHeight: 0 }}>

        {/* A PANEL */}
        <div style={{
          flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
          borderRadius: "10px", padding: "14px", display: "flex",
          flexDirection: "column", gap: "8px", overflowY: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: C.alice + "18", border: `0.5px solid ${C.alice}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", color: C.alice, fontWeight: 500,
            }}>A</div>
            <div>
              <div style={{ fontSize: "12px", color: C.alice, fontWeight: 500 }}>A signe</div>
              <div style={{ fontSize: "9px", color: C.muted }}>Signataire — détient la clé privée x</div>
            </div>
          </div>
          <Divider />

          <Label color={C.alice}>CLÉ PRIVÉE</Label>
          <Readout small value={keys ? `x = ${keys.private_key.x}` : null} accent={C.alice} />

          <Label>MESSAGE m</Label>
          <textarea id="elgsig-message" value={message} onChange={e => setMessage(e.target.value)}
            rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, color: C.text }} />

          <Label>EMPREINTE H(m)</Label>
          <Readout value={signed ? `${signed.hash_algorithm.toUpperCase()}: ${signed.hash}\nH(m) mod (p−1) = ${signed.hash_mod_p_minus_1}` : null} accent={C.code} />

          <Label>SIGNATURE (r, s)</Label>
          <Readout value={signed ? `r = ${signed.r}\ns = ${signed.s}\nk = ${signed.k}\nk⁻¹ mod (p−1) = ${signed.k_inverse}` : null} accent={C.alice} />

          <button style={btn(C.alice, !canSign || loading === "sign")}
            disabled={!canSign || loading === "sign"} onClick={signMessage}>
            {loading === "sign" ? "⟳ calcul r et s..." : "✍ Signer"}
          </button>
        </div>

        {/* FLOW COLUMN */}
        <div style={{
          width: "160px", flexShrink: 0, background: C.panel,
          border: `0.5px solid ${C.border}`, borderRadius: "10px",
          padding: "12px", display: "flex", flexDirection: "column",
          alignItems: "center", overflowY: "auto",
        }}>
          <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "2px", textAlign: "center", marginBottom: "8px" }}>
            CANAL PUBLIC
          </div>
          <FlowNode label="1. choisir k" sub="pgcd(k, p−1) = 1" color={C.accent} />
          <FlowArrow color={C.dim} />
          <FlowNode label="2. r = g^k mod p" sub="première partie" color={C.alice} />
          <FlowArrow color={C.dim} />
          <FlowNode label="3. s = k⁻¹(H−xr)" sub="mod (p−1)" color={C.alice} />
          <FlowArrow color={C.dim} />
          <FlowNode label="4. vérifier u=v" sub="clé publique y" color={verif ? (verif.valid ? C.success : C.error) : C.bob} />
        </div>

        {/* B PANEL */}
        <div style={{
          flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
          borderRadius: "10px", padding: "14px", display: "flex",
          flexDirection: "column", gap: "8px", overflowY: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: C.bob + "18", border: `0.5px solid ${C.bob}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", color: C.bob, fontWeight: 500,
            }}>B</div>
            <div>
              <div style={{ fontSize: "12px", color: C.bob, fontWeight: 500 }}>B vérifie</div>
              <div style={{ fontSize: "9px", color: C.muted }}>Destinataire — utilise la clé publique y</div>
            </div>
          </div>
          <Divider />

          <Label color={C.bob}>CLÉ PUBLIQUE</Label>
          <Readout small value={keys ? `p = ${keys.public_key.p}  g = ${keys.public_key.g}  y = ${keys.public_key.y}` : null} accent={C.bob} />

          <Label>u = y^r · r^s mod p</Label>
          <Readout value={verif ? String(verif.u) : null}
            accent={verif ? (verif.valid ? C.success : C.error) : null} />

          <Label>v = g^H(m) mod p</Label>
          <Readout value={verif ? String(verif.v) : null}
            accent={verif ? (verif.valid ? C.success : C.error) : null} />

          {/* Result */}
          <div style={{
            background: C.bg,
            border: `0.5px solid ${verif ? (verif.valid ? C.success + "66" : C.error + "66") : C.border}`,
            borderRadius: "8px", padding: "10px 14px", textAlign: "center",
            fontFamily: mono, fontSize: "12px", letterSpacing: "2px",
            color: verif ? (verif.valid ? C.success : C.error) : C.muted,
            transition: "all 0.3s",
          }}>
            {verif
              ? (verif.valid ? "✓ SIGNATURE VALIDE" : "✕ SIGNATURE INVALIDE")
              : "— en attente de vérification —"}
          </div>

          <button style={btn(C.bob, !canVerify || loading === "verify")}
            disabled={!canVerify || loading === "verify"} onClick={verifyMessage}>
            {loading === "verify" ? "⟳ vérification..." : "↓ Vérifier la signature"}
          </button>

          <button style={btn(C.warn, !canVerify || loading === "tamper")}
            disabled={!canVerify || loading === "tamper"} onClick={tamperTest}>
            {loading === "tamper" ? "⟳ test..." : "⚠ Tester avec message falsifié"}
          </button>
        </div>
      </div>

      {/* ── Row 3: formula + step log ────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
        <FormulaBox title="SIGNATURE" lines={[
          "r = g^k mod p",
          "s = k⁻¹(H(m) − x·r) mod (p−1)",
        ]} />
        <FormulaBox title="VÉRIFICATION" lines={[
          "0 < r < p",
          "u = y^r · r^s mod p",
          "v = g^H(m) mod p",
          "accepter si u = v",
        ]} />
      </div>

      {/* Step log */}
      <div style={{
        background: C.panel, border: `0.5px solid ${C.border}`,
        borderRadius: "10px", padding: "12px 14px",
        minHeight: "120px", maxHeight: "180px",
        display: "flex", flexDirection: "column", flexShrink: 0,
      }}>
        <Label>JOURNAL DES ÉTAPES — SIGNATURE ELGAMAL</Label>
        <div ref={logRef} style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          {steps.length === 0
            ? <div style={{ fontSize: "11px", color: C.dim, padding: "8px 0" }}>Générez les clés pour commencer...</div>
            : steps.map((s, i) => (
                <StepEntry key={i} index={i + 1}>{s}</StepEntry>
              ))
          }
        </div>
      </div>
    </div>
  );
}
