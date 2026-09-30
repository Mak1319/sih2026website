// SAGE X demonstrative crypto helpers — clearly labelled as SIMULATED demo values.
// Real Primitives in report: AES-256-GCM, ML-KEM-768, X25519, HKDF-SHA256, ML-DSA-65, SHA-256.

export function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("WebCrypto getRandomValues unavailable");
  }
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("WebCrypto subtle unavailable (serve over localhost/HTTPS)");
  }
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function shortHash(h: string, len = 18): string {
  if (h.length <= len) return h;
  return `${h.slice(0, len)}…`;
}

export const RECIPIENTS = [
  {
    id: "R-01",
    name: "Col. Arjun Mehta",
    role: "Defence Analyst",
    keyId: "RK-2026-01A",
    color: "#60a5fa",
  },
  {
    id: "R-02",
    name: "Dr. S. Iyer",
    role: "DRDO Scientist",
    keyId: "RK-2026-02B",
    color: "#e87722",
  },
  {
    id: "R-03",
    name: "Ms. K. Rao",
    role: "Intel Liaison",
    keyId: "RK-2026-03C",
    color: "#22c55e",
  },
] as const;

export type PipelineResult = {
  documentId: string;
  contentHash: string;
  dek: string;
  envelopeId: string;
  ssKem: string;
  ssX: string;
  kek: string;
  sessionId: string;
  salt: string;
  wmId: string;
  wmEcc: string;
  artifactHash: string;
  eventHash: string;
  signature: string;
  blockNo: number;
  blockHash: string;
  recipientKeyId: string;
};
