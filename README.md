# SAGE X — Secure Attribution & Governance Engine (SIH 2026 Website)

Demonstrative workflow website for **SAGE X**, a post-quantum cryptographic framework for
recipient-level attribution and decryption provenance in multi-recipient secure document
distribution.

- **Event:** Smart India Hackathon 2026 · Problem Statement **26237**
- **Theme:** Blockchain & Cybersecurity · **Category:** Software
- **Team:** Niv Ara (ID 176321)

> This site is an **animated demonstrative workflow** of the SAGE X project report.
> Pipeline values shown in the interactive demo are **simulated in the browser**
> (except real SHA-256 hashing). It is **not** a cryptographic implementation.

Live concept: `Recipient → Session → Watermark → Signature → Ledger → Forensics`

---

## 1. What this site contains

| Section | Route anchor | What you get |
|---|---|---|
| Hero | `#top` | SAGE X intro, encrypted-package visual, pipeline quick-strip |
| Problem | `#problem` | D<sub>R1</sub> = D<sub>R2</sub> = D<sub>R3</sub> problem + research-gap table |
| Workflow | `#workflow` | Interactive 7-stage explorer (auto-tour, inputs/outputs/gates) + full stage reference |
| Live Demo Lab | `#demo` | Run encrypt → watermark → sign → ledger → leak-forensics simulation |
| Architecture | `#architecture` | 6-block dataflow diagram + 12-component trust-fabric notes |
| Security | `#security` | Threat model, offline key lifecycle, evaluation framework |
| Crypto Stack | `#stack` | AES-256-GCM, ML-KEM-768, X25519, HKDF, ML-DSA-65, SHA-256, RS+watermark, DLT |
| Scope | `#scope` | Forensic decision path + guarantees vs. explicit out-of-scope |
| FAQ + Team | `#faq` / `#team` | Evaluator Q&A + Team Niv Ara |

Key interactive components:

- `app/components/WorkflowExplorer.tsx` — clickable 7-stage explorer with auto-tour, gates, and I/O.
- `app/components/DemoLab.tsx` — pipeline simulator with live terminal log and evidence cards.
- `app/components/ParticleField.tsx` — hero particle network canvas.
- `app/components/Reveal.tsx` — scroll-reveal wrapper.
- `app/lib/sagex.ts` — demo helpers (simulated hex, real `SHA-256` via WebCrypto).

---

## 2. Prerequisites

- **Node.js 20+** (check with `node -v`)
- **npm 10+** (check with `npm -v`)
- A modern browser (Chrome / Edge / Firefox) — the demo uses WebCrypto (`crypto.subtle`, `crypto.getRandomValues`), so it needs a secure context (`localhost` or HTTPS).

---

## 3. Installation

```bash
# 1. Go to the project folder
cd sih2026website

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> If you see `sh: 1: next: not found`, you skipped step 2 — run `npm install` first.

---

## 4. Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server at `http://localhost:3000` with hot reload |
| `npm run build` | Production build (TypeScript + static page generation) |
| `npm run start` | Serve the production build (run `npm run build` first) |
| `npm run lint` | Run ESLint |

Typical flows:

```bash
# Development
npm run dev

# Production check locally
npm run build
npm run start
# → open http://localhost:3000

# Lint
npm run lint
```

---

## 5. How to use the site (user guide)

### A. First-time walkthrough (2 minutes)

1. Open `http://localhost:3000`.
2. Read the **hero**: badges (PS 26237, offline/air-gapped, post-quantum), the encrypted-package card, and the **pipeline quick-strip** (7 clickable stage pills).
3. Scroll to **#problem** to understand why identical plaintexts (`D_R1 = D_R2 = D_R3`) make attribution impossible without SAGE X.
4. Go to **#workflow**: let the **auto-tour** play, or click stages `01–07` to inspect each stage's **inputs → outputs**, **gate to next stage**, and **failure behavior**.
5. Scroll the **full stage reference** below the explorer for the complete chain.
6. Continue through **#architecture → #security → #stack → #scope → #faq → #team**.

### B. Running the Live Demo Lab (#demo)

