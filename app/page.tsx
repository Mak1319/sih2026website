"use client";

import { useState, type ReactNode } from "react";
import Reveal from "./components/Reveal";
import DemoLab from "./components/DemoLab";

const NAV = [
  { label: "Problem", href: "#problem" },
  { label: "Journey", href: "#flow" },
  { label: "Exhibit", href: "#demo" },
  { label: "System", href: "#system" },
  { label: "Security", href: "#security" },
  { label: "Stack", href: "#stack" },
  { label: "FAQ", href: "#faq" },
];

type Phase = { n: string; title: string; tech: string; blurb: string; color: string; icon: string };

const PHASES: Phase[] = [
  { n: "01", title: "Identity & Keys", tech: "Offline CA · ML-KEM · ML-DSA", blurb: "Recipients enrolled air-gapped. Keys versioned per identity.", color: "#60a5fa", icon: "⬡" },
  { n: "02", title: "Protect", tech: "AES-256-GCM · HKDF", blurb: "One ciphertext. One DEK. A sealed envelope per recipient.", color: "#8db4ff", icon: "◈" },
  { n: "03", title: "Decrypt gate", tech: "GCM tag verify", blurb: "Bad tag → no watermark, no event, nothing downstream.", color: "#e87722", icon: "⬣" },
  { n: "04", title: "Watermark", tech: "WM-ID · Reed-Solomon", blurb: "Fresh session fingerprint, invisible inside the copy.", color: "#ff9a3c", icon: "◎" },
  { n: "05", title: "Sign", tech: "ML-DSA-65", blurb: "Event hashed + signed. Verifiable fully offline.", color: "#c084fc", icon: "✦" },
  { n: "06", title: "Ledger", tech: "Permissioned DLT", blurb: "Metadata only. The document never touches the chain.", color: "#22c55e", icon: "⛓" },
  { n: "07", title: "Forensics", tech: "Extract → verify", blurb: "Match WM-ID, signature, hashes — or refuse to guess.", color: "#7dffb0", icon: "◉" },
];

const GAPS = [
  { t: "Encryption", d: "hides content — not the leaker", icon: "🔒" },
  { t: "Access logs", d: "mutable, living outside the file", icon: "📝" },
  { t: "Static watermark", d: "the same mark for everyone", icon: "💧" },
  { t: "Signatures", d: "do not travel inside leaks", icon: "✒️" },
];

const PRINCIPLES = [
  { t: "DEK encrypts once · KEK wraps per-recipient", d: "One compromised envelope is not a compromised document." },
  { t: "ArtifactHash ≠ ContentHash — by design", d: "Watermarking changes bytes. The event stores both." },
  { t: "Fail closed, always", d: "Any doubt becomes insufficient evidence. Never a guess." },
];

const THREATS = [
  { t: "Tampered ciphertext", d: "Tag fails → full stop. Attacker gains nothing.", c: "#60a5fa", icon: "◈" },
  { t: "Forged events", d: "Bad ML-DSA signature → rejected, never committed.", c: "#c084fc", icon: "✦" },
  { t: "Watermark removal", d: "Damage beyond ECC capacity → honest no-guess.", c: "#ff9a3c", icon: "◎" },
  { t: "Replay", d: "Unique session + envelope IDs. Duplicates dropped.", c: "#e87722", icon: "↻" },
  { t: "Ledger tampering", d: "Hash-chained + endorsed. Tamper-evident.", c: "#22c55e", icon: "⛓" },
  { t: "Key compromise", d: "Revocation blocks future sessions; history still verifies.", c: "#f472b6", icon: "⬡" },
];

const LIFECYCLE = [
  { t: "Generate", d: "CSPRNG keys, controlled env" },
  { t: "Register", d: "ID + versioned KeyID" },
  { t: "Use", d: "one key, one job" },
  { t: "Rotate / Revoke", d: "new versions; revoke blocks" },
  { t: "Verify history", d: "old events still check out" },
];

