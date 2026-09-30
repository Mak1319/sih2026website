"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RECIPIENTS,
  randomHex,
  sha256Hex,
  type PipelineResult,
} from "../lib/sagex";

const STEPS = [
  {
    id: 1,
    title: "Document Protect",
    sub: "SHA-256 ContentHash + AES-256-GCM",
    icon: "◈",
    desc: "Canonicalize doc → ContentHash → random DEK → AES-256-GCM encrypt.",
  },
  {
    id: 2,
    title: "Hybrid Envelope",
    sub: "ML-KEM-768 + X25519 → HKDF → KEK",
    icon: "⬡",
    desc: "Per-recipient DEK wrap. Envelope KDF binds DocID + KeyID + EnvID. No SessionID here.",
  },
  {
    id: 3,
    title: "Decrypt Gate",
    sub: "Auth → HKDF → GCM verify",
    icon: "⬣",
    desc: "Auth + authorization → decaps + agreement → KEK → DEK → GCM tag MUST verify.",
  },
  {
    id: 4,
    title: "Watermark",
    sub: "WM-ID → Reed-Solomon → embed",
    icon: "◎",
    desc: "Post-decryption only: SessionID + salt → opaque WM-ID → RS encode → format-aware embed.",
  },
  {
    id: 5,
    title: "Sign Event",
    sub: "Canonical → SHA-256 → ML-DSA-65",
    icon: "✦",
    desc: "Event holds ContentHash + ArtifactHash. Signed by recipient ML-DSA-65 key.",
  },
  {
    id: 6,
    title: "Commit Ledger",
    sub: "Permissioned DLT · offline",
    icon: "⛓",
    desc: "Metadata only, doc off-chain. Tamper-evident, append-only. No public chain.",
  },
  {
    id: 7,
    title: "Forensics",
    sub: "Extract → verify → report",
    icon: "◉",
    desc: "Leak → format detect → RS decode → ledger lookup → ML-DSA verify → hash correlate.",
  },
];

type Log = { t: string; msg: string; kind: "info" | "ok" | "warn" | "crypto" };

