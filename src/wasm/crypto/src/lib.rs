mod utils;

use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use serde::{Deserialize, Serialize};
use serde_wasm_bindgen;
use wasm_bindgen::prelude::*;

use std::error;

use aes_gcm::{
    aead::{consts::U12, generic_array::GenericArray, Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm,
    Key, // Or `Aes128Gcm`
    Nonce,
};
use argon2::Argon2;

#[derive(Serialize, Deserialize)]
pub struct Secret {
    pub title: String,
    pub description: String,
    pub value: String,
}

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, crypto!");
}

#[wasm_bindgen]
pub fn derivate_key(password: &[u8], salt: &[u8]) -> Vec<u8> {
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(password, salt, &mut key)
        .unwrap();
    key.to_vec()
}

#[wasm_bindgen]
pub fn encrypt(plaintext: &[u8], key: &[u8], nonce: &[u8]) -> Vec<u8> {
    assert_eq!(key.len(), 32, "Key must be 32 bytes for AES-256");
    assert_eq!(nonce.len(), 12, "Nonce must be 12 bytes");

    let key = Key::<Aes256Gcm>::from_slice(key);
    let nonce = GenericArray::<u8, U12>::from_slice(nonce);
    let cipher = Aes256Gcm::new(key);
    cipher.encrypt(nonce, plaintext).unwrap()
}

#[wasm_bindgen]
pub fn decrypt(ciphertext: &[u8], key: &[u8], nonce: &[u8]) -> Vec<u8> {
    assert_eq!(key.len(), 32, "Key must be 32 bytes for AES-256");
    assert_eq!(nonce.len(), 12, "Nonce must be 12 bytes");

    let key = Key::<Aes256Gcm>::from_slice(key);
    let nonce = GenericArray::<u8, U12>::from_slice(nonce);

    let cipher = Aes256Gcm::new(key);
    cipher.decrypt(nonce, ciphertext).unwrap()
}
