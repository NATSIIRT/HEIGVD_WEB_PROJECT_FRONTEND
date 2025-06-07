# 🔐 Password Manager – Frontend

> The backend part is here : https://github.com/Thynkon/password-manager-api

A modern frontend project for a secure password manager using:

- **React 19 + Vite 6** for the user interface
- **TailwindCSS 4** for styling
- **Rust (compiled to WebAssembly)** for client-side encryption
- **Radix UI / ShadcnUI** for accessible components
- **React Router 7** for routing
- **TypeScript** for type safety

---

## 📁 Project Structure

```
HEIGVD_WEB_PROJECT_FRONTEND/
├── public/                 # Static files (favicon, etc.)
├── src/
│   ├── assets/            # Images, fonts, icons
│   ├── components/        # Reusable UI components (buttons, fields, etc.)
│   ├── lib/               # Lib files
│   ├── pages/             # Routed pages (Home, Passwords, etc.)
│   ├── routes/            # Centralized routing logic (AppRoutes)
│   ├── types/             # TypeScript type definitions
│   ├── wasm/              # Rust crate for encryption logic
│   │   └── crypto/        # Rust crate (created with wasm-pack)
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # ReactDOM entry point
│   └── index.css          # Tailwind entry
├── .github/               # GitHub workflows and templates
├── components.json        # UI components configuration
├── Makefile              # Build/watch Rust WASM easily
├── package.json          # Project metadata + dependencies
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── eslint.config.js      # ESLint configuration
```

_Not exhaustive_

---

## 🦀 Rust Crate (`crypto`)

The `src/wasm/crypto` folder is a Rust crate compiled to WebAssembly using [`wasm-pack`](https://rustwasm.github.io/wasm-pack/).

### 🔧 Rust dependencies

In `Cargo.toml`:

```toml
[dependencies]
wasm-bindgen = "0.2"     # Required for JS/WASM interop
base64 = "0.21"          # Used for simple encryption demo
```

---

## 🔗 React ↔ WASM Integration

1. **Build the crate**:

   ```bash
   wasm-pack build --target bundler
   ```

2. **Install in React**:

   ```bash
   npm install ./src/wasm/crypto/pkg
   ```

3. **Import in React**:
   ```tsx
   import { encrypt } from "crypto";
   ```

---

## 🛠 Makefile Commands

| Command        | Description                               |
| -------------- | ----------------------------------------- |
| `make build`   | Builds the Rust crate using `wasm-pack`   |
| `make watch`   | Automatically rebuild on file change      |
| `make clean`   | Deletes generated `pkg/` folder           |
| `make install` | Builds and installs WASM crate into React |

---

## 🚀 Development

### Dependencies

Make sure you install [watchexec](https://github.com/watchexec/watchexec).

You also need to install Rust's WASM toolchain. But first, you need to install Rust's toolchain installer [rustup](https://rustup.rs/).

Then, simply type these commands to install the WASM toolchain:

```sh
cargo install wasm-pack
rustup component add llvm-tools
cargo install cargo-generate
```

### Setup

This will compile rust's WASM and install it in a directory so our React app can use it.

Set the API url in the `.env` file. It should contain something like this (3000 is the default port for the ROR api)

```env
VITE_API_URL="http://localhost:3000"
```

Start React dev server:

```bash
npm run dev
```

Compile the rust `crypto` and start the WASM watcher (in another terminal):

```bash
make watch
```

---

## 📦 Build

Then, build the project for production (this will also compile WASM):

```bash
npm run build
```

You can find the production files in the `dist` folder.

---

## 📌 Notes

- Rust functions must be annotated with `#[wasm_bindgen]` to be accessible in JavaScript.
- The crate must use `--target bundler` for Vite compatibility.
- All encryption happens **locally in the browser**, ensuring privacy.
- The project uses modern React 19 features and TypeScript for better type safety.
- UI components are built with Radix UI / ShadcnUI for accessibility and TailwindCSS for styling.

---

Built with ❤️ by [Thynkon](https://github.com/Thynkon) & [NATSIIRT](https://github.com/NATSIIRT) at HEIG-VD.
