"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import * as THREE from "three";

function Core() {
  const core = useRef<THREE.Mesh>(null);
  const wire = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (core.current) {
      core.current.rotation.y = t * 0.35;
      core.current.rotation.x = Math.sin(t * 0.3) * 0.3;
      const s = 1 + Math.sin(t * 1.6) * 0.06;
      core.current.scale.setScalar(s);
    }
    if (wire.current) {
      wire.current.rotation.y = -t * 0.2;
      wire.current.rotation.z = t * 0.12;
    }
  });
  return (
    <group>
      <mesh ref={core}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshStandardMaterial color="#0b2c6b" emissive="#e87722" emissiveIntensity={0.55} roughness={0.25} metalness={0.8} flatShading />
      </mesh>
      <mesh ref={wire} scale={1.55}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial color="#e87722" wireframe transparent opacity={0.28} />
      </mesh>
      {/* inner glow sphere */}
      <mesh scale={0.55}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#ffcf6b" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function Rings() {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (r1.current) {
      r1.current.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.2) * 0.15;
      r1.current.rotation.y = t * 0.25;
    }
    if (r2.current) {
      r2.current.rotation.x = Math.PI / 1.8 + Math.cos(t * 0.18) * 0.15;
      r2.current.rotation.y = -t * 0.18;
    }
    if (r3.current) {
      r3.current.rotation.z = t * 0.1;
      r3.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.25) * 0.2;
    }
  });
  return (
    <group>
      <mesh ref={r1}>
        <torusGeometry args={[2.6, 0.035, 12, 120]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.7} />
      </mesh>
      <mesh ref={r2}>
        <torusGeometry args={[3.3, 0.025, 12, 120]} />
        <meshBasicMaterial color="#e87722" transparent opacity={0.55} />
      </mesh>
      <mesh ref={r3}>
        <torusGeometry args={[4.0, 0.02, 12, 120]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function Orbiters() {
  const group = useRef<THREE.Group>(null);
  const colors = useMemo(() => ["#60a5fa", "#e87722", "#22c55e", "#c084fc", "#ffcf6b"], []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) group.current.rotation.y = t * 0.15;
  });
  return (
    <group ref={group}>
      {colors.map((c, i) => {
        const angle = (i / colors.length) * Math.PI * 2;
        const x = Math.cos(angle) * 3.3;
        const z = Math.sin(angle) * 3.3;
        return (
          <Float key={c} speed={2.5} rotationIntensity={1.2} floatIntensity={1.4}>
            <mesh position={[x, Math.sin(i * 2.1) * 0.9, z]}>
              <octahedronGeometry args={[0.22, 0]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.2} roughness={0.2} metalness={0.4} />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

function Dust({ count = 350, seed = 7 }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    // Deterministic PRNG (mulberry32) so render output is stable across re-renders.
    let s = seed;
    const rand = () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 5 + rand() * 7;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count, seed]);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#8db4ff" size={0.05} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

export default function SageHero3D() {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 9], fov: 50 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[6, 4, 6]} intensity={60} color="#e87722" />
        <pointLight position={[-6, -3, 4]} intensity={40} color="#3b82f6" />
        <Stars radius={40} depth={20} count={1800} factor={3} saturation={0} fade speed={0.6} />
        <Core />
        <Rings />
        <Orbiters />
        <Dust />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#040816] via-transparent to-[#040816]/60" />
    </div>
  );
}
