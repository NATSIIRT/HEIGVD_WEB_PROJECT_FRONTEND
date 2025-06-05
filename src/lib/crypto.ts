import type { NewSecret, EncryptedSecret, Secret } from "@/types/secret";
import { derivate_key, encrypt, decrypt } from "@/wasm/crypto/pkg/crypto";
import { base64ToUint8Array, uint8ArrayToBase64, uint8ArrayToString } from "./utils";

export function encrypt_secret(secret: NewSecret): EncryptedSecret {
  // TODO: replace this with values from the user
  // this is only used as tmp solution to test encryption/descryption
  // also, the key will be computed and stored
  const password = "hunter42";
  const salt = "example salt";


  const passwordBytes = new TextEncoder().encode(password);
  const saltBytes = new TextEncoder().encode(salt);
  const plaintextBytes = new TextEncoder().encode(JSON.stringify(secret));

  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = derivate_key(passwordBytes, saltBytes);
  const ciphertext = encrypt(plaintextBytes, key, nonce);

  return {
    "value": uint8ArrayToBase64(ciphertext),
    "nonce": uint8ArrayToBase64(nonce)
  }
}

export function decrypt_secret(ciphertext: string, nonce: string): Secret {
  // TODO: replace this with values from the user
  // this is only used as tmp solution to test encryption/descryption
  const password = "hunter42";
  const salt = "example salt";

  const passwordBytes = new TextEncoder().encode(password);
  const saltBytes = new TextEncoder().encode(salt);
  const key = derivate_key(passwordBytes, saltBytes);

  const plaintext = decrypt(base64ToUint8Array(ciphertext), key, base64ToUint8Array(nonce));
  let value = JSON.parse(uint8ArrayToString(plaintext));

  return value;
}