const STACK = [
  { t: "AES-256-GCM", d: "Doc encryption. Tag failure stops everything.", c: "#60a5fa" },
  { t: "ML-KEM-768", d: "Post-quantum envelope per recipient.", c: "#8db4ff" },
  { t: "X25519", d: "Classical half of the hybrid.", c: "#a5b4fc" },
  { t: "HKDF-SHA256", d: "Separate contexts: envelopes vs watermarks.", c: "#e87722" },
  { t: "ML-DSA-65", d: "Post-quantum signatures on events.", c: "#c084fc" },
  { t: "SHA-256", d: "ContentHash ≠ ArtifactHash. Always.", c: "#93c5fd" },
  { t: "RS + Watermark", d: "Error correction + invisible embed.", c: "#ff9a3c" },
  { t: "Permissioned DLT", d: "Offline metadata ledger. No doc on-chain.", c: "#22c55e" },
];

const FORENSIC = [
  { t: "Recover the leak", icon: "📥" },
  { t: "Extract the WM-ID", icon: "◎" },
  { t: "Match the ledger event", icon: "⛓" },
  { t: "Verify sig + hashes", icon: "✦" },
  { t: "Attribute — or refuse", icon: "◉" },
];

const FAQS = [
  {
    q: "Why not just use access logs?",
    a: "Logs live outside the file and can be altered. SAGE X puts the fingerprint inside the artifact and a signed event on the ledger — evidence travels with the leak.",
  },
  {
    q: "Why is the watermark opaque?",
    a: "WM-ID reveals nothing by itself. Only the ledger maps it to an event — and only after the signature and hashes verify.",
  },
  {
    q: "What if the ciphertext is tampered with?",
    a: "GCM tag verification fails and the pipeline halts: no watermark, no signature, no ledger entry.",
  },
  {
    q: "Is it quantum-safe?",
    a: "ML-KEM-768 + ML-DSA-65 (NIST FIPS 203/204), hybridised with X25519 — secure if either half holds.",
  },
  {
    q: "What if the watermark is destroyed?",
    a: "Reed-Solomon tolerates bounded damage. Beyond it, SAGE X reports insufficient evidence instead of guessing — try the tamper toggle in the live demo.",
  },
];

const TEAM = [
  { n: "Mainak Manna", r: "Crypto / Lead", c: "#60a5fa" },
  { n: "Suman Rana", r: "Backend", c: "#e87722" },
  { n: "Suman Mallick", r: "Blockchain", c: "#22c55e" },
  { n: "Ayaan Goldar", r: "Testing / Docs", c: "#c084fc" },
  { n: "Riya Ghorai", r: "Watermarking", c: "#ff9a3c" },
  { n: "Dipsikha Dutta", r: "Frontend / Forensics", c: "#7dffb0" },
];

