import type { NewSecret, EncryptedSecret, Secret } from "@/types/secret";
import { encrypt, decrypt } from "@/wasm/crypto/pkg/crypto";
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

export async function decrypt_secret(ciphertext: string, nonce: string): Promise<Secret> {
  let key = await getAsymmetricKey();
  if (!key) {
    throw new Error("Vault is locked: no key available");
  }

  const plaintext = decrypt(base64ToUint8Array(ciphertext), key, base64ToUint8Array(nonce));
  let value = JSON.parse(uint8ArrayToString(plaintext));

  return value;
}
