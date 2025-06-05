import type { NewSecret, EncryptedSecret, Secret } from "@/types/secret";
import { encrypt, decrypt, decrypt_key } from "@/wasm/crypto/pkg/crypto";
import { base64ToUint8Array, uint8ArrayToBase64, uint8ArrayToString } from "./utils";
import { getAsymmetricKey } from "./indexedDB";

export async function encrypt_secret(secret: NewSecret): Promise<EncryptedSecret> {
  const key = await getAsymmetricKey();
  if (!key) {
    throw new Error("Vault is locked: no key available");
  }

  const plaintextBytes = new TextEncoder().encode(JSON.stringify(secret));

  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = encrypt(plaintextBytes, key, nonce);

  return {
    "value": uint8ArrayToBase64(ciphertext),
    "nonce": uint8ArrayToBase64(nonce)
  }
}

export async function decrypt_secret(ciphertext: string, nonce: string, key?: Uint8Array): Promise<Secret> {
  let decryptionKey: Uint8Array;
  
  if (key) {
    decryptionKey = key;
  } else {
    // Get the encrypted asymmetric key
    const encryptedKey = await getAsymmetricKey();
    if (!encryptedKey) {
      throw new Error("Vault is locked: no key available");
    }

    // Get the PIN from sessionStorage
    const pin = sessionStorage.getItem("currentPIN");
    if (!pin) {
      throw new Error("Vault is locked: PIN required");
    }

    // Decrypt the asymmetric key with the PIN
    decryptionKey = decrypt_key(encryptedKey, pin);
  }

  // Now use the decrypted key to decrypt the secret
  const plaintext = decrypt(base64ToUint8Array(ciphertext), decryptionKey, base64ToUint8Array(nonce));
  let value = JSON.parse(uint8ArrayToString(plaintext));

  return value;
}
