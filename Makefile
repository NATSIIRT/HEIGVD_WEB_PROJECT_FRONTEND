RUST_WASM_DIR=src/wasm/crypto

build:
	cd $(RUST_WASM_DIR) && wasm-pack build --target bundler

watch:
	watchexec -w $(RUST_WASM_DIR)/src -e rs -- "make build"

clean:
	cd $(RUST_WASM_DIR) && rm -rf pkg

# Build + install local in node_modules
install:
	make build && npm install ./$(RUST_WASM_DIR)/pkg