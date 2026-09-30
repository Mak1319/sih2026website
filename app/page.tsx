"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ParticleField from "./components/ParticleField";
import Reveal from "./components/Reveal";
import DemoLab from "./components/DemoLab";
import WorkflowExplorer from "./components/WorkflowExplorer";
import WebGLGuard from "./components/WebGLGuard";

const SageHero3D = dynamic(() => import("./components/SageHero3D"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#040816]" aria-hidden />,
});
const Pipeline3D = dynamic(() => import("./components/Pipeline3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[440px] items-center justify-center rounded-3xl border border-white/10 bg-[#03061a] font-mono text-[13px] text-white/50 sm:h-[480px]">
      <span className="animate-blink text-[#e87722]">▊</span>&nbsp;loading 3D pipeline…
    </div>
  ),
});

const NAV = [
  { label: "Problem", href: "#problem" },
  { label: "Workflow", href: "#workflow" },
  { label: "Live Demo", href: "#demo" },
  { label: "Architecture", href: "#architecture" },
  { label: "Security", href: "#security" },
  { label: "Stack", href: "#stack" },
  { label: "FAQ", href: "#faq" },
];

const PHASES = [
  {
    n: "01",
    title: "Identity & Key Mgmt",
    tech: "Offline CA · ML-KEM-768 · X25519 · ML-DSA-65",
    desc: "Recipients enrolled air-gapped. Separate KEM / agreement / signing keys. Versioned RecipientKeyID binds each key generation to an identity. No cloud KMS, no online CA. Private keys stay in recipient-controlled secure storage (HSM/TPM where available).",
    color: "#60a5fa",
    icon: "⬡",
    inputs: ["Recipient identity proof (offline)", "CSPRNG key generation (KEM/X/SIG)"],
    outputs: ["PK_KEM,i · PK_X,i · PK_SIG,i registered", "RecipientKeyID v1…vn bound to identity"],
    gate: "Enrollment + authorization approval before any envelope is created.",
    fail: "Unregistered / revoked / expired keys can never open envelopes or sign events.",
  },
  {
    n: "02",
    title: "Document Protection",
    tech: "SHA-256 · AES-256-GCM · HKDF envelope KDF",
    desc: "Canonicalize doc → ContentHash → random 256-bit DEK → AES-256-GCM encrypt with unique nonce. DEK wrapped per-recipient via hybrid ML-KEM-768 + X25519 → HKDF → KEK. One ciphertext, N envelopes.",
    color: "#8db4ff",
    icon: "◈",
    inputs: ["Document D", "CSPRNG DEK(256) + nonce/IV", "Recipient PKs + EnvelopeID"],
    outputs: ["P = {Version, Suite, DocID, ContentHash, C, IV, Tag, Envelopes}", "Per-recipient: CT_KEM ‖ X_eph ‖ salt ‖ DEK_wrapped"],
    gate: "Envelope KDF binds DocID ‖ KeyID ‖ EnvID ‖ Suite — SessionID explicitly excluded (it doesn't exist yet).",
    fail: "Missing context binding → envelope rejected. Tag mismatch later → full stop, zero forensics.",
  },
  {
    n: "03",
    title: "Recipient Decryption Gate",
    tech: "Auth → HKDF → GCM tag verify",
    desc: "Authenticate against offline identity infra → check document authorization → ML-KEM decaps + X25519 agree → HKDF → KEK → unwrap DEK → AES-GCM decrypt. Tag verification is the hard gate for everything downstream.",
    color: "#e87722",
    icon: "⬣",
    inputs: ["Encrypted package P", "Recipient SK_KEM,i + SK_X,i", "Auth credential + authorization grant"],
    outputs: ["DEK recovered", "GCM tag VALID → plaintext D (else abort)"],
    gate: "GCM authentication success is mandatory before session creation, watermarking, signing, or ledger writes.",
    fail: "Failed auth, revoked recipient, wrong key, or tampered ciphertext → NO watermark, NO event, NO ledger entry.",
  },
  {
    n: "04",
    title: "Session Watermarking",
    tech: "WM-ID · Reed-Solomon · DCT / structural",
    desc: "Post-decryption ONLY: create SessionID + fresh salt → HKDF → opaque WM-ID (never plaintext identity) → Reed-Solomon encode → format-aware invisible embed (DCT for raster, structural for text, DWT experimental) → ArtifactHash.",
    color: "#ff9a3c",
    icon: "◎",
    inputs: ["Plaintext D + DocID + KeyID", "Fresh SessionID + RandomSalt + WM version"],
    outputs: ["WM-ID = HKDF(WM-Secret, DocID‖KeyID‖Session‖Salt‖v3)", "Watermarked artifact + ArtifactHash ≠ ContentHash"],
    gate: "WM-ID must be unpredictable per session: R₁S₁ ≠ R₂S₁ and R₁S₁ ≠ R₁S₂.",
    fail: "Pre-distribution or static watermarks are forbidden — they destroy attribution.Heavy transforms beyond ECC capacity → extraction may fail (honest no-guess).",
  },
  {
    n: "05",
    title: "Signed Provenance",
    tech: "Canonical JSON · SHA-256 · ML-DSA-65",
    desc: "Build structured event {DocID, ContentHash, ArtifactHash, RecipientID, KeyID, SessionID, WM-ID, timestamps, suite versions} → canonical serialize → SHA-256 → sign with recipient ML-DSA-65 key. Verifiable offline without trusting the server.",
    color: "#c084fc",
    icon: "✦",
    inputs: ["ContentHash + ArtifactHash + WM-ID + SessionID", "Recipient SK_SIG (ML-DSA-65)"],
    outputs: ["H_E = SHA-256(Canonical(E))", "σ_E = ML-DSA.Sign(SK, H_E) → P_E = {E_c, H_E, σ, KeyID}"],
    gate: "Canonical field order (UTF-8, no whitespace ambiguity) before hashing — signatures must verify under the registered KeyID version.",
    fail: "Non-canonical serialization or wrong key version → signature INVALID → event rejected from ledger.",
  },
  {
    n: "06",
    title: "Permissioned Ledger",
    tech: "Hyperledger Fabric (candidate) · offline DLT",
    desc: "Signed event → transaction → validation → ordering → block → replicated ledger. Metadata ONLY — full document stays off-chain. Tamper-evident, append-oriented; integrity depends on consensus + endorsement + governance (no absolute-immutability claim).",
    color: "#22c55e",
    icon: "⛓",
    inputs: ["Signed provenance P_E", "Offline Fabric channel: sagex-provenance"],
    outputs: ["Block #N: {EventID, hashes, KeyID, Session, WM-ID, σ, prev-hash}", "Queryable index: WM-ID → Event"],
    gate: "Endorsement + ordering + hash-chaining before commit. Partitioned events queue locally, hash-chained, then sync.",
    fail: "Ledger outage never authorizes decryption bypass. Unendorsed or replayed events are dropped.",
  },
  {
    n: "07",
    title: "Leak Forensics",
    tech: "Extract → RS decode → verify → correlate",
    desc: "Leaked copy → format detect → watermark extract → RS decode → WM-ID → ledger query → ML-DSA verify under registered key → ArtifactHash/ContentHash correlate → provenance report. Watermark alone is NEVER enough.",
    color: "#7dffb0",
    icon: "◉",
    inputs: ["Leaked artifact (any copy)", "Ledger read access + registered PKs"],
    outputs: ["Recovered WM-ID → candidate event E_i", "Verdict: ATTRIBUTED event OR insufficient/ambiguous"],
    gate: "All three must hold: RS decode OK + signature VALID + hash correlation OK. Otherwise no-guess.",
    fail: "Destroyed watermark, bad signature, or hash mismatch → system reports insufficient evidence, never guesses a recipient.",
  },
];

