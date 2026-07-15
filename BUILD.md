# Build Instructions

This document explains how to build the Pluely desktop app for Windows
using GitHub Actions (recommended) or locally.

## What's changed in this fork

Two major changes have been applied on top of Pluely `v0.1.9`:

1. **Premium unlocked for everyone.** The frontend no longer calls the
   Pluely license-validation backend. `hasActiveLicense` is always
   `true`, so every previously-gated feature (Theme customization,
   Pluely default prompts, Generate-with-AI, screenshot auto-mode,
   shortcut customization, response length / language / auto-scroll
   settings, etc.) works out of the box — no license key required.

2. **Editable default AI prompt.** A new **"Default AI Prompt"** card
   has been added to the **Settings** page. It lets you edit the system
   prompt that the AI uses whenever you haven't explicitly selected a
   custom or Pluely prompt. This is the recommended way to stop the AI
   from claiming to be "Natively" or any other product name — just
   write the identity & behavior you want and click **Save Default
   Prompt**. The change takes effect immediately for the next chat
   message and persists across app restarts.

## Build via GitHub Actions (recommended)

The workflow at `.github/workflows/build-windows.yml` builds the app
for Windows (`x86_64-pc-windows-msvc`) on every push to `main` /
`master`, on `v*` tags, and via manual **workflow_dispatch**.

### Steps

1. Push this code to a GitHub repository.
2. (Optional) Configure repository secrets so the build picks up your
   own backend endpoints. All of these are **optional** — the build
   succeeds without them, the app just falls back to user-configured
   AI/STT providers in Dev Space:
   - `APP_ENDPOINT` — Pluely app API base URL
   - `API_ACCESS_KEY` — Pluely API access key
   - `PAYMENT_ENDPOINT` — Pluely payment/checkout base URL
   - `POSTHOG_API_KEY` — PostHog analytics key
   - `TAURI_SIGNING_PRIVATE_KEY` + `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
     — only needed if you want signed updater artifacts
3. Trigger the workflow (push, tag, or **Actions → Run workflow**).
4. When the run finishes, download the **`pluely-windows-x86_64-nsis`**
   and/or **`pluely-windows-x86_64-msi`** artifacts from the run page.
5. Unzip the artifact and run the `.exe` (NSIS installer) or `.msi`
   (MSI installer) on Windows.

## Build locally (optional, requires Rust toolchain)

If you prefer to build on your own machine:

```bash
# 1. Install frontend dependencies
npm install

# 2. Verify TypeScript compiles cleanly
npx tsc --noEmit

# 3. Build the frontend (Vite)
npm run build

# 4. Build the Tauri desktop app (Windows: produces .exe + .msi)
npx tauri build
```

The output installers are placed under:

```
src-tauri/target/release/bundle/nsis/Pluely_0.1.9_x64-setup.exe
src-tauri/target/release/bundle/msi/Pluely_0.1.9_x64_en-US.msi
```

### Local build prerequisites

- Node.js 20+ (LTS recommended)
- Rust stable toolchain (`rustup default stable`)
- On Windows: Visual Studio Build Tools with the "Desktop development
  with C++" workload
- On macOS: Xcode Command Line Tools
- On Linux: `webkit2gtk`, `libssl-dev`, `libayatana-appindicator3-dev`,
  and other Tauri Linux dependencies (see Tauri docs)

## Verifying the code is clean

Before pushing to GitHub Actions, you can verify the frontend code is
clean (the same checks the workflow runs) with:

```bash
npx tsc --noEmit && npm run build
```

If both commands exit with code 0, the GitHub Actions build should
succeed (assuming the runner's Rust toolchain is correctly configured,
which the workflow handles via `dtolnay/rust-toolchain@stable`).

## Using the new Default Prompt editor

1. Launch Pluely.
2. Open the dashboard (sidebar) and go to **App Settings**.
3. Scroll to the **"Default AI Prompt"** card.
4. Edit the textarea to specify exactly how the AI should behave and
   identify itself. For example, to stop the AI from claiming to be
   "Natively":
   ```
   You are a helpful AI assistant that helps the user during interviews
   and meetings. Be concise, accurate, and friendly. Never claim to be
   another product or service — your name is "Assistant".
   ```
5. Click **Save Default Prompt**. The "Saved" indicator confirms the
   change was persisted.
6. (Optional) Click **Reset to Factory Default** to restore the
   hard-coded default prompt at any time.

The edited prompt is stored in `localStorage` under the key
`custom_default_prompt` and is used automatically the next time you
start a chat (unless you've explicitly selected a different prompt in
the **System Prompts** page).
