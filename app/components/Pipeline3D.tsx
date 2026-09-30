"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export type PipePhase = {
  n: string;
  title: string;
  short: string;
  color: string;
  icon: string;
};

function Node({
  position,
  phase,
  active,
  onClick,
}: {
  position: [number, number, number];
  phase: PipePhase;
  active: boolean;
  onClick: () => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const targetScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (mesh.current) {
      mesh.current.rotation.y = t * (active ? 1.2 : 0.5);
      mesh.current.rotation.x = Math.sin(t * 0.8) * 0.25;
      const target = active ? 1.35 : hover ? 1.12 : 0.9;
      targetScale.set(target, target, target);
      mesh.current.scale.lerp(targetScale, 0.12);
    }
  });
  return (
    <group position={position}>
      {/* glow halo */}
      <mesh scale={active ? 1.9 : 1.45}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial color={phase.color} transparent opacity={active ? 0.22 : 0.1} />
      </mesh>
      <Float speed={3} floatIntensity={0.9} rotationIntensity={0.4}>
        <mesh
          ref={mesh}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHover(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHover(false);
            document.body.style.cursor = "auto";
          }}
        >
          <octahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            color={phase.color}
            emissive={phase.color}
            emissiveIntensity={active ? 1.6 : 0.7}
            roughness={0.2}
            metalness={0.6}
            flatShading
          />
        </mesh>
      </Float>
      <Html center distanceFactor={9} position={[0, 1.15, 0]} style={{ pointerEvents: "none" }}>
        <div
          className="rounded-full px-3 py-1 font-mono text-[13px] font-black backdrop-blur"
          style={{
            background: `${phase.color}22`,
            border: `1px solid ${phase.color}`,
            color: phase.color,
            boxShadow: active ? `0 0 24px ${phase.color}` : "none",
            whiteSpace: "nowrap",
          }}
        >
          {phase.n} {phase.icon}
        </div>
      </Html>
      <Html center distanceFactor={9} position={[0, -1.05, 0]} style={{ pointerEvents: "none" }}>
        <div
          className="px-2 py-0.5 text-center font-mono text-[11px] font-bold text-white/85"
          style={{ textShadow: "0 0 12px black", whiteSpace: "nowrap" }}
        >
          {phase.short}
        </div>
      </Html>
    </group>
  );
}

function Pulse({ from, to, color, offset = 0, speed = 0.35 }: { from: THREE.Vector3; to: THREE.Vector3; color: string; offset?: number; speed?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = (state.clock.elapsedTime * speed + offset) % 1;
    if (ref.current) {
      ref.current.position.lerpVectors(from, to, t);
      const s = 1 - Math.abs(t - 0.5);
      ref.current.scale.setScalar(0.7 + s * 0.7);
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.11, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Chain({ phases, active, onSelect }: { phases: PipePhase[]; active: number; onSelect: (i: number) => void }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.18;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
    }
  });

  const pts = useMemo(() => {
    return phases.map((_, i) => {
      const x = (i - (phases.length - 1) / 2) * 2.35;
      const y = Math.sin(i * 0.9) * 0.55;
      return new THREE.Vector3(x, y, 0);
    });
  }, [phases]);

  return (
    <group ref={group}>
      {/* connector lines */}
      {pts.slice(0, -1).map((p, i) => (
        <group key={i}>
          <Line points={[p, pts[i + 1]]} color={phases[i].color} lineWidth={2} transparent opacity={0.65} />
          <Pulse from={p} to={pts[i + 1]} color={phases[i + 1].color} offset={i * 0.14} />
          <Pulse from={p} to={pts[i + 1]} color="#ffffff" offset={i * 0.14 + 0.5} speed={0.5} />
        </group>
      ))}
      {phases.map((ph, i) => (
        <Node key={ph.n} position={[pts[i].x, pts[i].y, pts[i].z]} phase={ph} active={i === active} onClick={() => onSelect(i)} />
      ))}
    </group>
  );
}

export default function Pipeline3D({ phases }: { phases: PipePhase[] }) {
  const [active, setActive] = useState(2);
  const safeActive = phases.length === 0 ? 0 : Math.min(Math.max(active, 0), phases.length - 1);
  const p = phases[safeActive];

  if (phases.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#03061a]">
      <div className="relative h-[440px] sm:h-[480px]">
        <Canvas camera={{ position: [0, 0.6, 11.5], fov: 48 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={0.8} />
          <pointLight position={[8, 5, 8]} intensity={50} color="#e87722" />
          <pointLight position={[-8, -4, 6]} intensity={40} color="#3b82f6" />
          <Chain phases={phases} active={safeActive} onSelect={setActive} />
          <OrbitControls enablePan={false} minDistance={7} maxDistance={18} makeDefault />
        </Canvas>
        {/* overlay: minimal text, huge stage */}
        <div className="pointer-events-none absolute left-4 top-4 rounded-2xl bg-black/55 px-4 py-3 backdrop-blur">
          <div className="font-mono text-[11px] tracking-[0.3em]" style={{ color: p.color }}>
            STAGE {p.n} / 07
          </div>
          <div className="text-3xl font-black tracking-tight sm:text-4xl">
            {p.icon} {p.title}
          </div>
          <div className="font-mono text-[12px] text-white/60">{p.short}</div>
        </div>
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {phases.map((ph, i) => (
            <button
              key={ph.n}
              onClick={() => setActive(i)}
              aria-label={ph.title}
              className="h-2.5 rounded-full transition-all"
              style={{
                width: i === safeActive ? 28 : 10,
                background: i === safeActive ? ph.color : "rgba(255,255,255,0.2)",
                boxShadow: i === safeActive ? `0 0 12px ${ph.color}` : "none",
              }}
            />
          ))}
        </div>
        <div className="absolute right-4 top-4 hidden font-mono text-[11px] text-white/40 sm:block">
          drag to orbit · scroll to zoom · click a node
        </div>
      </div>
      {/* minimal strip: write less, show huge */}
      <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-black/40 p-3">
        {phases.map((ph, i) => (
          <button
            key={ph.n}
            onClick={() => setActive(i)}
            className="shrink-0 rounded-xl px-4 py-2 font-mono text-[13px] font-black transition-all"
            style={
              i === safeActive
                ? { background: ph.color, color: "#000" }
                : { background: "rgba(255,255,255,0.05)", color: ph.color, border: `1px solid ${ph.color}44` }
            }
          >
            {ph.n} {ph.icon}
          </button>
        ))}
        <a href="#demo" className="shrink-0 rounded-xl bg-[#22c55e] px-4 py-2 font-mono text-[13px] font-black text-black">
          TRY LIVE ↓
        </a>
      </div>
    </div>
  );
}