const STACK = [
  { t: "AES-256-GCM", d: "Authenticated doc encryption. Unique nonce/IV. Tag gate for all forensics.", c: "#60a5fa" },
  { t: "ML-KEM-768", d: "NIST FIPS 203 post-quantum KEM. Per-recipient secret establishment.", c: "#8db4ff" },
  { t: "X25519", d: "Classical ECDH component only — NOT post-quantum. Hybrid safety if either holds.", c: "#a5b4fc" },
  { t: "HKDF-SHA256", d: "Envelope KEK + separate Watermark WM-ID contexts. Domain separation, no SessionID in envelope.", c: "#e87722" },
  { t: "ML-DSA-65", d: "NIST FIPS 204 post-quantum signatures on canonical provenance events.", c: "#c084fc" },
  { t: "SHA-256", d: "ContentHash (original) vs ArtifactHash (watermarked) — never confused.", c: "#93c5fd" },
  { t: "RS + Watermark", d: "Reed-Solomon ECC + DCT primary / structural text / DWT experimental. Opaque WM-ID.", c: "#ff9a3c" },
  { t: "Permissioned DLT", d: "Offline Fabric-style ledger. Metadata only. Tamper-evident, not absolute immutable.", c: "#22c55e" },
];

const GAP_ROWS = [
  ["Encryption", "Confidentiality", "Does not identify the source of a later plaintext leak"],
  ["Access logs", "Event recording", "Centralized records may be altered or compromised"],
  ["Static watermark", "Artifact ID", "Same mark across recipients — zero session binding"],
  ["Digital signature", "Authentication", "Does not live inside the leaked artifact"],
  ["Blockchain alone", "Tamper-evident record", "Does not connect a leaked copy to a ledger event"],
  ["Watermarking alone", "Embedded ID", "Needs reliable binding to recipient/session provenance"],
];

const THREATS = [
  { t: "Ciphertext tampering", d: "GCM tag fails → abort. No session, no watermark, no event. Attacker gains nothing.", c: "#60a5fa" },
  { t: "Forged provenance events", d: "ML-DSA-65 verification under registered KeyID fails → event rejected, never committed.", c: "#c084fc" },
  { t: "Watermark removal / collision", d: "RS-ECC tolerates bounded corruption. Beyond capacity or colliding WM-ID → honest no-guess verdict.", c: "#ff9a3c" },
  { t: "Replay attacks", d: "SessionID + salt + EnvelopeID uniqueness; ledger rejects duplicate event IDs.", c: "#e87722" },
  { t: "Ledger manipulation", d: "Hash-chained, endorsed, replicated. Tamper-evident — but security rests on consensus + governance, honestly stated.", c: "#22c55e" },
  { t: "Key / endpoint compromise", d: "Revocation blocks future sessions; history still verifies under old KeyID. HSM/TPM recommended; credential-sharing is out of crypto scope.", c: "#f472b6" },
  { t: "Insider misuse", d: "Every successful decryption is signed + logged. Deniability removed — but human intent still needs investigation.", c: "#8db4ff" },
  { t: "Offline partition", d: "Events queue locally, hash-chained, and sync on reconnect. Outage never grants bypass.", c: "#7dffb0" },
];

const METRICS = [
  { k: "Encrypt / decrypt latency", v: "AES-GCM throughput per doc size" },
  { k: "KEM encaps / decaps", v: "ML-KEM-768 + X25519 agreement overhead" },
  { k: "Sign / verify", v: "ML-DSA-65 event sign + forensic verify time" },
  { k: "Watermark reliability", v: "Embed / extract success, PSNR / SSIM, MOS" },
  { k: "ECC performance", v: "BER before vs after Reed-Solomon; recovery rate" },
  { k: "Ledger performance", v: "Tx commit latency + provenance lookup time" },
  { k: "End-to-end binding", v: "% leaked copies → verified event bindings" },
  { k: "Robustness", v: "Compression, print-scan, crop, noise survival per format" },
];

