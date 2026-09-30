import type { Metadata } from "next";
import "./globals.css";

// Offline system font stacks — no network requests, no Google Fonts.
// --font-geist-sans / --font-geist-mono variables are kept for compatibility
// with existing class usage, but mapped to local system fonts.
const geistSans = { variable: "--font-geist-sans" } as const;
const geistMono = { variable: "--font-geist-mono" } as const;

export const metadata: Metadata = {
  title: "SAGE X — Secure Attribution & Governance Engine | SIH 2026",
  description:
    "SAGE X is an offline, air-gapped, post-quantum document distribution system with recipient-level attribution and decryption provenance. AES-256-GCM, ML-KEM-768 + X25519, ML-DSA-65, forensic watermarking, permissioned DLT.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
