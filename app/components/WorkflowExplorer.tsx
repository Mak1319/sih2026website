"use client";

import { useEffect, useState } from "react";

export type Phase = {
  n: string;
  title: string;
  tech: string;
  desc: string;
  color: string;
  icon: string;
  inputs: string[];
  outputs: string[];
  gate: string;
  fail: string;
};

export default function WorkflowExplorer({ phases }: { phases: Phase[] }) {
  const [active, setActive] = useState(2);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % phases.length);
    }, 3200);
    return () => clearInterval(id);
  }, [auto, phases.length]);

  const p = phases[active];

  return (
    <div className="glass-strong overflow-hidden rounded-3xl">
      {/* progress */}
      <div className="flex h-1.5 w-full bg-white/5">
        {phases.map((ph, i) => (
          <div
            key={ph.n}
            className="h-full transition-all duration-500"
            style={{
              width: `${100 / phases.length}%`,
              background: i <= active ? ph.color : "transparent",
              boxShadow: i === active ? `0 0 12px ${ph.color}` : "none",
            }}
          />
        ))}
      </div>

      {/* stage selector */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 p-4">
        {phases.map((ph, i) => (
          <button
            key={ph.n}
            onClick={() => {
              setActive(i);
              setAuto(false);
            }}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 font-mono text-[12px] transition-all ${
              i === active
                ? "scale-[1.03] text-black"
                : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/30"
            }`}
            style={i === active ? { background: ph.color, borderColor: ph.color } : {}}
          >
            <span className="font-black">{ph.n}</span>
            <span className="hidden sm:inline">{ph.title}</span>
            <span>{ph.icon}</span>
          </button>
        ))}
        <button
          onClick={() => setAuto((v) => !v)}
          className="ml-auto shrink-0 rounded-xl border border-white/15 px-3 py-2 font-mono text-[12px] text-white/70"
        >
          {auto ? "⏸ pause tour" : "▶ auto tour"}
        </button>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
        {/* detail */}
        <div key={p.n} className="animate-block-in p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl font-mono text-2xl"
              style={{ background: `${p.color}22`, color: p.color, border: `1px solid ${p.color}55` }}
            >
              {p.icon}
            </span>
            <div>
              <div className="font-mono text-[12px] tracking-[0.25em]" style={{ color: p.color }}>
                STAGE {p.n} / 07
              </div>
              <h3 className="text-2xl font-black tracking-tight">{p.title}</h3>
              <div className="font-mono text-[12px] text-white/50">{p.tech}</div>
            </div>
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-white/70">{p.desc}</p>

          <div className="mt-5 rounded-2xl border border-[#22c55e]/25 bg-[#22c55e]/[0.06] p-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#7dffb0]">✓ gate to next stage</div>
            <div className="mt-1 text-[13px] font-semibold text-white/85">{p.gate}</div>
          </div>
          <div className="mt-3 rounded-2xl border border-red-500/25 bg-red-500/[0.06] p-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-red-300">✕ if violated</div>
            <div className="mt-1 text-[13px] text-white/75">{p.fail}</div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => {
                setAuto(false);
                setActive((active - 1 + phases.length) % phases.length);
              }}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-bold hover:border-white/35"
            >
              ← Prev
            </button>
            <button
              onClick={() => {
                setAuto(false);
                setActive((active + 1) % phases.length);
              }}
              className="flex-1 rounded-xl py-2.5 text-sm font-extrabold text-black"
              style={{ background: p.color }}
            >
              Next →
            </button>
          </div>
        </div>

        {/* io */}
        <div className="border-t border-white/10 bg-black/30 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">← inputs</div>
          <div className="mt-2 space-y-2">
            {p.inputs.map((inp) => (
              <div key={inp} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[12px] text-[#8db4ff]">
                {inp}
              </div>
            ))}
          </div>
          <div className="my-4 flex items-center gap-2">
            <div className="h-[2px] flex-1" style={{ background: `linear-gradient(90deg, transparent, ${p.color})` }} />
            <span style={{ color: p.color }}>▼ {p.title}</span>
            <div className="h-[2px] flex-1" style={{ background: `linear-gradient(90deg, ${p.color}, transparent)` }} />
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">outputs →</div>
          <div className="mt-2 space-y-2">
            {p.outputs.map((o) => (
              <div
                key={o}
                className="animate-block-in rounded-lg border px-3 py-2 font-mono text-[12px] font-bold"
                style={{ borderColor: `${p.color}44`, color: p.color, background: `${p.color}11` }}
              >
                {o}
              </div>
            ))}
          </div>
          <div className="mt-4 font-mono text-[11px] leading-relaxed text-white/40">
            Trace: {phases.slice(0, active + 1).map((x) => x.n).join(" → ")}
            {active < phases.length - 1 && <span className="text-white/25"> → …</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