const LIFECYCLE = [
  { t: "Generate", d: "KEM/X/SIG pairs via approved libs; DEKs via CSPRNG — inside controlled env." },
  { t: "Register", d: "Public keys bound to RecipientID + versioned RecipientKeyID in offline registry." },
  { t: "Activate", d: "Usable only after authorization approval (admin record, not a decryption event)." },
  { t: "Use", d: "KEM/X for envelopes only; ML-DSA for provenance only. No cross-purpose reuse." },
  { t: "Rotate / Expire", d: "New KeyID versions periodically; validity windows enforced at auth check." },
  { t: "Revoke", d: "Compromise/departure → registry + ledger governance update blocks future sessions." },
  { t: "Verify history", d: "Old events verify under their recorded KeyID — revocation ≠ history erasure." },
];

const FORENSIC_STEPS = [
  "Recover leaked artifact (any format)",
  "Detect format → route to DCT / structural / DWT extractor",
  "Extract + Reed-Solomon decode → opaque WM-ID",
  "Ledger query: WM-ID → candidate decryption event",
  "ML-DSA-65 verify under registered KeyID version",
  "Correlate ArtifactHash + ContentHash lineage",
  "Emit report: attributed event OR insufficient/ambiguous",
];

const FAQS = [
  {
    q: "Why not just use access logs?",
    a: "Logs say who opened a file — but they are centralized, mutable, and live outside the leaked copy. SAGE X embeds a per-session fingerprint INSIDE the artifact and anchors a signed event on a tamper-evident ledger, so evidence travels with the leak and verifies offline.",
  },
  {
    q: "Why is the watermark opaque instead of containing the recipient name?",
    a: "Privacy + security. WM-ID = HKDF(WM-Secret, DocID ‖ KeyID ‖ SessionID ‖ Salt ‖ v3) reveals nothing by itself. Only the ledger maps WM-ID → event → KeyID → identity, and only after signature + hash checks pass. A stolen watermark alone identifies nobody.",
  },
  {
    q: "What happens if someone tampers with the ciphertext?",
    a: "AES-GCM tag verification fails and the pipeline halts: no session, no watermark, no signature, no ledger entry. Tampered packages can never become 'provenance events'.",
  },
  {
    q: "Can SAGE X prove who intentionally leaked a document?",
    a: "No — and the report is explicit about this. It proves a registered decryption event (recipient key + session + watermark) with cryptographic evidence. Human possession, intent, credential-sharing, or device compromise need separate investigation.",
  },
  {
    q: "Why both ML-KEM-768 AND X25519?",
    a: "Hybrid safety: security holds if at least one component remains unbroken. ML-KEM-768 is the post-quantum KEM (FIPS 203); X25519 is strictly the classical ECDH part — never claimed as post-quantum. They combine via a defined HKDF KDF, not naive concatenation.",
  },
  {
    q: "Why keep the document off-chain?",
    a: "Classification + scale. The ledger stores provenance metadata and cryptographic evidence (hashes, IDs, signatures) — never the document bytes. Full docs stay in controlled off-chain storage, even air-gapped.",
  },
  {
    q: "What if the watermark is destroyed by compression or printing?",
    a: "Reed-Solomon ECC recovers bounded corruption. Beyond its capacity, extraction fails — and SAGE X reports INSUFFICIENT / AMBIGUOUS EVIDENCE instead of guessing. Try the tamper toggle in the live demo to see this.",
  },
];

const TEAM = [
  { n: "Mainak Manna", r: "Crypto / Lead", m: "mannamainak1319@gmail.com" },
  { n: "Suman Rana", r: "Backend", m: "ranasuman6699@gmail.com" },
  { n: "Suman Mallick", r: "Blockchain", m: "sumanmallick9900@gmail.com" },
  { n: "Ayaan Goldar", r: "Testing / Docs", m: "ayanngoldar@gmail.com" },
  { n: "Riya Ghorai", r: "Watermarking", m: "riyaghorai2005@gmail.com" },
  { n: "Dipsikha Dutta", r: "Frontend / Forensics", m: "dattadipsikha39@gmail.com" },
];