1. Enter a **document name** (e.g. `OP-PLAN-AURORA.pdf`).
2. Pick an **authorized recipient** (`R-01`, `R-02`, or `R-03` — note each has a different `RecipientKeyID`).
3. Click **▶ Run secure pipeline** and watch the terminal:
   - `ContentHash` (real SHA-256) + AES-256-GCM encrypt
   - Hybrid envelope: `ML-KEM-768 + X25519 → HKDF → KEK` (SessionID correctly absent)
   - Decryption gate: `GCM tag VERIFIED`
   - Session watermark: `SessionID + salt → opaque WM-ID → Reed-Solomon → ArtifactHash`
   - `ML-DSA-65` sign → offline ledger block commit
4. Review the **evidence cards** (DocumentID, hashes, KEK, SessionID, WM-ID, signature, block).
5. Click **◉ Simulate leak forensics** to see extract → ledger lookup → signature verify → hash correlate → **attributed event**.
6. Toggle **“Tamper leaked copy”** ON and re-run forensics to see the honest **INSUFFICIENT / AMBIGUOUS EVIDENCE** verdict — the system never guesses.

### C. Demo tips for presentations

- Run the pipeline once for `R-02`, then run forensics — point out `WM-ID → Block #N → KeyID → identity`.
- Re-run the pipeline for the **same recipient**: note the new `SessionID` and different `WM-ID` (sessions, not just recipients, are fingerprinted).
- Toggle tamper mode to demonstrate the fail-closed forensic guarantee.

---

## 6. Project structure

```text
sih2026website/
├── app/
│   ├── page.tsx                  # All site sections (hero → footer)
│   ├── layout.tsx                # Root layout + metadata
│   ├── globals.css               # Tailwind v4 theme + animations
│   ├── components/
│   │   ├── DemoLab.tsx           # Interactive pipeline + forensics simulator
│   │   ├── WorkflowExplorer.tsx  # Interactive 7-stage workflow explorer
│   │   ├── ParticleField.tsx     # Hero particle canvas
│   │   └── Reveal.tsx            # Scroll-reveal helper
│   └── lib/
│       └── sagex.ts              # Demo crypto helpers + recipient data
├── public/                       # Static assets
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── eslint.config.mjs
└── package.json
```

---

## 7. Tech stack

- **Next.js 16** (App Router, static prerendering)
- **React 19** + **TypeScript 5**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- No UI framework or backend — pure client-side demo (WebCrypto only).

---

## 8. Deployment

### Vercel (recommended for Next.js)

```bash
npm run build
# Push the repo to GitHub, then import it in Vercel — defaults work, no env vars needed.
```

### Netlify / other static hosts

```bash
npm run build
# Deploy the Next.js app as a Node app (not plain static export).
# Or: `next start` behind any Node-compatible host after building.
```

No environment variables or secrets are required.

---

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| `next: not found` | Run `npm install` in `sih2026website/` |
| Port 3000 busy | Run `npx next dev -p 3001` (or stop the other dev server) |
| Old Node errors | Upgrade to Node 20+: `node -v` |
| Demo hashes look random each run | Expected — `SessionID` + salt are fresh per run, so `WM-ID` / `ArtifactHash` change by design |
| `crypto.subtle` is undefined | Serve over `localhost` or HTTPS; WebCrypto needs a secure context |
| 3D scenes missing / “2D pipeline view” shown | WebGL is unavailable (no GPU, disabled, or headless browser) — the site auto-falls back to 2D visuals; everything else works |

---

## 10. Disclaimer

Demonstrative front-end only. Cryptographic labels (AES-256-GCM, ML-KEM-768, X25519,
HKDF, ML-DSA-65, SHA-256, Reed-Solomon) describe the **SAGE X report design**; the
browser demo simulates envelopes/signatures with random hex except for real SHA-256
digests. No security guarantees are claimed by this website.

---

## 11. Team & credits

Team **Niv Ara** · ID **176321** · SIH 2026 · PS **26237**

| Name | Role |
|---|---|
| Mainak Manna | Crypto / Lead |
| Suman Rana | Backend |
| Suman Mallick | Blockchain |
| Ayaan Goldar | Testing / Docs |
| Riya Ghorai | Watermarking |
| Dipsikha Dutta | Frontend / Forensics |

Website designed & developed by [**Suman Rana**](https://suman-rana.netlify.app).
