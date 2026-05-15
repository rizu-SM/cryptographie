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
  if (!res.ok || data.error) throw new Error(data.error || "Erreur serveur");
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
  alice:   "#facc15",   // yellow
  bob:     "#60a5fa",   // blue
  code:    "#a3e635",
  error:   "#f87171",
  success: "#4ade80",
  warn:    "#fb923c",
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
  <div style={{ height: "0.5px", background: C.border, margin: "12px 0" }} />
);

function Code({ children }) {
  return (
    <code style={{
      fontFamily: mono, fontSize: "10px", color: C.code,
      background: "#0a150e", border: `0.5px solid ${C.border}`,
      borderRadius: "3px", padding: "0 4px", wordBreak: "break-all",
    }}>{children}</code>
  );
}

const Readout = ({ value, accent, minH }) => (
  <div style={{
    background: C.bg, border: `0.5px solid ${accent ? accent + "55" : C.border}`,
    borderRadius: "7px", padding: "8px 12px", minHeight: minH || "38px",
    fontFamily: mono, fontSize: "10px", color: accent || C.muted,
    wordBreak: "break-all", lineHeight: 1.7,
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
function StepEntry({ index, actor, children }) {
  const color = actor === "Alice" ? C.alice : actor === "Bob" ? C.bob : C.muted;
  return (
    <div style={{
      display: "flex", gap: "10px", alignItems: "flex-start",
      padding: "9px 12px", marginBottom: "5px",
      background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: "8px",
    }}>
      <div style={{
        width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
        background: color + "22", border: `0.5px solid ${color}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "9px", color, fontFamily: mono, fontWeight: 500,
      }}>{index}</div>
      <div style={{ fontFamily: mono, fontSize: "11px", color: C.text, lineHeight: 1.7, flex: 1 }}>
        <span style={{
          display: "inline-block", padding: "1px 7px", borderRadius: "4px",
          fontSize: "9px", letterSpacing: "1px", marginRight: "6px",
          background: color + "18", color, border: `0.5px solid ${color}44`,
        }}>{actor}</span>
        {children}
      </div>
    </div>
  );
}

// ─── Flow arrow column ────────────────────────────────────────────────────────
function FlowArrow({ label, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", margin: "6px 0" }}>
      <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "1px", textAlign: "center", fontFamily: mono }}>{label}</div>
      <div style={{ width: "1px", height: "20px", background: color || C.dim }} />
      <div style={{
        width: "6px", height: "6px", borderRight: `1.5px solid ${color || C.dim}`,
        borderBottom: `1.5px solid ${color || C.dim}`, transform: "rotate(45deg)",
      }} />
    </div>
  );
}

function FlowNode({ label, sub, color }) {
  return (
    <div style={{
      background: C.bg, border: `0.5px solid ${color ? color + "44" : C.border}`,
      borderRadius: "8px", padding: "8px 10px", textAlign: "center",
    }}>
      <div style={{ fontFamily: mono, fontSize: "11px", color: color || C.text, fontWeight: 500, marginBottom: "3px" }}>{label}</div>
      <div style={{ fontFamily: mono, fontSize: "9px", color: C.muted, lineHeight: 1.4 }}>{sub}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RsaSignatureDemo() {
  // Alice key params
  const [aP, setAP] = useState("61");
  const [aQ, setAQ] = useState("53");
  // Bob key params
  const [bP, setBP] = useState("67");
  const [bQ, setBQ] = useState("71");
  // Hash
  const [hashAlgo, setHashAlgo] = useState("sha256");
  // Message
  const [message, setMessage] = useState("HI");

  // State
  const [aliceKeys, setAliceKeys] = useState(null);
  const [bobKeys, setBobKeys]     = useState(null);
  const [packet, setPacket]       = useState(null);  // result of sign-and-encrypt
  const [verif, setVerif]         = useState(null);  // result of decrypt-and-verify
  const [steps, setSteps]         = useState([]);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState("");

  const logRef = useRef(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [steps]);

  const addStep = (actor, content) => setSteps(s => [...s, { actor, content }]);

  const resetFlow = (keepKeys = true) => {
    setPacket(null); setVerif(null); setError("");
    if (!keepKeys) { setAliceKeys(null); setBobKeys(null); }
    setSteps([]);
  };

  // ── Generate both key pairs ────────────────────────────────────────────────
  const generateKeys = async () => {
    resetFlow(false);
    setLoading("keys");
    try {
      const [ak, bk] = await Promise.all([
        postJson("/rsa/generate-keys", { p: parseInt(aP), q: parseInt(aQ) }),
        postJson("/rsa/generate-keys", { p: parseInt(bP), q: parseInt(bQ) }),
      ]);
      setAliceKeys(ak);
      setBobKeys(bk);
      addStep("Alice", <>génère sa paire RSA : clé publique <Code>(n={ak.n}, e={ak.public_key.e})</Code>, clé privée <Code>d={ak.private_key.d}</Code></>);
      addStep("Bob",   <>génère sa paire RSA : clé publique <Code>(n={bk.n}, e={bk.public_key.e})</Code>, clé privée <Code>d={bk.private_key.d}</Code></>);
    } catch (err) { setError(err.message); }
    finally { setLoading(""); }
  };

  // ── Sign + encrypt ─────────────────────────────────────────────────────────
  const signAndEncrypt = async () => {
    if (!aliceKeys || !bobKeys || !message.trim()) return;
    resetFlow(true);
    setLoading("sign");
    try {
      const pkt = await postJson("/signature/rsa/sign-and-encrypt", {
        message: message.trim(),
        hash_algorithm: hashAlgo,
        signer_n:   aliceKeys.n,
        signer_d:   aliceKeys.private_key.d,
        receiver_n: bobKeys.n,
        receiver_e: bobKeys.public_key.e,
      });
      setPacket(pkt);
      addStep("Alice", <>calcule l'empreinte <Code>E = H(M)</Code>, valeur mod n_A = <Code>{pkt.hash_mod_n}</Code></>);
      addStep("Alice", <>signe : <Code>S = E^d_A mod n_A = {pkt.signature}</Code></>);
      addStep("Alice", <>concatène message et signature : <Code>M :: S = {pkt.signed_payload}</Code></>);
      addStep("Alice", <>chiffre le payload avec la clé publique de Bob → <Code>[{pkt.ciphertext?.slice(0,6).join(", ")}{pkt.ciphertext?.length > 6 ? "…" : ""}]</Code></>);
    } catch (err) { setError(err.message); }
    finally { setLoading(""); }
  };

  // ── Decrypt + verify ───────────────────────────────────────────────────────
  const decryptAndVerify = async () => {
    if (!packet || !aliceKeys || !bobKeys) return;
    setLoading("verify");
    try {
      const result = await postJson("/signature/rsa/decrypt-and-verify", {
        ciphertext: packet.ciphertext,
        hash_algorithm: packet.hash_algorithm,
        receiver_n: bobKeys.n,
        receiver_d: bobKeys.private_key.d,
        signer_n:   aliceKeys.n,
        signer_e:   aliceKeys.public_key.e,
      });
      setVerif(result);
      addStep("Bob", <>déchiffre le ciphertext avec sa clé privée → <Code>"{result.message}"</Code></>);
      addStep("Bob", <>extrait la signature <Code>S = {result.signature ?? "?"}</Code> et le message</>);
      addStep("Bob", <>recalcule l'empreinte : <Code>S^e_A mod n_A = {result.decrypted_hash_mod_n}</Code></>);
      addStep("Bob", <>compare avec <Code>H(M') mod n_A = {result.expected_hash_mod_n}</Code> → {result.valid
        ? <span style={{ color: C.success }}>✓ SIGNATURE VALIDE</span>
        : <span style={{ color: C.error }}>✕ SIGNATURE INVALIDE</span>}
      </>);
    } catch (err) { setError(err.message); }
    finally { setLoading(""); }
  };

  // ── Tamper test ────────────────────────────────────────────────────────────
  const tamperTest = async () => {
    if (!packet || !aliceKeys || !bobKeys) return;
    setLoading("tamper");
    try {
      // Re-encrypt a tampered message but keep the original signature
      const tampered = await postJson("/signature/rsa/sign-and-encrypt", {
        message: (message.trim() || "HI") + "X", // append X to tamper
        hash_algorithm: hashAlgo,
        signer_n:   aliceKeys.n,
        signer_d:   aliceKeys.private_key.d,
        receiver_n: bobKeys.n,
        receiver_e: bobKeys.public_key.e,
      });
      const result = await postJson("/signature/rsa/decrypt-and-verify", {
        ciphertext: tampered.ciphertext,
        hash_algorithm: tampered.hash_algorithm,
        receiver_n: bobKeys.n,
        receiver_d: bobKeys.private_key.d,
        signer_n:   aliceKeys.n,
        signer_e:   aliceKeys.public_key.e,
      });
      setVerif({ ...result, tampered: true });
      addStep("—", <span style={{ color: C.warn }}>⚠ message falsifié envoyé à Bob</span>);
      addStep("Bob", <>vérifie le message modifié → {result.valid
        ? <span style={{ color: C.success }}>✓ valide (inattendu)</span>
        : <span style={{ color: C.error }}>✕ SIGNATURE INVALIDE — falsification détectée !</span>}
      </>);
    } catch (err) { setError(err.message); }
    finally { setLoading(""); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  const keysReady = !!aliceKeys && !!bobKeys;
  const canSign   = keysReady && message.trim() && !loading;
  const canVerify = !!packet && !loading;

  const hashOptions = ["sha256", "sha1", "md5", "sha512"];

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      gap: "14px", fontFamily: mono, color: C.text, overflow: "hidden",
    }}>

      {/* ── Row 1: config bar ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>

        {/* Alice params */}
        <div style={{
          flex: 1, background: C.panel, border: `0.5px solid ${C.alice}33`,
          borderRadius: "10px", padding: "14px",
        }}>
          <Label color={C.alice}>ALICE — PARAMÈTRES (p, q)</Label>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px" }}>p</div>
              <input id="sig-alice-p" value={aP} onChange={e => setAP(e.target.value)}
                type="number" style={{ ...inputStyle, color: C.alice }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px" }}>q</div>
              <input id="sig-alice-q" value={aQ} onChange={e => setAQ(e.target.value)}
                type="number" style={{ ...inputStyle, color: C.alice }} />
            </div>
          </div>
        </div>

        {/* Bob params */}
        <div style={{
          flex: 1, background: C.panel, border: `0.5px solid ${C.bob}33`,
          borderRadius: "10px", padding: "14px",
        }}>
          <Label color={C.bob}>BOB — PARAMÈTRES (p, q)</Label>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px" }}>p</div>
              <input id="sig-bob-p" value={bP} onChange={e => setBP(e.target.value)}
                type="number" style={{ ...inputStyle, color: C.bob }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: C.muted, marginBottom: "4px" }}>q</div>
              <input id="sig-bob-q" value={bQ} onChange={e => setBQ(e.target.value)}
                type="number" style={{ ...inputStyle, color: C.bob }} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          width: "220px", flexShrink: 0, background: C.panel,
          border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "14px",
          display: "flex", flexDirection: "column", gap: "8px",
        }}>
          <Label>ALGORITHME DE HACHAGE</Label>
          <select value={hashAlgo} onChange={e => setHashAlgo(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer", marginBottom: "4px" }}>
            {hashOptions.map(h => <option key={h} value={h}>{h.toUpperCase()}</option>)}
          </select>
          <button style={btn(C.alice, loading === "keys")}
            disabled={loading === "keys"} onClick={generateKeys}>
            {loading === "keys" ? "⟳ génération..." : "⇒ Générer les clés"}
          </button>
        </div>
      </div>

      {/* ── Row 2: arena ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "12px", flex: 1, minHeight: 0 }}>

        {/* ALICE PANEL */}
        <div style={{
          flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
          borderRadius: "10px", padding: "16px", display: "flex",
          flexDirection: "column", gap: "10px", overflowY: "auto",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "50%",
              background: C.alice + "18", border: `0.5px solid ${C.alice}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", color: C.alice, fontWeight: 500,
            }}>A</div>
            <div>
              <div style={{ fontSize: "12px", color: C.alice, fontWeight: 500 }}>Alice</div>
              <div style={{ fontSize: "9px", color: C.muted }}>Signataire — détient la clé privée</div>
            </div>
          </div>

          <Divider />

          {/* Keys */}
          <Label color={C.alice}>CLÉ PUBLIQUE</Label>
          <Readout value={aliceKeys ? `n = ${aliceKeys.n}\ne = ${aliceKeys.public_key.e}` : null} accent={C.bob} />
          <Label color={C.alice}>CLÉ PRIVÉE (SECRÈTE)</Label>
          <Readout value={aliceKeys ? `n = ${aliceKeys.n}\nd = ${aliceKeys.private_key.d}` : null} accent={C.alice} />

          <Divider />

          {/* Message */}
          <Label>MESSAGE M</Label>
          <textarea id="sig-message" value={message} onChange={e => setMessage(e.target.value)}
            rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, color: C.text }} />

          {/* Hash output */}
          <Label>EMPREINTE E = H(M)</Label>
          <Readout value={packet ? `${packet.hash_algorithm.toUpperCase()}: ${packet.hash}` : null} accent={C.code} />

          {/* Signature output */}
          <Label>SIGNATURE S = E^d mod n</Label>
          <Readout value={packet ? String(packet.signature) : null} accent={C.alice} />

          {/* Payload */}
          <Label>PAYLOAD M :: S (avant chiffrement)</Label>
          <Readout value={packet?.signed_payload} minH="32px" />

          <button style={btn(C.alice, !canSign || loading === "sign")}
            disabled={!canSign || loading === "sign"} onClick={signAndEncrypt}>
            {loading === "sign" ? "⟳ signature + chiffrement..." : "✍ Signer & Chiffrer"}
          </button>
        </div>

        {/* FLOW COLUMN */}
        <div style={{
          width: "130px", flexShrink: 0, background: C.panel,
          border: `0.5px solid ${C.border}`, borderRadius: "10px",
          padding: "14px", display: "flex", flexDirection: "column",
          alignItems: "center", overflowY: "auto",
        }}>
          <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "2px", textAlign: "center", marginBottom: "10px" }}>CANAL PUBLIC</div>
          <FlowNode label="1. H(M)" sub="empreinte" color={C.code} />
          <FlowArrow label="" color={C.dim} />
          <FlowNode label="2. S = E^d_A" sub="signature privée A" color={C.alice} />
          <FlowArrow label="" color={C.dim} />
          <FlowNode label="3. M :: S" sub="concaténation" color={C.muted} />
          <FlowArrow label="" color={C.dim} />
          <FlowNode label="4. Chiffré →" sub="clé publique B" color={C.bob} />
          <FlowArrow label="transmission" color={C.bob} />
          <FlowNode label="5. Déchiffré" sub="clé privée B" color={C.bob} />
          <FlowArrow label="" color={C.dim} />
          <FlowNode label="6. Vérif S" sub="clé publique A" color={verif ? (verif.valid ? C.success : C.error) : C.muted} />
        </div>

        {/* BOB PANEL */}
        <div style={{
          flex: 1, background: C.panel, border: `0.5px solid ${C.border}`,
          borderRadius: "10px", padding: "16px", display: "flex",
          flexDirection: "column", gap: "10px", overflowY: "auto",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "50%",
              background: C.bob + "18", border: `0.5px solid ${C.bob}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", color: C.bob, fontWeight: 500,
            }}>B</div>
            <div>
              <div style={{ fontSize: "12px", color: C.bob, fontWeight: 500 }}>Bob</div>
              <div style={{ fontSize: "9px", color: C.muted }}>Destinataire — déchiffre et vérifie</div>
            </div>
          </div>

          <Divider />

          {/* Keys */}
          <Label color={C.bob}>CLÉ PUBLIQUE</Label>
          <Readout value={bobKeys ? `n = ${bobKeys.n}\ne = ${bobKeys.public_key.e}` : null} accent={C.bob} />
          <Label color={C.bob}>CLÉ PRIVÉE (SECRÈTE)</Label>
          <Readout value={bobKeys ? `n = ${bobKeys.n}\nd = ${bobKeys.private_key.d}` : null} accent={C.alice} />

          <Divider />

          {/* Ciphertext */}
          <Label>CIPHERTEXT REÇU</Label>
          <Readout
            value={packet ? `[${packet.ciphertext?.slice(0,8).join(", ")}${packet.ciphertext?.length > 8 ? " …" : ""}]` : null}
            accent={C.bob} minH="32px"
          />

          {/* Decrypted message */}
          <Label>MESSAGE DÉCHIFFRÉ M'</Label>
          <Readout value={verif?.message} accent={verif ? C.text : null} />

          {/* Hash comparison */}
          <Label>COMPARAISON DES EMPREINTES</Label>
          <Readout
            value={verif ? `S^e_A mod n_A = ${verif.decrypted_hash_mod_n}\nH(M') mod n_A = ${verif.expected_hash_mod_n}` : null}
            accent={verif ? (verif.valid ? C.success : C.error) : null}
            minH="44px"
          />

          {/* Result */}
          <div style={{
            background: C.bg,
            border: `0.5px solid ${verif ? (verif.valid ? C.success + "66" : C.error + "66") : C.border}`,
            borderRadius: "8px", padding: "10px 14px", textAlign: "center",
            fontFamily: mono, fontSize: "13px", letterSpacing: "2px",
            color: verif ? (verif.valid ? C.success : C.error) : C.muted,
            transition: "all 0.3s",
          }}>
            {verif
              ? (verif.valid ? "✓ SIGNATURE VALIDE" : "✕ SIGNATURE INVALIDE")
              : "— en attente de vérification —"}
          </div>

          <button style={btn(C.bob, !canVerify || loading === "verify")}
            disabled={!canVerify || loading === "verify"} onClick={decryptAndVerify}>
            {loading === "verify" ? "⟳ vérification..." : "↓ Déchiffrer & Vérifier"}
          </button>

          <button style={btn(C.warn, !canVerify || loading === "tamper")}
            disabled={!canVerify || loading === "tamper"} onClick={tamperTest}>
            {loading === "tamper" ? "⟳ test..." : "⚠ Tester avec message falsifié"}
          </button>
        </div>
      </div>

      {/* ── Row 3: error + step log ────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: C.error + "12", border: `0.5px solid ${C.error}44`,
          borderRadius: "8px", padding: "10px 14px", fontSize: "11px",
          color: C.error, flexShrink: 0,
        }}>✕ {error}</div>
      )}

      <div style={{
        background: C.panel, border: `0.5px solid ${C.border}`,
        borderRadius: "10px", padding: "14px 16px", height: "200px",
        display: "flex", flexDirection: "column", flexShrink: 0,
      }}>
        <Label>JOURNAL DES ÉTAPES — SIGNATURE RSA</Label>
        <div ref={logRef} style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          {steps.length === 0
            ? <div style={{ fontSize: "11px", color: C.dim, padding: "8px 0" }}>Générez les clés pour commencer...</div>
            : steps.map((s, i) => (
                <StepEntry key={i} index={i + 1} actor={s.actor}>{s.content}</StepEntry>
              ))
          }
        </div>
      </div>
    </div>
  );
}