function useTyping(words: string[]) {
  const [text, setText] = useState("");
  useEffect(() => {
    let wi = 0;
    let ci = 0;
    let del = false;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const w = words[wi];
      if (!del) {
        ci++;
        setText(w.slice(0, ci));
        if (ci === w.length) {
          del = true;
          setTimeout(tick, 1400);
          return;
        }
      } else {
        ci--;
        setText(w.slice(0, ci));
        if (ci === 0) {
          del = false;
          wi = (wi + 1) % words.length;
        }
      }
      setTimeout(tick, del ? 28 : 55);
    };
    const id = setTimeout(tick, 400);
    return () => {
      alive = false;
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return text;
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-3">
      {FAQS.map((f, i) => (
        <div
          key={f.q}
          className={`overflow-hidden rounded-2xl border transition-colors ${
            open === i ? "border-[#e87722]/50 bg-[#e87722]/[0.06]" : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left"
          >
            <span className={`font-mono text-lg ${open === i ? "text-[#e87722]" : "text-white/40"}`}>
              {open === i ? "−" : "+"}
            </span>
            <span className="text-[15px] font-bold">{f.q}</span>
          </button>
          {open === i && <p className="animate-block-in px-5 pb-5 pl-12 text-[14px] leading-relaxed text-white/70">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const typed = useTyping([
    "Recipient → Session → Watermark → Signature → Ledger → Forensics",
    "WM-ID = HKDF(WM-Secret, DocID ‖ KeyID ‖ SessionID ‖ Salt ‖ v3)",
    "No GCM tag? No watermark. No event. No ledger entry.",
    "ArtifactHash ≠ ContentHash — by design.",
  ]);

  return (
    <div className="relative min-h-screen bg-[#040816] text-[#eef2fa]">
      {/* NAV */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#040816]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <a href="#top" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0b2c6b] via-[#123a8f] to-[#e87722] font-mono text-xl font-black shadow-[0_0_24px_rgba(232,119,34,0.45)]">
              S
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-black tracking-[0.18em]">
                SAGE <span className="text-[#e87722]">X</span>
              </span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                Secure Attribution · SIH 2026
              </span>
            </span>
          </a>
          <nav className="ml-auto hidden items-center gap-5 text-[13px] font-semibold text-white/70 xl:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors hover:text-[#e87722]">
                {n.label}
              </a>
            ))}
          </nav>
          <a
            href="#demo"
            className="ml-auto rounded-full bg-gradient-to-r from-[#e87722] to-[#ff9a3c] px-5 py-2 text-[13px] font-extrabold uppercase tracking-wider text-black xl:ml-4"
          >
            Launch demo
          </a>
        </div>
        <div className="h-[2px] bg-gradient-to-r from-[#0b2c6b] via-[#e87722] to-[#1a7a34]" />
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden pt-28">
        <WebGLGuard>
          <SageHero3D />
        </WebGLGuard>
        <div className="grid-bg absolute inset-0 opacity-30" />
        <ParticleField density={40} />
        <div className="animate-float-slow pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-[#0b2c6b]/60 blur-[110px]" />
        <div className="animate-float-slow2 pointer-events-none absolute -right-24 top-40 h-[28rem] w-[28rem] rounded-full bg-[#e87722]/25 blur-[120px]" />
        <div className="pointer-events-none absolute left-1/2 top-[34rem] h-72 w-[42rem] -translate-x-1/2 rounded-full bg-[#1a7a34]/15 blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {["SIH 2026 · PS 26237", "OFFLINE · AIR-GAPPED", "POST-QUANTUM", "TEAM NIV ARA"].map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-[#e87722]/30 bg-[#e87722]/10 px-3 py-1 font-mono text-[11px] tracking-wider text-[#ffb86b]"
                >
                  {b}
                </span>
              ))}
            </div>
            <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
              SAGE{" "}
              <span className="animate-gradient-pan bg-gradient-to-r from-[#e87722] via-[#ffcf6b] to-[#e87722] bg-clip-text text-transparent text-glow-saffron">
                X
              </span>
              <span className="mt-3 block text-[15px] font-bold uppercase tracking-[0.3em] text-white/60 sm:text-lg">
                Secure Attribution & Governance Engine
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
              Every decryption leaves a <span className="font-bold text-[#ff9a3c]">fingerprint</span>.
              Every fingerprint carries a <span className="font-bold text-[#c084fc]">signature</span>.
              Every signature lives on an <span className="font-bold text-[#7dffb0]">offline ledger</span>.
            </p>

            <div className="mt-4 h-12 font-mono text-[13px] text-[#8db4ff] sm:text-sm">
              <span className="text-[#e87722]">$</span> {typed}
              <span className="animate-blink">▊</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="#demo"
                className="rounded-2xl bg-gradient-to-r from-[#e87722] to-[#ff9a3c] px-7 py-3.5 text-sm font-extrabold uppercase tracking-wider text-black shadow-[0_0_40px_rgba(232,119,34,0.4)] transition-transform hover:scale-[1.03]"
              >
                ▶ Run demonstrative workflow
              </a>
              <a
                href="#workflow"
                className="rounded-2xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-extrabold uppercase tracking-wider backdrop-blur transition-colors hover:border-[#e87722]/60"
              >
                Explore 7 stages
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { k: "7", v: "Provenance layers" },
                { k: "12", v: "Logical components" },
                { k: "PQC", v: "ML-KEM + ML-DSA" },
                { k: "0", v: "Cloud / public chain" },
              ].map((s) => (
                <div key={s.v} className="glass rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-[#e87722]">{s.k}</div>
                  <div className="mt-1 text-[12px] font-semibold uppercase tracking-wider text-white/60">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* HERO visual */}
          <div className="relative">
            <div className="glass-strong relative overflow-hidden rounded-3xl p-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 overflow-hidden">
                <div
                  className="absolute left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#22c55e] to-transparent"
                  style={{ animation: "scanline 3.2s linear infinite", position: "absolute" }}
                />
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-white/50">
                <span>ENCRYPTED PACKAGE · P</span>
                <span className="rounded bg-[#22c55e]/15 px-2 py-0.5 text-[#7dffb0]">AES-256-GCM ✓</span>
              </div>
              <div className="mt-4 space-y-2.5 font-mono text-[12px]">
                {[
                  ["DocumentID", "DOC-7F3A-2026", "#8db4ff"],
                  ["ContentHash", "9f2c…a41d  (SHA-256)", "#8db4ff"],
                  ["Ciphertext + IV + Tag", "C ‖ nonce ‖ T", "#60a5fa"],
                  ["Envelope R-01", "CT_KEM ‖ X_eph ‖ salt ‖ DEK_wrapped", "#e87722"],
                  ["Envelope R-02", "CT_KEM ‖ X_eph ‖ salt ‖ DEK_wrapped", "#e87722"],
                  ["Envelope R-03", "CT_KEM ‖ X_eph ‖ salt ‖ DEK_wrapped", "#e87722"],
                ].map(([k, v, c]) => (
                  <div key={k} className="flex items-center justify-between gap-2 rounded-lg bg-black/40 px-3 py-2">
                    <span className="text-white/50">{k}</span>
                    <span style={{ color: c as string }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-[2px] flex-1 bg-gradient-to-r from-[#e87722] to-[#22c55e]" />
                <span className="font-mono text-[11px] text-white/60">KEK = HKDF(ss_kem ‖ ss_x, envelope-ctx)</span>
                <div className="h-[2px] flex-1 bg-gradient-to-l from-[#e87722] to-[#22c55e]" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { t: "DECRYPT ✓", s: "GCM tag gate", c: "#7dffb0" },
                  { t: "WM-ID", s: "opaque fingerprint", c: "#ff9a3c" },
                  { t: "BLOCK #14xx", s: "ledger commit", c: "#8db4ff" },
                ].map((b) => (
                  <div key={b.t} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3">
                    <div className="text-[13px] font-black" style={{ color: b.c }}>
                      {b.t}
                    </div>
                    <div className="font-mono text-[10px] text-white/50">{b.s}</div>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-dashed border-[#e87722]/30 animate-spin-slower" />
            </div>
            <div className="mt-3 rounded-2xl border border-[#e87722]/25 bg-[#e87722]/[0.07] px-4 py-3 font-mono text-[12px] text-[#ffb86b]">
              ⚠ Demo uses simulated hex — real deployment uses NIST FIPS 203/204 libraries + approved AES-GCM.
            </div>
          </div>
        </div>

        {/* workflow quick-strip — high visibility */}
        <div className="relative border-t border-white/10 bg-black/50 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 sm:px-6">
            <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
              Pipeline ▸
            </span>
            {PHASES.map((p, i) => (
              <a
                key={p.n}
                href="#workflow"
                className="flex shrink-0 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 font-mono text-[12px] transition-all hover:scale-[1.04]"
                style={{ borderColor: `${p.color}44` }}
                title={p.title}
              >
                <span className="font-black" style={{ color: p.color }}>
                  {p.n}
                </span>
                <span className="text-white/75">{p.icon}</span>
                {i < PHASES.length - 1 && <span className="text-white/25">→</span>}
              </a>
            ))}
            <a href="#demo" className="shrink-0 rounded-full bg-[#e87722] px-4 py-1.5 font-mono text-[12px] font-black text-black">
              TRY LIVE ↓
            </a>
          </div>
        </div>

        {/* marquee */}
        <div className="relative border-y border-white/10 bg-black/40 py-3 backdrop-blur">
          <div className="flex overflow-hidden">
            <div className="animate-marquee flex shrink-0 items-center gap-8 pr-8 font-mono text-[12px] tracking-[0.2em] text-white/60">
              {Array.from({ length: 2 }).flatMap((_, k) =>
                ["AES-256-GCM", "ML-KEM-768", "X25519 (CLASSICAL)", "HKDF-SHA256", "ML-DSA-65", "SHA-256", "REED-SOLOMON", "DCT WATERMARK", "PERMISSIONED DLT", "AIR-GAPPED"].map(
                  (t) => (
                    <span key={`${k}-${t}`} className="flex items-center gap-8">
                      <span>{t}</span>
                      <span className="text-[#e87722]">◆</span>
                    </span>
                  )
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="font-mono text-[12px] uppercase tracking-[0.3em] text-[#e87722]">
                ── 01 · problem understanding ──
              </div>
              <h2 className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">
                Same file. <span className="text-[#e87722]">Zero clues.</span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                A classified document <span className="font-mono text-[#8db4ff]">D</span> is broadcast-encrypted once
                and decrypted independently by <span className="font-mono text-[#8db4ff]">R₁, R₂, R₃</span>. Encryption
                protects the document in transit — but every recipient recovers the{" "}
                <span className="font-bold text-white">identical plaintext</span>:
              </p>
              <div className="mt-5 rounded-2xl border border-[#8db4ff]/25 bg-[#0a1330]/80 p-5 text-center font-mono text-lg text-[#8db4ff]">
                D<sub>R1</sub> = D<sub>R2</sub> = D<sub>R3</sub> = D
                <div className="mt-2 text-[12px] text-white/50">→ leaked copy carries no recipient evidence by itself</div>
              </div>
              <p className="mt-4 text-[14px] leading-relaxed text-white/65">
                Centralized access logs can be altered or lost. Static watermarks are identical for all recipients.
                Signatures don&apos;t live inside the leaked file. Public chains and cloud KMS are unacceptable in
                defence air-gaps. <span className="font-bold text-[#ffb86b]">SAGE X closes this integration gap</span>{" "}
                with: Decryption → Session Watermark → Recipient Signature → Blockchain Provenance.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Confidentiality ≠ Attribution", "Logs are mutable", "Static WM fails", "Quantum readiness"].map((t) => (
                  <span key={t} className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/70">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="glass overflow-hidden rounded-3xl">
                <div className="border-b border-white/10 bg-white/[0.03] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.2em] text-white/50">
                  Research gap — why existing tech alone fails (report Table 1)
                </div>
                <div className="divide-y divide-white/[0.07]">
                  {GAP_ROWS.map(([tech, fn, gap]) => (
                    <div key={tech} className="grid grid-cols-[1fr_1.2fr] gap-3 px-5 py-3.5 text-[13px]">
                      <div>
                        <div className="font-bold text-white">{tech}</div>
                        <div className="font-mono text-[11px] text-[#8db4ff]">{fn}</div>
                      </div>
                      <div className="text-white/60">{gap}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#22c55e]/25 bg-[#22c55e]/[0.07] px-5 py-3 text-[13px] font-semibold text-[#7dffb0]">
                  SAGE X answer: per-decryption session watermark + recipient ML-DSA signature + offline ledger — cryptographically bound, not administratively asserted.
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="relative border-y border-white/10 bg-[#060b1f]/80 py-20">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="text-center">
              <div className="font-mono text-[12px] uppercase tracking-[0.3em] text-[#e87722]">
                ── 02 · workflow · see it, do not just read it ──
              </div>
              <h2 className="mt-3 text-5xl font-black tracking-tight sm:text-7xl">
                SEE THE <span className="text-[#e87722] text-glow-saffron">FLOW.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/65">
                7 glowing stages. Click any node. Watch evidence travel.
              </p>
            </div>
          </Reveal>

          {/* HUGE 3D PIPELINE — write less, show huge (2D fallback if no WebGL) */}
          <div className="mt-8">
            <WebGLGuard
              fallback={
                <div className="rounded-3xl border border-white/10 bg-[#03061a] p-6">
                  <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
                    3D unavailable — 2D pipeline view
                  </div>
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                    {PHASES.map((p, i) => (
                      <div key={p.n} className="flex shrink-0 items-center gap-3">
                        <div
                          className="w-44 shrink-0 rounded-2xl border bg-white/[0.03] p-4"
                          style={{ borderColor: `${p.color}55` }}
                        >
                          <div className="font-mono text-2xl font-black" style={{ color: p.color }}>
                            {p.n} {p.icon}
                          </div>
                          <div className="mt-1 text-[14px] font-bold">{p.title}</div>
                          <div className="font-mono text-[11px] text-white/50">{p.tech.split("·")[0]}</div>
                        </div>
                        {i < PHASES.length - 1 && <span style={{ color: p.color }}>→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              }
            >
              <Pipeline3D
                phases={PHASES.map((p) => ({
                  n: p.n,
                  title: p.title,
                  short: p.tech.split("·")[0].trim(),
                  color: p.color,
                  icon: p.icon,
                }))}
              />
            </WebGLGuard>
          </div>

          <div className="mt-8">
            <WorkflowExplorer phases={PHASES} />
          </div>

          <div className="relative mt-10">
            <div className="mb-6 flex items-center gap-3">
              <span className="font-mono text-[12px] uppercase tracking-[0.25em] text-white/40">
                Full stage reference — scroll the chain
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#e87722]/50 to-transparent" />
            </div>
            <div className="absolute bottom-8 left-8 top-8 hidden w-[2px] bg-gradient-to-b from-[#60a5fa] via-[#e87722] to-[#22c55e] lg:block" />
            <div className="space-y-4">
              {PHASES.map((p, i) => (
                <Reveal key={p.n} delay={Math.min(i * 60, 300)}>
                  <div id={`stage-${p.n}`} className="group relative ml-0 scroll-mt-28 lg:ml-16">
                    <span
                      className="absolute -left-16 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl border font-mono text-xl font-black lg:flex"
                      style={{ borderColor: `${p.color}55`, background: "#040816", color: p.color, boxShadow: `0 0 24px ${p.color}33` }}
                    >
                      {p.icon}
                    </span>
                    <div className="glass overflow-hidden rounded-3xl transition-all hover:border-[#e87722]/40">
                      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                        <span
                          className="font-mono text-4xl font-black opacity-90"
                          style={{ color: p.color, textShadow: `0 0 24px ${p.color}66` }}
                        >
                          {p.n}
                        </span>
                        <div className="flex-1">
                          <h3 className="text-xl font-black tracking-tight">{p.title}</h3>
                          <div className="mt-1 font-mono text-[12px]" style={{ color: p.color }}>
                            {p.tech}
                          </div>
                          <p className="mt-2 text-[14px] leading-relaxed text-white/65">{p.desc}</p>
                          <div className="mt-3 grid gap-2 font-mono text-[11px] sm:grid-cols-2">
                            <div className="rounded-lg bg-black/30 px-3 py-2 text-white/55">
                              <span className="text-[#7dffb0]">IN ▸ </span>
                              {p.inputs.join(" · ")}
                            </div>
                            <div className="rounded-lg bg-black/30 px-3 py-2 text-white/55">
                              <span style={{ color: p.color }}>OUT ▸ </span>
                              {p.outputs.join(" · ")}
                            </div>
                          </div>
                        </div>
                        <div className="hidden items-center sm:flex">
                          <svg width="90" height="26" viewBox="0 0 90 26">
                            <line x1="4" y1="13" x2="86" y2="13" stroke={p.color} strokeWidth="2" className="flow-line" opacity="0.7" />
                            <polygon points="78,6 90,13 78,20" fill={p.color} />
                          </svg>
                        </div>
                      </div>
                      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${p.color}, transparent)` }} />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" className="relative border-b border-white/10 bg-[#040816] py-20">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="font-mono text-[12px] uppercase tracking-[0.3em] text-[#22c55e]">
                  ●● 03 · live interactive lab
                </div>
                <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                  Run the pipeline <span className="text-[#e87722]">yourself.</span>
                </h2>
                <p className="mt-3 max-w-2xl text-white/65">
                  Pick a recipient, run the full encrypt → watermark → sign → ledger flow with real SHA-256 hashing in
                  your browser, then leak the file and watch forensics attribute it — or correctly refuse when tampered.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 font-mono text-[12px] text-white/60">
                D = D<sub>R1</sub> = D<sub>R2</sub> = D<sub>R3</sub> → leak source = <span className="text-[#e87722]">?</span>
              </div>
            </div>
          </Reveal>
          <div className="mt-8">
            <DemoLab />
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section id="architecture" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="text-center">
            <div className="font-mono text-[12px] uppercase tracking-[0.3em] text-[#8db4ff]">
              ── 04 · system architecture · 12 components ──
            </div>
            <h2 className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">
              Air-gapped <span className="text-[#8db4ff] text-glow-blue">trust fabric.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-white/60">
              12 components. 7 layers. 0 cloud. Hover the diagram — the flow tells the story.
            </p>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="glass rounded-3xl p-6">
              <h3 className="font-mono text-[12px] uppercase tracking-[0.25em] text-white/50">
                End-to-end dataflow (from report Fig.1)
              </h3>
              <svg viewBox="0 0 400 460" className="mt-4 w-full">
                {[
                  { y: 30, t: "1 · IDENTITY & KEYS", s: "Offline CA · KEM/X/SIG", c: "#60a5fa" },
                  { y: 105, t: "2 · DOCUMENT PROTECT", s: "ContentHash → DEK → AES-GCM + envelopes", c: "#8db4ff" },
                  { y: 180, t: "3 · DECRYPT (no SessionID)", s: "Auth → KEK → DEK → GCM verify", c: "#e87722" },
                  { y: 255, t: "4 · WATERMARK (post-decrypt)", s: "SessionID+salt → WM-ID → RS → embed", c: "#ff9a3c" },
                  { y: 330, t: "5 · SIGNED EVENT", s: "ContentHash+ArtifactHash → ML-DSA-65", c: "#c084fc" },
                  { y: 405, t: "6 · PERMISSIONED LEDGER", s: "metadata only · off-chain doc", c: "#22c55e" },
                ].map((b, i, arr) => (
                  <g key={b.t}>
                    <rect x="20" y={b.y - 24} width="360" height="56" rx="12" fill="#0a1330" stroke={b.c} strokeOpacity="0.6" />
                    <text x="200" y={b.y - 4} textAnchor="middle" fill={b.c} fontSize="12" fontWeight="800" fontFamily="monospace">
                      {b.t}
                    </text>
                    <text x="200" y={b.y + 14} textAnchor="middle" fill="#aab6d8" fontSize="10" fontFamily="monospace">
                      {b.s}
                    </text>
                    {i < arr.length - 1 && (
                      <line x1="200" y1={b.y + 32} x2="200" y2={arr[i + 1].y - 24} stroke={b.c} strokeWidth="2" className="flow-line" />
                    )}
                  </g>
                ))}
              </svg>
              <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="rounded-lg bg-black/40 px-3 py-2 text-white/60">12 logical components · 7 layers</div>
                <div className="rounded-lg bg-black/40 px-3 py-2 text-[#7dffb0]">Doc NEVER on-chain ✓</div>
              </div>
            </div>
          </Reveal>
          <div className="space-y-4">
            {[
              { t: "DEK / KEK separation", d: "Random DEK encrypts doc once. HKDF-derived KEK wraps DEK per-recipient. Compromise of one envelope ≠ doc compromise." },
              { t: "Envelope vs Watermark KDF", d: "Envelope ctx: DocID ‖ KeyID ‖ EnvID ‖ Suite (NO SessionID). Watermark ctx: DocID ‖ KeyID ‖ SessionID ‖ Salt ‖ v3. Clean layer separation." },
              { t: "ContentHash ≠ ArtifactHash", d: "Watermarking changes bytes by design. Provenance event stores BOTH — lineage is checkable, confusion is impossible." },
              { t: "Fail-closed forensics", d: "GCM failure, RS-overflow corruption, or bad ML-DSA signature → INSUFFICIENT EVIDENCE. SAGE X never guesses a recipient." },
              { t: "Attribution scope (honest)", d: "Proves control of a registered signing key at signing time — not who held paper, not intent, not credential-sharing. Report § Forensics." },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 70}>
                <div className="glass rounded-2xl border-l-4 border-l-[#e87722] p-5">
                  <h4 className="font-black">{c.t}</h4>
                  <p className="mt-1 text-[14px] text-white/65">{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="border-y border-white/10 bg-[#060b1f]/80 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="font-mono text-[12px] uppercase tracking-[0.3em] text-[#f472b6]">
              ── 05 · threat model + key lifecycle + evaluation ──
            </div>
            <h2 className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">
              Built for <span className="text-[#f472b6]">adversaries.</span>
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {THREATS.map((t, i) => (
              <Reveal key={t.t} delay={(i % 4) * 60}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="h-1 w-10 rounded-full" style={{ background: t.c }} />
                  <h4 className="mt-3 font-black leading-tight">{t.t}</h4>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/60">{t.d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="glass h-full rounded-3xl p-6">
                <h3 className="text-xl font-black">🔑 Key lifecycle (offline CA)</h3>
                <div className="mt-4 space-y-0">
                  {LIFECYCLE.map((l, i) => (
                    <div key={l.t} className="relative flex gap-4 pb-5 last:pb-0">
                      {i < LIFECYCLE.length - 1 && (
                        <div className="absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-[2px] bg-gradient-to-b from-[#e87722] to-[#22c55e]" />
                      )}
                      <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e87722] font-mono text-[12px] font-black text-black">
                        {i + 1}
                      </span>
                      <div>
                        <div className="font-bold">{l.t}</div>
                        <div className="text-[13px] text-white/60">{l.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="glass h-full rounded-3xl p-6">
                <h3 className="text-xl font-black">📊 Evaluation framework (report §IV)</h3>
                <p className="mt-2 text-[13px] text-white/60">
                  No measured benchmarks are claimed — this is the prototype scorecard for future benchmarking:
                </p>
                <div className="mt-4 space-y-2">
                  {METRICS.map((m) => (
                    <div key={m.k} className="flex items-center justify-between gap-3 rounded-xl bg-black/30 px-4 py-2.5">
                      <span className="text-[13px] font-bold">{m.k}</span>
                      <span className="text-right font-mono text-[11px] text-[#8db4ff]">{m.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* STACK */}
      <section id="stack" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="font-mono text-[12px] uppercase tracking-[0.3em] text-[#e87722]">── 06 · crypto stack ──</div>
          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Crypto <span className="text-[#e87722]">stack.</span>
          </h2>
          <p className="mt-3 max-w-2xl text-white/60">
            Technology table straight from § Technical Approach — each primitive has exactly one job.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STACK.map((s, i) => (
            <Reveal key={s.t} delay={(i % 4) * 70}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:-translate-y-1 hover:border-[#e87722]/50">
                <div
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${s.c}, transparent)` }}
                />
                <div className="font-mono text-[13px] font-black" style={{ color: s.c }}>
                  {s.t}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{s.d}</p>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-8 grid gap-4 font-mono text-[12px] sm:grid-cols-3 sm:text-[13px]">
          {[
            "WM-ID = HKDF(WM-Secret, DocID‖KeyID‖SessionID‖Salt‖v3)",
            "KEKᵢ = HKDF.Expand(PRK_env, DST‖Suite‖DocID‖KeyID‖EnvID)",
            "H_E = SHA-256(Canonical(E)) · σ = ML-DSA.Sign(SK, H_E)",
          ].map((e) => (
            <div key={e} className="rounded-2xl border border-[#8db4ff]/20 bg-[#0a1330]/80 px-4 py-4 text-center text-[#8db4ff]">
              {e}
            </div>
          ))}
        </div>
      </section>

      {/* SCOPE + FORENSIC PATH */}
      <section id="scope" className="border-y border-white/10 bg-[#060b1f]/80 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="font-mono text-[12px] uppercase tracking-[0.3em] text-[#7dffb0]">
              ── 07 · forensic decision path + scope ──
            </div>
            <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Forensics that <span className="text-[#7dffb0]">refuses to guess.</span>
            </h2>
          </Reveal>
          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
            {FORENSIC_STEPS.map((s, i) => (
              <div key={s} className="flex shrink-0 items-center gap-2">
                <div className="max-w-[190px] rounded-2xl border border-[#7dffb0]/25 bg-[#22c55e]/[0.07] px-4 py-3 text-[12px] font-semibold text-white/80">
                  <span className="font-mono text-[#7dffb0]">{i + 1} ▸ </span>
                  {s}
                </div>
                {i < FORENSIC_STEPS.length - 1 && <span className="text-[#7dffb0]">→</span>}
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-3xl border border-[#22c55e]/30 bg-[#22c55e]/[0.06] p-7">
                <h3 className="text-2xl font-black text-[#7dffb0]">✓ What SAGE X guarantees</h3>
                <ul className="mt-4 space-y-2.5 text-[14px] text-white/75">
                  {[
                    "Only GCM-authenticated decryptions create watermarks + ledger events",
                    "Every session gets a distinct opaque WM-ID (R₁S₁ ≠ R₂S₁, R₁S₁ ≠ R₁S₂)",
                    "Provenance events verifiable offline via ML-DSA-65 + registered keys",
                    "Ledger is tamper-evident + append-oriented; doc never touches chain",
                    "Hybrid key safety: secure if ML-KEM OR X25519 holds",
                    "Air-gapped: no cloud KMS, no public chain, no external API",
                  ].map((g) => (
                    <li key={g} className="flex gap-2">
                      <span className="text-[#22c55e]">▸</span> {g}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="h-full rounded-3xl border border-red-500/30 bg-red-500/[0.06] p-7">
                <h3 className="text-2xl font-black text-red-200">✕ Explicitly out of scope</h3>
                <ul className="mt-4 space-y-2.5 text-[14px] text-white/75">
                  {[
                    "Does NOT prove which human leaked it, intent, or credential sharing",
                    "Watermark extraction alone is NEVER definitive — needs signature + hashes",
                    "No absolute ledger immutability claim — depends on consensus + governance",
                    "No perfect watermark survival — robustness measured per format",
                    "Revocation blocks future sessions; history still verifies under old KeyID",
                    "No measured benchmarks claimed — evaluation framework for future prototype",
                  ].map((g) => (
                    <li key={g} className="flex gap-2">
                      <span className="text-red-400">▸</span> {g}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ + TEAM */}
      <section id="faq" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Reveal>
              <div className="font-mono text-[12px] uppercase tracking-[0.3em] text-[#e87722]">── 08 · faq ──</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight">Questions evaluators ask.</h2>
            </Reveal>
            <div className="mt-6">
              <Faq />
            </div>
          </div>
          <div id="team">
            <Reveal delay={100}>
              <div className="font-mono text-[12px] uppercase tracking-[0.3em] text-[#8db4ff]">── 09 · team niv ara ──</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight">Builders.</h2>
              <p className="mt-2 font-mono text-[12px] text-white/50">Team ID 176321 · PS 26237 · Blockchain & Cybersecurity</p>
            </Reveal>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {TEAM.map((m, i) => (
                <Reveal key={m.n} delay={(i % 2) * 70}>
                  <div className="glass rounded-2xl p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0b2c6b] to-[#e87722] font-black">
                      {m.n[0]}
                    </div>
                    <div className="mt-3 font-bold">{m.n}</div>
                    <div className="font-mono text-[11px] text-[#e87722]">{m.r}</div>
                    <div className="mt-1 break-all font-mono text-[10px] text-white/40">{m.m}</div>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 font-mono text-[11px] leading-relaxed text-white/50">
              Tech: AES-256-GCM ‖ ML-KEM-768 + X25519 ‖ HKDF ‖ ML-DSA-65 ‖ RS + Forensic WM ‖ Permissioned DLT (offline)
              <br />
              Problem: Cryptographic Attribution & Immutable Decryption Provenance for Multi-Recipient Encrypted
              Document Distribution
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black/50">
        <div className="h-[3px] bg-gradient-to-r from-[#0b2c6b] via-[#e87722] via-[#ffcf6b] to-[#1a7a34]" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3">
          <div>
            <div className="text-xl font-black tracking-[0.15em]">
              SAGE <span className="text-[#e87722]">X</span>
            </div>
            <p className="mt-2 max-w-sm text-[13px] text-white/55">
              Secure Attribution & Governance Engine — Post-quantum cryptographic framework for recipient-level
              attribution and decryption provenance. SIH 2026 · PS 26237 · Theme: Blockchain & Cybersecurity.
            </p>
            <p className="mt-3 font-mono text-[11px] text-white/40">Team Niv Ara · ID 176321 · Lead: Mainak Manna</p>
          </div>
          <div className="font-mono text-[12px] text-white/55">
            <div className="uppercase tracking-[0.25em] text-white/40">Report map</div>
            <div className="mt-3 space-y-1.5">
              <div>Novelty → session WM + ML-DSA + offline ledger</div>
              <div>Feasibility → hybrid PQC + format-aware WM + Fabric</div>
              <div>Impact → air-gapped defence, doc off-chain</div>
              <div>Risks → key compromise · WM destruction · governance</div>
            </div>
          </div>
          <div>
            <div className="font-mono text-[12px] uppercase tracking-[0.25em] text-white/40">Demonstrative build</div>
            <p className="mt-3 text-[13px] text-white/55">
              This site is an animated demonstrative workflow of the SAGE X report — all pipeline values are simulated
              in-browser (except real SHA-256). Not a cryptographic implementation.
            </p>
            <a
              href="#top"
              className="mt-4 inline-block rounded-full border border-[#e87722]/40 bg-[#e87722]/10 px-5 py-2 text-[12px] font-bold uppercase tracking-wider text-[#ffb86b]"
            >
              ↑ Back to top
            </a>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center font-mono text-[11px] text-white/35">
          SAGE X · Smart India Hackathon 2026 · Jai Hind 🇮🇳
          <span className="mx-2 text-white/20">|</span>
          Designed & Developed by{" "}
          <a
            href="https://suman-rana.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#e87722] transition-colors hover:text-[#ff9a3c] hover:underline"
          >
            Suman Rana
          </a>
        </div>
      </footer>
    </div>
  );
}