function ChapterHead({
  no,
  kicker,
  title,
  lede,
  accent,
}: {
  no: string;
  kicker: string;
  title: ReactNode;
  lede?: string;
  accent: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4">
        <span className="font-mono text-[12px] tracking-[0.3em]" style={{ color: accent }}>
          {no}
        </span>
        <span className="rule-fade flex-1" aria-hidden />
        <span className="font-mono text-[12px] uppercase tracking-[0.3em] text-white/40">{kicker}</span>
      </div>
      <h2 className="mt-5 font-serif text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl">{title}</h2>
      {lede && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/65">{lede}</p>}
    </div>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="border-t border-white/10">
      {FAQS.map((f, i) => (
        <div key={f.q} className="border-b border-white/10">
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            aria-expanded={open === i}
            className="group flex w-full items-center gap-4 py-5 text-left"
          >
            <span className="font-mono text-[12px] text-white/30">0{i + 1}</span>
            <span className={`flex-1 font-serif text-xl font-bold transition-colors sm:text-2xl ${open === i ? "text-[#e87722]" : "group-hover:text-white"}`}>
              {f.q}
            </span>
            <span className={`font-mono text-2xl leading-none ${open === i ? "text-[#e87722]" : "text-white/40"}`}>
              {open === i ? "−" : "+"}
            </span>
          </button>
          {open === i && (
            <p className="animate-block-in max-w-2xl pb-6 pl-9 text-[15px] leading-relaxed text-white/65">{f.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function FlowVisual({ phases }: { phases: Phase[] }) {
  const [active, setActive] = useState(2);
  const p = phases[active];
  return (
    <div className="mt-12 grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div key={p.n} className="animate-block-in">
          <div
            className="font-serif text-[7rem] font-black leading-none sm:text-[9rem]"
            style={{ color: p.color, textShadow: `0 0 90px ${p.color}55` }}
          >
            {p.n}
          </div>
          <h3 className="mt-2 font-serif text-4xl font-black tracking-tight">{p.title}</h3>
          <div className="mt-2 font-mono text-[12px] uppercase tracking-[0.2em]" style={{ color: p.color }}>
            {p.tech}
          </div>
          <p className="mt-3 max-w-md text-lg leading-relaxed text-white/75">{p.blurb}</p>
          <div className="mt-6 flex items-center gap-1.5" aria-label={`Stage ${p.n} of 7`}>
            {phases.map((x, i) => (
              <span
                key={x.n}
                title={`${x.n} · ${x.title}`}
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: i === active ? 26 : 10,
                  background: i <= active ? x.color : "rgba(255,255,255,0.15)",
                  boxShadow: i === active ? `0 0 12px ${x.color}` : "none",
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        {phases.map((ph, i) => (
          <button
            key={ph.n}
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className="group flex w-full items-center gap-5 border-b border-white/10 py-5 text-left"
          >
            <span
              className="w-14 shrink-0 font-serif text-3xl font-black transition-colors"
              style={{ color: i === active ? ph.color : "rgba(255,255,255,0.25)" }}
            >
              {ph.n}
            </span>
            <span className="text-2xl" style={{ color: ph.color }}>
              {ph.icon}
            </span>
            <span className="flex-1">
              <span className={`block text-lg font-bold transition-colors ${i === active ? "text-white" : "text-white/60 group-hover:text-white"}`}>
                {ph.title}
              </span>
              <span className="block font-mono text-[11px] text-white/40">{ph.tech}</span>
            </span>
            <span
              className={`font-mono transition-opacity ${i === active ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}
              style={{ color: ph.color }}
            >
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="aurora-bg relative min-h-screen text-[#eef2fa]">
      <div className="grain" aria-hidden />

      {/* NAV */}
      <header className="glass-nav fixed inset-x-0 top-0 z-50">
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
          <nav className="ml-auto hidden items-center gap-5 text-[13px] font-semibold text-white/70 lg:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors hover:text-[#e87722]">
                {n.label}
              </a>
            ))}
          </nav>
          <a
            href="#demo"
            className="btn-primary ml-auto rounded-full px-5 py-2 text-[13px] font-extrabold uppercase tracking-wider lg:ml-4"
          >
            Launch demo
          </a>
        </div>
        <div className="h-[2px] bg-gradient-to-r from-[#0b2c6b] via-[#e87722] to-[#1a7a34]" />
      </header>

      {/* PROLOGUE / HERO */}
      <section id="top" className="relative overflow-hidden">
        <div className="animate-float-slow pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-[#0b2c6b]/60 blur-[110px]" />
        <div className="animate-float-slow2 pointer-events-none absolute -right-24 top-40 h-[28rem] w-[28rem] rounded-full bg-[#e87722]/25 blur-[120px]" />

        <div className="relative mx-auto flex min-h-[94vh] max-w-5xl flex-col justify-center px-4 pb-16 pt-32 text-center sm:px-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.35em] text-[#ffb86b]">
            SIH 2026 · PS 26237 · Team Niv Ara
          </div>
          <h1 className="mt-6 font-serif text-6xl font-black leading-[0.98] tracking-tight sm:text-8xl">
            Every leak
            <br />
            tells a story.
          </h1>
          <p className="animate-gradient-pan mx-auto mt-4 bg-gradient-to-r from-[#e87722] via-[#ffcf6b] to-[#e87722] bg-clip-text font-serif text-3xl font-bold italic text-transparent sm:text-4xl">
            We recover the ending.
          </p>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            SAGE X — Secure Attribution & Governance Engine. An offline, post-quantum chain of evidence, from
            decryption to verdict.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#demo" className="btn-primary rounded-2xl px-8 py-3.5 text-sm font-extrabold uppercase tracking-wider">
              ▶ Run the live demo
            </a>
            <a href="#problem" className="btn-ghost rounded-2xl px-8 py-3.5 text-sm font-extrabold uppercase tracking-wider">
              Read the story ↓
            </a>
          </div>
          <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[12px] tracking-[0.2em] text-white/45">
            <span><span className="font-black text-[#e87722]">07</span> STAGES</span>
            <span className="text-white/20">·</span>
            <span><span className="font-black text-[#e87722]">0</span> CLOUD</span>
            <span className="text-white/20">·</span>
            <span><span className="font-black text-[#e87722]">PQC</span> CORE</span>
            <span className="text-white/20">·</span>
            <span>LEAK → VERDICT</span>
          </div>

          {/* Exhibit A — the dossier */}
          <div className="glass-card relative mx-auto mt-12 w-full max-w-3xl overflow-hidden rounded-3xl p-6 text-left sm:p-8">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.25em] text-white/50">
              <span>Exhibit A · Encrypted package</span>
              <span className="rounded bg-[#22c55e]/15 px-2 py-0.5 text-[#7dffb0]">AES-256-GCM ✓</span>
            </div>
            <div className="mt-4 grid gap-2.5 font-mono text-[12px] sm:grid-cols-2">
              {[
                ["DocumentID", "DOC-7F3A-2026", "#8db4ff"],
                ["ContentHash", "9f2c…a41d", "#8db4ff"],
                ["Ciphertext", "C ‖ nonce ‖ tag", "#60a5fa"],
                ["Envelopes", "R-01 · R-02 · R-03", "#e87722"],
              ].map(([k, v, c]) => (
                <div key={k} className="flex items-center justify-between gap-2 rounded-lg bg-black/40 px-3 py-2.5">
                  <span className="text-white/50">{k}</span>
                  <span style={{ color: c as string }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center" aria-hidden>
              {[
                ["GCM ✓", "#7dffb0"],
                ["WM-ID", "#ff9a3c"],
                ["σ", "#c084fc"],
                ["Block", "#8db4ff"],
              ].map(([t, c], i, arr) => (
                <div key={t} className="flex flex-1 items-center last:flex-none">
                  <span
                    className="rounded-lg px-2 py-1 font-mono text-[11px] font-black"
                    style={{ color: c, background: `${c}18`, border: `1px solid ${c}55` }}
                  >
                    {t}
                  </span>
                  {i < arr.length - 1 && <span className="shimmer-line mx-1 h-[2px] flex-1" />}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 font-mono text-[11px] text-white/35">Demo values simulated in-browser · SHA-256 is real</div>
        </div>

        {/* marquee */}
        <div className="relative border-y border-white/10 bg-black/40 py-3 backdrop-blur">
          <div className="flex overflow-hidden">
            <div className="animate-marquee flex shrink-0 items-center gap-8 pr-8 font-mono text-[12px] tracking-[0.2em] text-white/60">
              {Array.from({ length: 2 }).flatMap((_, k) =>
                ["AES-256-GCM", "ML-KEM-768", "X25519", "HKDF-SHA256", "ML-DSA-65", "REED-SOLOMON", "OFFLINE LEDGER"].map(
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

      {/* CHAPTER 01 — PROBLEM */}
      <section id="problem" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
        <Reveal>
          <ChapterHead
            no="Chapter 01"
            kicker="The problem"
            accent="#e87722"
            title={
              <>
                Same file. <em className="text-[#e87722]">Zero clues.</em>
              </>
            }
          />
          <div className="mt-10 grid gap-12 lg:grid-cols-2">
            <p className="dropcap max-w-lg text-[17px] leading-relaxed text-white/75">
              A classified document is encrypted once and opened by three recipients. Encryption guards the road — but
              each of them holds the identical plaintext. When a copy surfaces in the wild, the file itself accuses no
              one. Logs can be altered, static marks repeat, signatures stay behind.
            </p>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">Scene 01 · three copies, one leak</div>
              <div className="mt-4 border-y border-white/10 py-6">
                <div className="mx-auto w-fit border border-[#8db4ff]/40 bg-[#0a1330]/60 px-8 py-3 text-center font-mono text-[13px] text-[#8db4ff]">
                  📄 classified doc D
                </div>
                <div className="my-2 text-center font-mono text-[12px] text-[#e87722]">↓ encrypt once ↓</div>
                <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
                  {[
                    ["R-01", "#60a5fa"],
                    ["R-02", "#e87722"],
                    ["R-03", "#22c55e"],
                  ].map(([r, c]) => (
                    <div key={r} className="border px-2 py-3 text-center" style={{ borderColor: `${c}55`, background: `${c}0d` }}>
                      <div className="font-mono text-[12px] font-black" style={{ color: c }}>
                        {r}
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-white/60">copy = D</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-center font-mono text-[11px] text-white/45">D₁ = D₂ = D₃ — byte-identical</div>
                <div className="my-2 text-center font-mono text-[12px] text-red-300">↓ one leaks ↓</div>
                <div className="pulse-soft mx-auto w-fit border border-dashed border-red-400/50 bg-red-500/10 px-8 py-3 text-center font-mono text-[13px] text-red-200">
                  leaked copy — source = ?
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-white/10">
            {GAPS.map((g, i) => (
              <div key={g.t} className="grid items-baseline gap-2 border-b border-white/10 py-4 sm:grid-cols-[60px_80px_1fr_1.5fr] sm:gap-6">
                <span className="font-mono text-[12px] text-white/30">0{i + 1}</span>
                <span className="text-2xl">{g.icon}</span>
                <span className="font-serif text-xl font-bold">{g.t}</span>
                <span className="text-[14px] text-white/55">{g.d}</span>
              </div>
            ))}
          </div>
          <blockquote className="mt-10 max-w-3xl border-l-2 border-[#22c55e] pl-6 font-serif text-2xl italic leading-snug text-white/85 sm:text-3xl">
            “SAGE X binds decrypt → watermark → signature → ledger — cryptographically, not administratively.”
          </blockquote>
        </Reveal>
      </section>

      {/* CHAPTER 02 — JOURNEY */}
      <section id="flow" className="scroll-mt-24 border-y border-white/10 bg-[#060b1f]/60">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <Reveal>
            <ChapterHead
              no="Chapter 02"
              kicker="The journey"
              accent="#e87722"
              title={
                <>
                  Seven stages. <em className="text-[#e87722]">One chain of evidence.</em>
                </>
              }
              lede="Follow a document from enrolment to verdict. Select any stage to read it up close."
            />
          </Reveal>
          <FlowVisual phases={PHASES} />
        </div>
      </section>

      {/* CHAPTER 03 — EXHIBIT */}
      <section id="demo" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
        <Reveal>
          <ChapterHead
            no="Chapter 03"
            kicker="The exhibit"
            accent="#22c55e"
            title={
              <>
                Do not take our word. <em className="text-[#e87722]">Run it.</em>
              </>
            }
            lede="Pick a recipient, run encrypt → watermark → sign → ledger in your browser, then leak the file and watch forensics attribute it — or correctly refuse when tampered."
          />
        </Reveal>
        <div className="mt-10">
          <DemoLab />
        </div>
      </section>

      {/* CHAPTER 04 — SYSTEM */}
      <section id="system" className="scroll-mt-24 border-y border-white/10 bg-[#060b1f]/60">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <Reveal>
            <ChapterHead
              no="Chapter 04"
              kicker="The system"
              accent="#8db4ff"
              title={
                <>
                  An air-gapped <em className="text-[#8db4ff]">trust fabric.</em>
                </>
              }
              lede="Twelve components. Seven layers. Zero cloud."
            />
          </Reveal>
          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            <Reveal>
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">Blueprint · end-to-end dataflow</div>
              <svg
                viewBox="0 0 400 460"
                className="mt-4 w-full"
                role="img"
                aria-label="SAGE X dataflow diagram"
                style={{ filter: "drop-shadow(0 0 24px rgba(96,165,250,0.15))" }}
              >
                {[
                  { y: 30, t: "1 · IDENTITY & KEYS", s: "Offline CA · KEM / X / SIG", c: "#60a5fa" },
                  { y: 105, t: "2 · PROTECT", s: "ContentHash → AES-GCM + envelopes", c: "#8db4ff" },
                  { y: 180, t: "3 · DECRYPT GATE", s: "Auth → KEK → GCM verify", c: "#e87722" },
                  { y: 255, t: "4 · WATERMARK", s: "Session → WM-ID → embed", c: "#ff9a3c" },
                  { y: 330, t: "5 · SIGN", s: "Hashes → ML-DSA-65", c: "#c084fc" },
                  { y: 405, t: "6 · LEDGER", s: "metadata only · doc off-chain", c: "#22c55e" },
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
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] text-white/55">
                <span>📦 doc stays off-chain</span>
                <span className="text-[#7dffb0]">✓ only evidence on-ledger</span>
              </div>
            </Reveal>
            <div className="flex flex-col justify-center border-t border-white/10">
              {PRINCIPLES.map((c, i) => (
                <div key={c.t} className="grid gap-1 border-b border-white/10 py-7 sm:grid-cols-[72px_1fr] sm:gap-6">
                  <span className="font-serif text-4xl font-black text-[#e87722]/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4 className="font-serif text-2xl font-bold">{c.t}</h4>
                    <p className="mt-1 text-[14px] text-white/60">{c.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 05 — SECURITY */}
      <section id="security" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
        <Reveal>
          <ChapterHead
            no="Chapter 05"
            kicker="The adversaries"
            accent="#f472b6"
            title={
              <>
                Built for <em className="text-[#f472b6]">adversaries.</em>
              </>
            }
            lede="Everything we assume will go wrong — and the mechanism that stops it."
          />
        </Reveal>
        <div className="mt-10 border-t border-white/10">
          {THREATS.map((t) => (
            <div key={t.t} className="grid items-baseline gap-2 border-b border-white/10 py-5 sm:grid-cols-[48px_1fr_1.4fr] sm:gap-6">
              <span className="font-mono text-xl" style={{ color: t.c }}>
                {t.icon}
              </span>
              <h4 className="font-serif text-xl font-bold">{t.t}</h4>
              <p className="text-[14px] text-white/55">{t.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-14">
          <h3 className="font-mono text-[12px] uppercase tracking-[0.25em] text-white/50">🔑 Key lifecycle — offline CA</h3>
          <div className="mt-5 h-px bg-gradient-to-r from-[#60a5fa] via-[#e87722] to-[#22c55e]" />
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {LIFECYCLE.map((l, i) => (
              <div key={l.t} className="pt-5">
                <div className="font-serif text-4xl font-black text-white/20">{i + 1}</div>
                <div className="mt-2 font-bold">{l.t}</div>
                <div className="text-[13px] text-white/55">{l.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHAPTER 06 — STACK */}
      <section id="stack" className="scroll-mt-24 border-y border-white/10 bg-[#060b1f]/60">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <Reveal>
            <ChapterHead
              no="Chapter 06"
              kicker="The instruments"
              accent="#e87722"
              title={
                <>
                  One primitive. <em className="text-[#e87722]">One job.</em>
                </>
              }
            />
          </Reveal>
          <div className="mt-10 border-t border-white/10">
            {STACK.map((s, i) => (
              <div key={s.t} className="group grid items-baseline gap-1 border-b border-white/10 py-4 transition-colors hover:bg-white/[0.02] sm:grid-cols-[48px_220px_1fr] sm:gap-6">
                <span className="font-mono text-[12px] text-white/30">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-mono text-[14px] font-black" style={{ color: s.c }}>
                  {s.t}
                </span>
                <span className="text-[14px] text-white/60">{s.d}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 space-y-3 text-center font-mono text-[12px] text-[#8db4ff] sm:text-[13px]">
            <div>WM-ID = HKDF(WM-Secret, DocID‖KeyID‖Session‖Salt‖v3)</div>
            <div>σ = ML-DSA.Sign(SK, SHA-256(Canonical(E)))</div>
          </div>
        </div>
      </section>

      {/* CHAPTER 07 — VERDICT */}
      <section id="scope" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
        <Reveal>
          <ChapterHead
            no="Chapter 07"
            kicker="The verdict"
            accent="#7dffb0"
            title={
              <>
                Evidence, <em className="text-[#7dffb0]">or an honest silence.</em>
              </>
            }
            lede="Forensics that refuses to guess."
          />
        </Reveal>
        <div className="mt-12 border-t border-white/10">
          <div className="grid gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {FORENSIC.map((s, i) => (
              <div key={s.t} className="border-b border-white/10 pb-6 pt-5 sm:border-b-0">
                <div className="font-serif text-4xl font-black text-[#7dffb0]/60">{i + 1}</div>
                <div className="mt-3 text-2xl">{s.icon}</div>
                <div className="mt-2 text-[14px] font-bold text-white/80">{s.t}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-10 sm:grid-cols-2">
          <blockquote className="border-l-2 border-[#22c55e] pl-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#7dffb0]">✓ Attributed</div>
            <p className="mt-2 font-serif text-2xl italic leading-snug text-white/85">
              WM-ID, signature and hashes all agree — a registered event stands named.
            </p>
          </blockquote>
          <blockquote className="border-l-2 border-red-500/60 pl-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-red-300">⚠ No-guess</div>
            <p className="mt-2 font-serif text-2xl italic leading-snug text-white/85">
              Any check fails — the system reports insufficient evidence and stays silent.
            </p>
          </blockquote>
        </div>
      </section>

      {/* CHAPTER 08 — FAQ + CREDITS */}
      <section id="faq" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Reveal>
              <ChapterHead no="Chapter 08" kicker="Questions" accent="#e87722" title="Asked by evaluators." />
            </Reveal>
            <div className="mt-8">
              <Faq />
            </div>
          </div>
          <div id="team">
            <Reveal delay={100}>
              <ChapterHead
                no="Credits"
                kicker="Team Niv Ara"
                accent="#8db4ff"
                title="The builders."
                lede="Team ID 176321 · PS 26237 · Blockchain & Cybersecurity"
              />
            </Reveal>
            <div className="mt-8 border-t border-white/10">
              {TEAM.map((m) => (
                <div key={m.n} className="flex items-baseline justify-between gap-4 border-b border-white/10 py-4">
                  <span className="font-serif text-xl font-bold">{m.n}</span>
                  <span className="text-right font-mono text-[11px]" style={{ color: m.c }}>
                    {m.r}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative overflow-hidden border-t border-white/10 bg-black/60">
        <div className="h-[3px] bg-gradient-to-r from-[#0b2c6b] via-[#e87722] to-[#1a7a34]" />
        {/* shloka band */}
        <div className="relative border-b border-white/10 bg-gradient-to-r from-[#ff9933]/[0.07] via-white/[0.03] to-[#138808]/[0.07]">
          <div className="mx-auto max-w-7xl px-4 py-8 text-center sm:px-6">
            <div className="flex items-center justify-center gap-2" aria-hidden>
              <span className="h-[2px] w-10 bg-gradient-to-r from-transparent to-[#ff9933]" />
              <span className="h-2 w-2 rounded-full bg-[#ff9933]" />
              <span className="h-2 w-2 rounded-full bg-white/80" />
              <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
              <span className="h-[2px] w-10 bg-gradient-to-l from-transparent to-[#22c55e]" />
            </div>
            <div className="mt-3 bg-gradient-to-r from-[#ffb86b] via-[#fff7e6] to-[#7dffb0] bg-clip-text font-serif text-3xl font-bold text-transparent sm:text-4xl">
              सत्यमेव जयते
            </div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">
              Satyameva Jayate · Truth Alone Triumphs
            </div>
            <div className="mt-3 inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1 font-mono text-[11px] font-bold tracking-[0.25em] text-[#ffb86b]">
              जय हिन्द · JAI HIND
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -bottom-44 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-[#e87722]/10 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.7fr_1.2fr]">
          {/* brand */}
          <div>
            <a href="#top" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0b2c6b] via-[#123a8f] to-[#e87722] font-mono text-xl font-black shadow-[0_0_24px_rgba(232,119,34,0.45)]">
                S
              </span>
              <span className="leading-tight">
                <span className="block text-lg font-black tracking-[0.18em]">
                  SAGE <span className="text-[#e87722]">X</span>
                </span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                  Secure Attribution · SIH 2026
                </span>
              </span>
            </a>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-white/55">
              Offline, post-quantum document attribution — every decryption leaves a fingerprint, every fingerprint
              carries a signature.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["SIH 2026", "PS 26237", "Team Niv Ara · 176321"].map((c) => (
                <span key={c} className="glass-chip rounded-full px-3 py-1 font-mono text-[10px] tracking-wider text-white/55">
                  {c}
                </span>
              ))}
            </div>
          </div>
          {/* sitemap */}
          <nav aria-label="Footer">
            <div className="eyebrow text-white/40">Explore</div>
            <ul className="mt-4 space-y-2.5 text-[13px] font-semibold text-white/65">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="group flex items-center gap-2 transition-colors hover:text-[#e87722]">
                    <span className="text-[#e87722] opacity-0 transition-opacity group-hover:opacity-100">→</span>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {/* developer spotlight */}
          <div className="glass-card relative overflow-hidden rounded-3xl p-6">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#e87722] to-transparent" />
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e87722] to-[#7c2d12] text-xl font-black text-white shadow-[0_0_32px_rgba(232,119,34,0.5)]">
                SR
              </span>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ffb86b]">
                  Designed & developed by
                </div>
                <div className="text-xl font-black">Suman Rana</div>
                <div className="font-mono text-[11px] text-white/50">Backend Engineer · Team Niv Ara</div>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-white/60">
              Crafted this end-to-end experience — glass UI, interactive crypto demo and forensic storyline. Open for
              collaborations and feedback.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="https://suman-rana.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary rounded-xl px-5 py-2.5 text-[12px] font-extrabold uppercase tracking-wider"
              >
                ↗ View portfolio
              </a>
              <a
                href="#top"
                className="btn-ghost rounded-xl px-5 py-2.5 text-[12px] font-bold uppercase tracking-wider text-white/75"
              >
                ↑ Back to top
              </a>
            </div>
          </div>
        </div>
        <div className="relative border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 font-mono text-[11px] text-white/35 sm:flex-row sm:px-6">
            <span>© 2026 SAGE X · Smart India Hackathon</span>
            <span className="text-white/25">Decrypt → Watermark → Sign → Ledger → Forensics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
