# 🔐 Secure Password Manager – Frontend

> Depends on the backend part : https://github.com/Thynkon/password-manager-api

A modern frontend project for a secure password manager using:

- **React 19 + Vite 6** for the user interface
- **TailwindCSS 4** for styling
- **Rust (compiled to WebAssembly)** for client-side encryption
- **Radix UI / ShadcnUI** for accessible components
- **React Router 6** for routing
- **TypeScript** for type safety
- **IndexedDB** for local storage

---

## ✨ Features

### Authentication & Security
- 🔐 Secure Sign In / Sign Up
- 🔒 PIN code setup and verification
- 🔄 Auto-lock after inactivity
- 🚪 Secure logout
- 🔑 Client-side encryption (AES-256-GCM)

### Password Management
- 📝 Add new secrets/passwords
- ✏️ Edit existing secrets
- 📋 List all secrets
- 🔍 Search through secrets
- 📱 Responsive design for all devices

### User Experience
- 📦 Single file distribution
- ⚡ Fast and responsive UI

### Security Features
- 🔒 All encryption happens locally
- 🔑 Keys never leave your browser
- 🔐 Secure key derivation with Argon2
- 🔄 Automatic session management
- 🛡️ Protection against common attacks

---

## 📁 Project Structure

```
HEIGVD_WEB_PROJECT_FRONTEND/
├── public/                 # Static files (favicon, etc.)
├── src/
│   ├── assets/            # Images, fonts, icons
│   ├── components/        # Reusable UI components (buttons, fields, etc.)
│   ├── hooks/             # Custom hooks
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

_Notes : This is not exhaustive, we have some other files in the project._

---

## 📦 Download & Installation

### Option 1: Single HTML File (Recommended for most users)
You can download the latest release as a single `.html` file from the [releases section](https://github.com/Thynkon/password-manager-frontend/releases). This version:
- Requires no installation
- Works offline
- Contains all dependencies (including WASM)
- Can be opened directly in any modern browser

### Option 2: Build from Source
If you want to build the application yourself:

1. Clone the repository:
   ```bash
   git clone https://github.com/Thynkon/password-manager-frontend.git
   cd password-manager-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

The built files will be in the `dist` directory.

### Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- WebAssembly support
- For development: Node.js 18+ and Rust toolchain

---

## 🔑 Encryption

The encryption is handled by the `crypto` crate, which provides several key security features:

### Key Features
- **AES-256-GCM** for symmetric encryption
- **Argon2** for key derivation
- **Secure random number generation** using OS RNG
- **Client-side encryption** for maximum privacy

### Available Functions

#### Key Management
- `derivate_key(password, salt)`: Derives a 32-byte key using Argon2
- `encrypt_key(main_key, pin)`: Encrypts the main key using a PIN
- `decrypt_key(encrypted_key, pin)`: Decrypts the main key using a PIN

#### Data Encryption
- `encrypt(plaintext, key, nonce)`: Encrypts data using AES-256-GCM
- `decrypt(ciphertext, key, nonce)`: Decrypts data using AES-256-GCM

### Security Features
- All encryption happens **locally in the browser**
- Keys are never transmitted to the server
- Uses cryptographically secure random number generation
- Implements proper key derivation with Argon2
- AES-256-GCM provides both confidentiality and authenticity

### Data Structure
```rust
struct Secret {
    title: String,
    description: String,
    value: String,
}
```

---

## 🦀 Rust Crate (`crypto`)

The `src/wasm/crypto` folder is a Rust crate compiled to WebAssembly using [`wasm-pack`](https://rustwasm.github.io/wasm-pack/).

You can find the Rust code in the `src/wasm/crypto/src` folder.

The crate is automatically watched for changes using `watchexec` during development.

---

## 🔗 React ↔ WASM Integration

1. **Build the crate ONLY**:

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

| Command        | Description                                                      |
| -------------- | ---------------------------------------------------------------- |
| `make build`   | Builds the Rust crate using `wasm-pack`                          |
| `make watch`   | Watches for changes in Rust files and rebuilds automatically     |
| `make clean`   | Deletes generated `pkg/` folder                                  |
| `make install` | Builds and installs WASM crate into React's node_modules         |

---

## 🚀 Development

### Dependencies

You need to install several tools:

1. Node.js (v18 or later):
   ```sh
   # Install Node.js from https://nodejs.org/
   ```

2. Rust's WASM toolchain:
   ```sh
   # Install rustup first from https://rustup.rs/
   cargo install wasm-pack
   rustup component add llvm-tools
   cargo install cargo-generate
   ```

3. Watchexec (for automatic rebuilding):
   ```sh
   # On Linux
   cargo install watchexec-cli
   # Or using your package manager
   # sudo apt install watchexec  # Debian/Ubuntu
   # sudo dnf install watchexec  # Fedora
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

Build the project for production (this will also compile WASM):

```bash
npm run build
```

The build process will:
1. Compile the Rust WASM module
2. Bundle all assets into a single HTML file
3. Optimize and minify all code
4. Generate source maps for debugging

You can find the production files in the `dist` folder, with the main file being `index.html`.

---

## 🔧 Troubleshooting

### CORS Error when Opening HTML File Directly

If you see this error when opening the built `index.html` file directly in your browser:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at file:///... (Reason: CORS request not http)
```

#### Why does this happen?
This error occurs because modern browsers block requests from `file://` protocol to `http://` protocol for security reasons. When you open the HTML file directly from your filesystem, it uses the `file://` protocol, but the API requests are made to `http://` URLs.

#### How to fix it?

1. **Use a Local Server (Recommended)**
   ```bash
   # Using Python
   python -m http.server 8080
   
   # Or using Node.js
   npx serve dist
   ```
   Then open `http://localhost:8080` in your browser.

2. **Configure your Browser (Not Recommended for Production)**
   - Chrome: Launch with `--disable-web-security` flag
   - Firefox: Set `security.fileuri.strict_origin_policy` to `false` in `about:config`

3. **Use HTTPS in Production**
   - Deploy your application to a proper web server with HTTPS
   - Update the API URL in your `.env` file to use HTTPS

#### Best Practices
- Always serve the application through a web server, even in development
- Use HTTPS in production
- Keep your API URL configuration in the `.env` file

---

## 📌 Notes

- Rust functions must be annotated with `#[wasm_bindgen]` to be accessible in JavaScript.
- The crate must use `--target bundler` for Vite compatibility.
- All encryption happens **locally in the browser**, ensuring privacy.
- The project uses modern React 18 features and TypeScript for better type safety.
- UI components are built with Radix UI / ShadcnUI for accessibility and TailwindCSS for styling.

---

Built with ❤️ by [Thynkon](https://github.com/Thynkon) & [NATSIIRT](https://github.com/NATSIIRT) at HEIG-VD.
