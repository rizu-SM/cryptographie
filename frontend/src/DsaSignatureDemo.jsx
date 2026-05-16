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
  alice:   "#8fb3ff",   // signer A — blue
  bob:     "#5eead4",   // verifier B — teal
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
      borderRadius: "8px", padding: "8px 10px", textAlign: "center",
    }}>
      <div style={{ fontFamily: mono, fontSize: "10px", color: color || C.text, fontWeight: 500, marginBottom: "3px" }}>{label}</div>
      <div style={{ fontFamily: mono, fontSize: "9px", color: C.muted, lineHeight: 1.4 }}>{sub}</div>
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
export default function DsaSignatureDemo() {
  // Params
  const [p, setP]               = useState("467");
  const [q, setQ]               = useState("233");
  const [g, setG]               = useState("");
  const [h, setH]               = useState("2");
  const [x, setX]               = useState("127");
  const [k, setK]               = useState("127");
  const [hashAlgo, setHashAlgo] = useState("sha256");
  const [message, setMessage]   = useState("Bonjour Bob");

  // State
  const [keys, setKeys]     = useState(null);
  const [signed, setSigned] = useState(null);
  const [verif, setVerif]   = useState(null);
  const [steps, setSteps]   = useState([]);
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

  const cleanBody = (body) => {
    const out = { ...body };
    Object.keys(out).forEach(k => out[k] === null && delete out[k]);
    return out;
  };

  // ── Generate keys ─────────────────────────────────────────────────────────
  const generateKeys = async () => {
    resetSignature();
    setLoading("keys");
    setStatus({ text: "Génération de y = g^x mod p...", kind: "" });
    try {
      const result = await postJson("/signature/dsa/generate-keys", cleanBody({
        p: intOrNull(p),
        q: intOrNull(q),
        g: intOrNull(g),
        h: intOrNull(h),
        x: intOrNull(x),
      }));
      setKeys(result);
      setP(String(result.public_key.p));
      setQ(String(result.public_key.q));
      setG(String(result.public_key.g));
      setX(String(result.private_key.x));
      addStep(<>Paramètres publics : <Code>p={result.public_key.p}</Code>, <Code>q={result.public_key.q}</Code>, <Code>g={result.public_key.g}</Code>.</>);
      addStep(<>A garde <Code>x={result.private_key.x}</Code> et publie <Code>y = g^x mod p = {result.public_key.y}</Code>.</>);
      setStatus({ text: "Clés DSA prêtes. Tu peux signer.", kind: "good" });
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
      const result = await postJson("/signature/dsa/sign", cleanBody({
        message,
        hash_algorithm: hashAlgo,
        p: keys.public_key.p,
        q: keys.public_key.q,
        g: keys.public_key.g,
        x: keys.private_key.x,
        k: intOrNull(k),
      }));
      setSigned(result);
      setK(String(result.k));
      addStep(<>A choisit <Code>k={result.k}</Code> dans <Code>1...q-1</Code>.</>);
      addStep(<>A calcule <Code>r = (g^k mod p) mod q = {result.r}</Code>.</>);
      addStep(<>A calcule <Code>s = k⁻¹(H(m) + x·r) mod q = {result.s}</Code>.</>);
      addStep(<>La signature envoyée est <Code>(r, s) = ({result.r}, {result.s})</Code>.</>);
      setStatus({ text: "Signature calculée. Vérification disponible.", kind: "good" });
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
    setStatus({ text: "Calcul de w, u, v, z...", kind: "" });
    try {
      const result = await postJson("/signature/dsa/verify", {
        message,
        hash_algorithm: signed.hash_algorithm,
        r: signed.r,
        s: signed.s,
        p: keys.public_key.p,
        q: keys.public_key.q,
        g: keys.public_key.g,
        y: keys.public_key.y,
      });
      setVerif(result);
      addStep(<>B vérifie <Code>r</Code> et <Code>s</Code> dans <Code>[1, q-1]</Code> : <Code>{String(result.range_valid)}</Code>.</>);
      addStep(<>B calcule <Code>w = s⁻¹ mod q = {result.w}</Code>.</>);
      addStep(<>B calcule <Code>u = wH(m) mod q = {result.u}</Code> et <Code>v = rw mod q = {result.v}</Code>.</>);
      addStep(<>B calcule <Code>z = {result.z}</Code>, compare avec <Code>r = {signed.r}</Code>.</>);
      addStep(result.valid
        ? <><span style={{ color: C.success }}>✓</span> B accepte car <Code>z = r</Code>.</>
        : <><span style={{ color: C.error }}>✕</span> B refuse car <Code>z ≠ r</Code>.</>
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
      const result = await postJson("/signature/dsa/verify", {
        message: changed,
        hash_algorithm: signed.hash_algorithm,
        r: signed.r,
        s: signed.s,
        p: keys.public_key.p,
        q: keys.public_key.q,
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

  const keysReady = !!keys;
  const canSign   = keysReady && message.trim() && !loading;
  const canVerify = !!signed && !loading;

  const hashOptions = ["sha256", "sha1", "md5", "md4", "sha512"];

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      gap: "12px", fontFamily: mono, color: C.text, overflow: "hidden",
    }}>

      {/* ── Row 1: config bar ──────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>

        {/* Public params — p, q, g, h */}
        <div style={{
          flex: 1.4, background: C.panel, border: `0.5px solid ${C.accent}33`,
          borderRadius: "10px", padding: "13px",
        }}>
          <Label color={C.accent}>PARAMÈTRES PUBLICS — p, q, g</Label>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { id: "dsa-p", label: "p (premier)", val: p, set: setP, color: C.accent },
              { id: "dsa-q", label: "q (premier, q | p−1)", val: q, set: setQ, color: C.accent },
              { id: "dsa-g", label: "g (auto si vide)", val: g, set: setG, ph: "auto", color: C.accent },
              { id: "dsa-h", label: "h (pour calculer g)", val: h, set: setH, color: C.muted },
            ].map(f => (
              <div key={f.id} style={{ flex: 1 }}>
                <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px" }}>{f.label}</div>
                <input id={f.id} type="number" value={f.val} onChange={e => f.set(e.target.value)}
                  placeholder={f.ph || ""} style={{ ...inputStyle, color: f.color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Secrets of A */}
        <div style={{
          flex: 0.8, background: C.panel, border: `0.5px solid ${C.alice}33`,
          borderRadius: "10px", padding: "13px",
        }}>
          <Label color={C.alice}>SECRETS DE A — x, k</Label>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px" }}>x (clé privée)</div>
              <input id="dsa-x" type="number" value={x} onChange={e => setX(e.target.value)}
                style={{ ...inputStyle, color: C.alice }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px" }}>k (aléatoire)</div>
              <input id="dsa-k" type="number" value={k} onChange={e => setK(e.target.value)}
                style={{ ...inputStyle, color: C.alice }} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          width: "210px", flexShrink: 0, background: C.panel,
          border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "13px",
          display: "flex", flexDirection: "column", gap: "7px",
        }}>
          <Label>HACHAGE</Label>
          <select id="dsa-hash" value={hashAlgo} onChange={e => setHashAlgo(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer", marginBottom: "2px" }}>
            {hashOptions.map(h => <option key={h} value={h}>{h.toUpperCase()}</option>)}
          </select>
          <button style={btn(C.alice, loading === "keys")}
            disabled={loading === "keys"} onClick={generateKeys}>
            {loading === "keys" ? "⟳ génération..." : "⇒ Générer les clés"}
          </button>
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
          <textarea id="dsa-message" value={message} onChange={e => setMessage(e.target.value)}
            rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, color: C.text }} />

          <Label>EMPREINTE H(m)</Label>
          <Readout value={signed
            ? `${signed.hash_algorithm.toUpperCase()}: ${signed.hash}\nH(m) mod q = ${signed.hash_mod_q}`
            : null} accent={C.code} />

          <Label>SIGNATURE (r, s)</Label>
          <Readout value={signed
            ? `r = ${signed.r}\ns = ${signed.s}\nk = ${signed.k}\nk⁻¹ mod q = ${signed.k_inverse}`
            : null} accent={C.alice} />

          <button style={btn(C.alice, !canSign || loading === "sign")}
            disabled={!canSign || loading === "sign"} onClick={signMessage}>
            {loading === "sign" ? "⟳ calcul r et s..." : "✍ Signer"}
          </button>
        </div>

        {/* FLOW COLUMN */}
        <div style={{
          width: "130px", flexShrink: 0, background: C.panel,
          border: `0.5px solid ${C.border}`, borderRadius: "10px",
          padding: "12px", display: "flex", flexDirection: "column",
          alignItems: "center", overflowY: "auto",
        }}>
          <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "2px", textAlign: "center", marginBottom: "8px" }}>
            PROTOCOLE DSA
          </div>
          <FlowNode label="1. choisir k < q" sub="k dans 1…q−1" color={C.accent} />
          <FlowArrow color={C.dim} />
          <FlowNode label="2. r" sub="(g^k mod p) mod q" color={C.alice} />
          <FlowArrow color={C.dim} />
          <FlowNode label="3. s" sub="k⁻¹(H(m)+xr) mod q" color={C.alice} />
          <FlowArrow color={C.dim} />
          <FlowNode label="4. z = r ?" sub="vérification finale" color={verif ? (verif.valid ? C.success : C.error) : C.bob} />
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
          <Readout small
            value={keys ? `p=${keys.public_key.p}  q=${keys.public_key.q}  g=${keys.public_key.g}  y=${keys.public_key.y}` : null}
            accent={C.bob} />

          <Label>w, u, v (intermédiaires)</Label>
          <Readout value={verif
            ? `w = ${verif.w}\nu = ${verif.u}\nv = ${verif.v}`
            : null} accent={verif ? (verif.valid ? C.success : C.error) : null} />

          <Label>z = ((g^u · y^v) mod p) mod q</Label>
          <Readout value={verif
            ? `z = ${verif.z}\n${verif.formula_z}`
            : null} accent={verif ? (verif.valid ? C.success : C.error) : null} />

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

      {/* ── Row 3: formulas ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
        <FormulaBox title="SIGNATURE DSA" lines={[
          "r = (g^k mod p) mod q",
          "s = k⁻¹(H(m) + x·r) mod q",
        ]} />
        <FormulaBox title="VÉRIFICATION DSA" lines={[
          "w = s⁻¹ mod q",
          "u = w·H(m) mod q",
          "v = r·w mod q",
          "z = ((g^u · y^v) mod p) mod q  — accepter si z = r",
        ]} />
      </div>

      {/* ── Step log ─────────────────────────────────────────────────────── */}
      <div style={{
        background: C.panel, border: `0.5px solid ${C.border}`,
        borderRadius: "10px", padding: "12px 14px", height: "160px",
        display: "flex", flexDirection: "column", flexShrink: 0,
      }}>
        <Label>JOURNAL DES ÉTAPES — SIGNATURE DSA</Label>
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
