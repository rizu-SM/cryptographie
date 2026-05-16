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
  alice:   "#facc15",   // yellow
  bob:     "#60a5fa",   // blue
  neutral: "#ec4899",   // pink for shared public values
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

const KeyCard = ({ label, value, accent, success }) => (
  <div style={{
    background: C.bg, border: `0.5px solid ${success ? C.success + "55" : C.border}`, borderRadius: "8px",
    padding: "12px 14px", marginBottom: "10px",
  }}>
    <div style={{ fontSize: "9px", color: success ? C.success : C.muted, letterSpacing: "2px", marginBottom: "6px", fontFamily: mono }}>
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

function StepEntry({ index, actor, children }) {
  let color = C.neutral;
  if (actor === "Alice") color = C.alice;
  if (actor === "Bob") color = C.bob;
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

function ChannelCross({ labelA, labelB, colorA, colorB }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "0 10px" }}>
        <div style={{ fontSize: "9px", color: colorA, letterSpacing: "1px", fontFamily: mono }}>{labelA} →</div>
        <div style={{ fontSize: "9px", color: colorB, letterSpacing: "1px", fontFamily: mono }}>← {labelB}</div>
      </div>
      <div style={{ position: "relative", width: "80px", height: "20px" }}>
        {/* Ligne Alice -> Bob */}
        <div style={{
          position: "absolute", top: "4px", left: 0, width: "100%", height: "1px", background: colorA,
        }}>
          <div style={{
            position: "absolute", right: "-1px", top: "-4px", width: "8px", height: "8px",
            borderRight: `1.5px solid ${colorA}`, borderBottom: `1.5px solid ${colorA}`, transform: "rotate(-45deg)",
          }} />
        </div>
        {/* Ligne Bob -> Alice */}
        <div style={{
          position: "absolute", bottom: "4px", left: 0, width: "100%", height: "1px", background: colorB,
        }}>
          <div style={{
            position: "absolute", left: "-1px", top: "-4px", width: "8px", height: "8px",
            borderLeft: `1.5px solid ${colorB}`, borderBottom: `1.5px solid ${colorB}`, transform: "rotate(45deg)",
          }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function DiffieHellmanDemo() {
  const [p, setP] = useState("23");
  const [g, setG] = useState("5");
  const [a, setA] = useState("6");
  const [b, setB] = useState("15");
  
  const [result, setResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  const logRef = useRef(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [steps]);

  const addStep = (actor, content) => setSteps((s) => [...s, { actor, content }]);

  const reset = () => { setResult(null); setSteps([]); setStatus(""); setError(""); };

  const generateParams = async () => {
    setLoading("params"); setError(""); setStatus(""); reset();
    try {
      const data = await postJson("/protocoles/diffie-hellman/parameters", { bits: 16 });
      setP(data.p.toString());
      setG(data.g.toString());
      setStatus(`p = ${data.p}  ·  g = ${data.g}`);
      addStep("Système", <>Paramètres publics générés : <Code>p={data.p}</Code> et <Code>g={data.g}</Code></>);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  const runExchange = async () => {
    if (!p || !g || !a || !b) {
      setError("Tous les champs (p, g, a, b) sont requis.");
      return;
    }
    setLoading("exchange"); setError(""); reset();
    try {
      const data = await postJson("/protocoles/diffie-hellman/exchange", {
        p: parseInt(p, 10),
        g: parseInt(g, 10),
        alice_private: parseInt(a, 10),
        bob_private: parseInt(b, 10),
      });
      setResult(data);
      
      const same = data.same_secret;
      setStatus(same ? "Secret partagé identique des deux côtés." : "Les secrets ne correspondent pas.");
      if (!same) setError("Les secrets partagés sont différents.");

      addStep("Public", <>Alice et Bob s'accordent sur <Code>p={data.parameters.p}</Code> et <Code>g={data.parameters.g}</Code>.</>);
      addStep("Alice", <>Choisit son secret <Code>a={data.alice.private_key}</Code> et calcule <Code>A = g^a mod p = {data.alice.public_key}</Code>.</>);
      addStep("Bob", <>Choisit son secret <Code>b={data.bob.private_key}</Code> et calcule <Code>B = g^b mod p = {data.bob.public_key}</Code>.</>);
      addStep("Public", <>Alice envoie A à Bob. Bob envoie B à Alice.</>);
      addStep("Alice", <>Calcule le secret partagé <Code>K = B^a mod p = {data.alice.shared_secret}</Code>.</>);
      addStep("Bob", <>Calcule le secret partagé <Code>K = A^b mod p = {data.bob.shared_secret}</Code>.</>);
      if (same) {
        addStep("Système", <>Succès : Les secrets sont identiques (<Code>K={data.alice.shared_secret}</Code>).</>);
      } else {
        addStep("Erreur", <>Échec : K_A ({data.alice.shared_secret}) ≠ K_B ({data.bob.shared_secret}).</>);
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
    padding: "7px 10px", fontFamily: mono, fontSize: "12px", color: C.text, outline: "none",
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      gap: "14px", fontFamily: mono, color: C.text, overflow: "hidden",
    }}>

      {/* ── Row 1: Alice + Params/Channel + Bob ─────────────────────────────── */}
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
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px" }}>Secret a</div>
            </div>
          </div>

          <Label>CLÉ PRIVÉE (a)</Label>
          <input
            type="number" min="2" value={a} onChange={(e) => setA(e.target.value)}
            style={{ ...inputStyle, color: C.alice, marginBottom: "14px" }}
          />

          <Label>CLÉ PUBLIQUE (A)</Label>
          <KeyCard
            label="A = g^a mod p"
            value={result ? `${result.alice.public_key}\n${result.alice.formula_public}` : "—"}
            accent={C.alice}
          />

          <Divider />

          <Label>SECRET PARTAGÉ (K_A)</Label>
          <KeyCard
            label="K_A = B^a mod p"
            value={result ? `${result.alice.shared_secret}\n${result.alice.formula_secret}` : "—"}
            accent={result?.same_secret ? C.success : C.alice}
            success={result?.same_secret}
          />
        </div>

        {/* CENTER COLUMN — Params + Channel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "220px", flexShrink: 0 }}>
          
          <div style={{
            background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "16px",
          }}>
            <Label>PARAMÈTRES PUBLICS</Label>

            <div style={{ marginBottom: "10px", display: "flex", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px", letterSpacing: "1px" }}>p (premier)</div>
                <input type="number" min="3" value={p} onChange={(e) => setP(e.target.value)} style={{ ...inputStyle, color: C.neutral }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px", letterSpacing: "1px" }}>g (générateur)</div>
                <input type="number" min="2" value={g} onChange={(e) => setG(e.target.value)} style={{ ...inputStyle, color: C.neutral }} />
              </div>
            </div>

            <button style={{ ...btn(C.neutral, loading === "params"), marginBottom: "10px" }} disabled={loading === "params"} onClick={generateParams}>
              {loading === "params" ? "⟳ géné..." : "Générer p et g"}
            </button>

            <button style={btn(C.neutral, loading === "exchange")} disabled={loading === "exchange"} onClick={runExchange}>
              {loading === "exchange" ? "⟳ calcul..." : "Calculer l'échange"}
            </button>

            {(status || error) && (
              <div style={{
                marginTop: "10px", fontSize: "9px", letterSpacing: "0.5px", lineHeight: 1.6,
                color: error ? C.error : C.muted, wordBreak: "break-all", textAlign: "center",
              }}>
                {error ? `✕ ${error}` : status}
              </div>
            )}
          </div>

          <div style={{
            flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
            borderRadius: "10px", padding: "16px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px",
          }}>
            <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "2px", textAlign: "center" }}>CANAL PUBLIC</div>
            <ChannelCross labelA="A" labelB="B" colorA={C.alice} colorB={C.bob} />
            <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "1px", textAlign: "center", lineHeight: 1.6 }}>
              A et B circulent<br/>en clair
            </div>
          </div>
        </div>

        {/* RIGHT — Bob */}
        <div style={{
          width: "230px", flexShrink: 0, background: C.panel,
          border: `0.5px solid ${C.border}`, borderRadius: "10px",
          padding: "16px", display: "flex", flexDirection: "column", overflowY: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexDirection: "row-reverse", textAlign: "right" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
              background: C.bob + "18", border: `0.5px solid ${C.bob}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", color: C.bob, fontWeight: 500,
            }}>B</div>
            <div>
              <div style={{ fontSize: "12px", color: C.bob, fontWeight: 500 }}>Bob</div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px" }}>Secret b</div>
            </div>
          </div>

          <Label>CLÉ PRIVÉE (b)</Label>
          <input
            type="number" min="2" value={b} onChange={(e) => setB(e.target.value)}
            style={{ ...inputStyle, color: C.bob, marginBottom: "14px" }}
          />

          <Label>CLÉ PUBLIQUE (B)</Label>
          <KeyCard
            label="B = g^b mod p"
            value={result ? `${result.bob.public_key}\n${result.bob.formula_public}` : "—"}
            accent={C.bob}
          />

          <Divider />

          <Label>SECRET PARTAGÉ (K_B)</Label>
          <KeyCard
            label="K_B = A^b mod p"
            value={result ? `${result.bob.shared_secret}\n${result.bob.formula_secret}` : "—"}
            accent={result?.same_secret ? C.success : C.bob}
            success={result?.same_secret}
          />
        </div>
      </div>

      {/* ── Row 2: step log ──────────────────────────────────────────────────── */}
      <div style={{
        background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "10px",
        padding: "14px 16px", minHeight: "140px", maxHeight: "220px",
        display: "flex", flexDirection: "column", flexShrink: 0,
      }}>
        <Label>JOURNAL DES ÉTAPES — DIFFIE-HELLMAN</Label>
        <div ref={logRef} style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          {steps.length === 0 ? (
            <div style={{ fontSize: "11px", color: C.dim, fontFamily: mono, padding: "8px 0" }}>
              Entrez les paramètres et cliquez sur "Calculer l'échange"...
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
    </div>
  );
}
