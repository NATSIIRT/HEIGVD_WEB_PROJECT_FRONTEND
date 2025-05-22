# 🔐 Password Manager – Frontend

> The backend part is here : https://github.com/Thynkon/password-manager-api

A modern frontend project for a secure password manager using:

- **React + Vite** for the user interface
- **TailwindCSS** for styling
- **Rust (compiled to WebAssembly)** for client-side encryption

---

## 📁 Project Structure

```
HEIGVD_WEB_PROJECT_FRONTEND/
├── public/                 # Static files (favicon, etc.)
├── src/
│   ├── assets/             # Images, fonts, icons
│   ├── components/         # Reusable UI components (buttons, fields, etc.)
│   ├── lib/                # Lib files
│   ├── pages/              # Routed pages (Home, Passwords, etc.)
│   ├── routes/             # Centralized routing logic (AppRoutes)
│   ├── types/              # Types files
│   ├── utils/              # Utility functions
│   ├── wasm/               # Rust crate for encryption logic
│   │   └── crypto/         # Rust crate (created with wasm-pack)
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # ReactDOM entry point
│   └── index.css           # Tailwind entry
├── Makefile                # Build/watch Rust WASM easily
├── package.json            # Project metadata + dependencies
├── tailwind.config.js      # Tailwind setup
├── postcss.config.cjs      # PostCSS setup for Tailwind
└── vite.config.ts          # Vite configuration
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

Start React dev server:

```bash
npm run dev
```

Start Rust WASM watcher (in another terminal):

```bash
make watch
```

---

## 📦 Build

Build the project for production:

```bash
npm run build
```

You can find the production file (`index.html`) in the `dist` folder.

---

## 📌 Notes

- Rust functions must be annotated with `#[wasm_bindgen]` to be accessible in JavaScript.
- The crate must use `--target bundler` for Vite compatibility.
- All encryption happens **locally in the browser**, ensuring privacy.

---

Built with ❤️ by [Thynkon](https://github.com/Thynkon) & [NATSIIRT](https://github.com/NATSIIRT) at HEIG-VD.