export default function DemoLab() {
  const [docName, setDocName] = useState("OP-PLAN-AURORA.pdf");
  const [recipientIdx, setRecipientIdx] = useState(1);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [logs, setLogs] = useState<Log[]>([]);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [forensics, setForensics] = useState<null | {
    wm: string;
    sigOk: boolean;
    artifactMatch: boolean;
    verdict: string;
  }>(null);
  const [tamper, setTamper] = useState(false);
  const logBoxRef = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef(false);
  const runningRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const recipient = RECIPIENTS[recipientIdx];

  const pushLog = (msg: string, kind: Log["kind"] = "info") => {
    const t = new Date().toLocaleTimeString("en-IN", { hour12: false });
    setLogs((p) => [...p, { t, msg, kind }]);
    requestAnimationFrame(() => {
      logBoxRef.current?.scrollTo({
        top: logBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  const sleep = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      const id = setTimeout(() => {
        if (cancelledRef.current) reject(new Error("cancelled"));
        else resolve();
      }, ms);
      void id;
    });

  const beginRun = () => {
    if (runningRef.current) return false;
    runningRef.current = true;
    setRunning(true);
    return true;
  };

  const endRun = () => {
    runningRef.current = false;
    if (!cancelledRef.current) setRunning(false);
  };

  const failRun = (e: unknown) => {
    if (cancelledRef.current) return;
    const msg = e instanceof Error && e.message !== "cancelled" ? `: ${e.message}` : "";
    pushLog(`Pipeline aborted${msg} — check browser WebCrypto support (needs localhost/HTTPS).`, "warn");
  };

  const runPipeline = async () => {
    if (!beginRun()) return;
    setResult(null);
    setForensics(null);
    setLogs([]);
    setActiveStep(0);

    try {
      const docId = `DOC-${randomHex(3).toUpperCase()}-2026`;
    pushLog(`◈ Ingesting "${docName}" as ${docId} …`);
    await sleep(650);
    setActiveStep(1);
    const contentHash = await sha256Hex(docName + docId + Date.now());
    const dek = randomHex(32);
    pushLog(`SHA-256 ContentHash = ${contentHash.slice(0, 32)}…`, "crypto");
    pushLog(`CSPRNG DEK(256) generated · AES-256-GCM encrypt (IV unique)`, "ok");
    await sleep(800);

    setActiveStep(2);
    const envelopeId = `ENV-${randomHex(3).toUpperCase()}`;
    const ssKem = randomHex(32);
    const ssX = randomHex(32);
    const kek = (await sha256Hex(ssKem + ssX + docId + recipient.keyId)).slice(0, 64);
    pushLog(`ML-KEM-768 ss_kem = ${ssKem.slice(0, 20)}…  (post-quantum)`, "crypto");
    pushLog(`X25519 ss_x = ${ssX.slice(0, 20)}…  (classical component)`, "crypto");
    pushLog(`HKDF-Extract→Expand [DST‖Suite‖${docId}‖${recipient.keyId}‖${envelopeId}] → KEK`, "ok");
    pushLog(`DEK wrapped for ${recipient.id} (${recipient.keyId}). SessionID NOT in envelope.`, "warn");
    await sleep(1000);

    setActiveStep(3);
    pushLog(`Authenticating ${recipient.name} against offline CA…`);
    await sleep(600);
    pushLog(`Authorization OK · ML-KEM decaps + X25519 agree → KEK → DEK unwrap`, "info");
    await sleep(600);
    pushLog(`AES-GCM tag VERIFIED ✓ — successful-decryption gate passed`, "ok");
    await sleep(700);

    setActiveStep(4);
    const sessionId = `SES-${randomHex(4).toUpperCase()}`;
    const salt = randomHex(16);
    const wmId = (await sha256Hex(`WM-SECRET|${docId}|${recipient.keyId}|${sessionId}|${salt}|v3`)).slice(0, 32);
    const wmEcc = `RS(64,32)+${wmId.slice(0, 12)}…parity`;
    const artifactHash = await sha256Hex(wmId + docName + sessionId + "artifact");
    pushLog(`Session created: ${sessionId} + salt ${salt.slice(0, 12)}…`, "info");
    pushLog(`WM-ID (opaque, no identity) = ${wmId}`, "crypto");
    pushLog(`Reed-Solomon encode → DCT embed → ArtifactHash = ${artifactHash.slice(0, 24)}…`, "ok");
    pushLog(`NOTE: ArtifactHash ≠ ContentHash by design`, "warn");
    await sleep(1000);

    setActiveStep(5);
    const eventHash = await sha256Hex(docId + contentHash + artifactHash + wmId + sessionId);
    const signature = randomHex(64);
    pushLog(`Canonical(E) → SHA-256 event_hash = ${eventHash.slice(0, 32)}…`, "crypto");
    pushLog(`ML-DSA-65 Sign(SK_prov, H_E) → σ = ${signature.slice(0, 28)}…`, "ok");
    await sleep(900);

    setActiveStep(6);
    const blockNo = 1400 + Math.floor(Math.random() * 200);
    const blockHash = await sha256Hex(eventHash + blockNo + "SAGEX-FABRIC");
    pushLog(`Submitting to offline permissioned DLT (Fabric-channel: sagex-provenance)…`);
    await sleep(700);
    pushLog(`Block #${blockNo} committed · prev-hash chained · doc stays OFF-CHAIN`, "ok");
    await sleep(500);

    setActiveStep(7);
    pushLog(`Pipeline complete — ready for leak-forensics simulation ↓`, "ok");

    if (cancelledRef.current) return;
    setResult({
      documentId: docId,
      contentHash,
      dek,
      envelopeId,
      ssKem,
      ssX,
      kek,
      sessionId,
      salt,
      wmId,
      wmEcc,
      artifactHash,
      eventHash,
      signature,
      blockNo,
      blockHash,
      recipientKeyId: recipient.keyId,
    });
    } catch (e) {
      failRun(e);
    } finally {
      endRun();
    }
  };

  const runForensics = async () => {
    if (!result || !beginRun()) return;
    setForensics(null);
    try {
      pushLog(`—— LEAK FORENSICS: analyzing recovered artifact ——`, "warn");
    await sleep(600);
    pushLog(`Format detect: PDF container → rasterize page → DCT-extract…`);
    await sleep(800);
    const extracted = tamper ? randomHex(16) : result.wmId;
    pushLog(
      tamper
        ? `RS decode FAILED tolerance exceeded — recovered WM-ID mismatch`
        : `RS decode OK → WM-ID = ${extracted}`,
      tamper ? "warn" : "crypto"
    );
    await sleep(700);
    pushLog(`Ledger query WM-ID → candidate event ${result.eventHash.slice(0, 16)}… (Block #${result.blockNo})`);
    await sleep(700);
    const sigOk = !tamper;
    const artifactMatch = !tamper;
    pushLog(
      sigOk
        ? `ML-DSA-65 Verify(PK_${result.recipientKeyId}, H, σ) = VALID ✓`
        : `ML-DSA-65 Verify = INVALID ✗ (or no candidate event)`,
      sigOk ? "ok" : "warn"
    );
    await sleep(600);
    pushLog(
      artifactMatch
        ? `ArtifactHash correlate ✓ · ContentHash lineage ✓`
        : `ArtifactHash MISMATCH — tampered/compressed beyond ECC capacity`,
      artifactMatch ? "ok" : "warn"
    );
    await sleep(500);
    const verdict = tamper
      ? "INSUFFICIENT / AMBIGUOUS EVIDENCE — no attribution guessed. Escalate for manual review."
      : `ATTRIBUTED REGISTERED EVENT → ${recipient.id} (${recipient.keyId}) · session ${result.sessionId} · block #${result.blockNo}. Human intent NOT proven — key control only.`;
    pushLog(verdict, tamper ? "warn" : "ok");
    if (cancelledRef.current) return;
    setForensics({ wm: extracted, sigOk, artifactMatch, verdict });
    } catch (e) {
      failRun(e);
    } finally {
      endRun();
    }
  };

  const stepDesc = useMemo(() => STEPS, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      {/* LEFT: controls + steps */}
      <div className="glass rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight">
            <span className="text-[#e87722]">●</span> DEMO CONTROL DECK
          </h3>
          <span className="rounded-full border border-white/15 px-3 py-1 font-mono text-[11px] text-white/70">
            OFFLINE · SIMULATED
          </span>
        </div>

        <label className="mt-6 block text-[12px] font-semibold uppercase tracking-[0.18em] text-white/50">
          Document
        </label>
        <input
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/12 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none focus:border-[#e87722]/70"
          placeholder="OP-PLAN-AURORA.pdf"
        />

        <label className="mt-5 block text-[12px] font-semibold uppercase tracking-[0.18em] text-white/50">
          Authorized recipient
        </label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {RECIPIENTS.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setRecipientIdx(i)}
              className={`rounded-xl border px-3 py-3 text-left transition-all ${
                i === recipientIdx
                  ? "border-[#e87722] bg-[#e87722]/15 shadow-[0_0_24px_rgba(232,119,34,0.35)]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25"
              }`}
            >
              <div className="font-mono text-[11px]" style={{ color: r.color }}>
                {r.id}
              </div>
              <div className="mt-1 text-[13px] font-bold leading-tight">{r.name}</div>
              <div className="font-mono text-[10px] text-white/50">{r.keyId}</div>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={runPipeline}
            disabled={running}
            className="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-[#e87722] to-[#ff9a3c] px-5 py-3.5 text-sm font-extrabold uppercase tracking-wider text-black disabled:opacity-50"
          >
            <span className="relative z-10">{running ? "◌ Running pipeline…" : "▶ Run secure pipeline"}</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </button>
          <button
            onClick={runForensics}
            disabled={running || !result}
            className="flex-1 rounded-xl border border-[#22c55e]/50 bg-[#22c55e]/10 px-5 py-3.5 text-sm font-extrabold uppercase tracking-wider text-[#7dffb0] disabled:opacity-40"
          >
            ◉ Simulate leak forensics
          </button>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-3 text-[13px] text-white/70">
          <button
            onClick={() => setTamper((v) => !v)}
            className={`h-6 w-11 rounded-full p-1 transition-colors ${tamper ? "bg-red-500" : "bg-white/15"}`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white transition-transform ${tamper ? "translate-x-5" : ""}`}
            />
          </button>
          Tamper leaked copy (strip / compress watermark) — expect{" "}
          <span className="font-bold text-red-300">no-guess</span> verdict
        </label>

        {/* stepper */}
        <div className="mt-6 space-y-2">
          {stepDesc.map((s, i) => {
            const idx = i + 1;
            const done = activeStep > idx || (activeStep === 7 && idx === 7 && result);
            const active = activeStep === idx && running;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                  active
                    ? "border-[#e87722] bg-[#e87722]/10 shadow-[0_0_20px_rgba(232,119,34,0.3)]"
                    : done
                      ? "border-[#22c55e]/30 bg-[#22c55e]/[0.06]"
                      : "border-white/8 bg-white/[0.02]"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-lg ${
                    active
                      ? "bg-[#e87722] text-black"
                      : done
                        ? "bg-[#22c55e]/20 text-[#7dffb0]"
                        : "bg-white/8 text-white/50"
                  }`}
                >
                  {done ? "✓" : s.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold">
                    {idx}. {s.title} <span className="font-mono text-[11px] font-normal text-white/50">{s.sub}</span>
                  </div>
                  <div className="truncate text-[12px] text-white/55">{s.desc}</div>
                </div>
                {active && <span className="ml-auto animate-blink font-mono text-[#e87722]">▊</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: terminal + evidence */}
      <div className="flex flex-col gap-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#050a18]/90">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span className="ml-2 font-mono text-[12px] text-white/60">
              sagex@airgap:~$ ./run-pipeline --offline
            </span>
            <span className="ml-auto rounded bg-[#e87722]/15 px-2 py-0.5 font-mono text-[11px] text-[#e87722]">
              LIVE
            </span>
          </div>
          <div ref={logBoxRef} className="h-[340px] space-y-1.5 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed">
            {logs.length === 0 && (
              <div className="text-white/40">
                <p className="text-[#e87722]"># SAGE X demonstrative workflow</p>
                <p>1. Pick a document + recipient, hit RUN.</p>
                <p>2. Watch envelope → gate → watermark → sign → ledger.</p>
                <p>3. Then simulate a leak to see forensics.</p>
                <p className="terminal-caret mt-2 text-white/60">waiting for operator</p>
              </div>
            )}
            {logs.map((l, i) => (
              <div key={i} className="animate-block-in">
                <span className="text-white/30">[{l.t}] </span>
                <span
                  className={
                    l.kind === "ok"
                      ? "text-[#7dffb0]"
                      : l.kind === "crypto"
                        ? "text-[#8db4ff]"
                        : l.kind === "warn"
                          ? "text-[#ffb86b]"
                          : "text-white/80"
                  }
                >
                  {l.msg}
                </span>
              </div>
            ))}
            {running && <div className="animate-blink text-[#e87722]">▊ processing…</div>}
          </div>
        </div>

        {/* evidence cards */}
        {result && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: "DocumentID", v: result.documentId, c: "#8db4ff" },
              { k: "ContentHash", v: `${result.contentHash.slice(0, 24)}…`, c: "#8db4ff" },
              { k: "KEK (HKDF)", v: `${result.kek.slice(0, 24)}…`, c: "#e87722" },
              { k: "SessionID", v: result.sessionId, c: "#e87722" },
              { k: "WM-ID", v: result.wmId, c: "#ff9a3c" },
              { k: "ArtifactHash", v: `${result.artifactHash.slice(0, 24)}…`, c: "#ff9a3c" },
              { k: "ML-DSA σ", v: `${result.signature.slice(0, 24)}…`, c: "#7dffb0" },
              { k: "Block", v: `#${result.blockNo} · ${result.blockHash.slice(0, 12)}…`, c: "#7dffb0" },
            ].map((f) => (
              <div key={f.k} className="animate-block-in rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">{f.k}</div>
                <div className="mt-1 break-all font-mono text-[12px] font-bold" style={{ color: f.c }}>
                  {f.v}
                </div>
              </div>
            ))}
          </div>
        )}

        {forensics && (
          <div
            className={`animate-block-in rounded-3xl border p-5 ${
              forensics.sigOk
                ? "border-[#22c55e]/40 bg-[#22c55e]/[0.07]"
                : "border-red-500/40 bg-red-500/[0.07]"
            }`}
          >
            <div className="text-[12px] font-bold uppercase tracking-[0.2em] opacity-70">
              Forensic verdict
            </div>
            <p className={`mt-2 text-[14px] font-bold leading-relaxed ${forensics.sigOk ? "text-[#7dffb0]" : "text-red-200"}`}>
              {forensics.verdict}
            </p>
            <div className="mt-3 flex gap-2 font-mono text-[11px]">
              <span className={`rounded px-2 py-1 ${forensics.sigOk ? "bg-[#22c55e]/20" : "bg-red-500/20"}`}>
                SIG {forensics.sigOk ? "VALID" : "INVALID"}
              </span>
              <span className={`rounded px-2 py-1 ${forensics.artifactMatch ? "bg-[#22c55e]/20" : "bg-red-500/20"}`}>
                HASH {forensics.artifactMatch ? "MATCH" : "MISMATCH"}
              </span>
              <span className="rounded bg-white/10 px-2 py-1">WM {forensics.wm.slice(0, 12)}…</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
