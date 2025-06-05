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

#[wasm_bindgen]
pub fn encrypt_key(main_key: &[u8], pin: &str) -> Vec<u8> {
    assert_eq!(main_key.len(), 32, "Main key must be 32 bytes for AES-256");
    
    // Generate random salt for this encryption
    let mut salt = [0u8; 16];
    use aes_gcm::aead::rand_core::RngCore;
    OsRng.fill_bytes(&mut salt);
    
    // Derive encryption key from PIN using Argon2
    let pin_bytes = pin.as_bytes();
    let mut derived_key = [0u8; 32];
    Argon2::default()
        .hash_password_into(pin_bytes, &salt, &mut derived_key)
        .unwrap();
    
    // Generate random nonce for encryption
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&derived_key));
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    
    // Encrypt the main key
    let ciphertext = cipher.encrypt(&nonce, main_key).unwrap();
    
    // Format: [salt 16 bytes][nonce 12 bytes][ciphertext]
    let mut result = Vec::with_capacity(16 + 12 + ciphertext.len());
    result.extend_from_slice(&salt);
    result.extend_from_slice(&nonce);
    result.extend_from_slice(&ciphertext);
    
    result
}

#[wasm_bindgen]
pub fn decrypt_key(encrypted_key: &[u8], pin: &str) -> Vec<u8> {
    assert!(encrypted_key.len() > 28, "Encrypted key must be longer than 28 bytes (16 salt + 12 nonce)");
    
    // Extract salt (first 16 bytes), nonce (next 12 bytes), and ciphertext (remaining bytes)
    let (salt_bytes, remaining) = encrypted_key.split_at(16);
    let (nonce_bytes, ciphertext) = remaining.split_at(12);
    let nonce = GenericArray::<u8, U12>::from_slice(nonce_bytes);
    
    // Derive decryption key from PIN using the extracted salt
    let pin_bytes = pin.as_bytes();
    let mut derived_key = [0u8; 32];
    Argon2::default()
        .hash_password_into(pin_bytes, salt_bytes, &mut derived_key)
        .unwrap();
    
    // Decrypt the main key
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&derived_key));
    cipher.decrypt(nonce, ciphertext).unwrap()
}