import { useState } from "react";
import { Button } from "@/components/ui/button";
import { verifyPIN, storeAsymmetricKey, getAsymmetricKey } from "@/lib/indexedDB";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { encrypt_key, decrypt_key } from "@/wasm/crypto/pkg/crypto";

interface VerifyPINProps {
  onVerify: (decryptedKey: Uint8Array) => void;
  onCancel: () => void;
}

export function VerifyPIN({ onVerify, onCancel }: VerifyPINProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const isValid = await verifyPIN(pin);
      if (!isValid) {
        setError("PIN incorrect");
        return;
      }

      // Get the temporary symmetric key from sessionStorage
      const tempKey = sessionStorage.getItem("tempAsymmetricKey");
      if (tempKey) {
        // Encrypt the symmetric key with the PIN
        const encryptedKey = encrypt_key(
          new Uint8Array(atob(tempKey).split('').map(c => c.charCodeAt(0))),
          pin
        );
        
        // Store the encrypted key in IndexedDB
        await storeAsymmetricKey(btoa(String.fromCharCode(...encryptedKey)));
        
        // Remove the temporary key from sessionStorage
        sessionStorage.removeItem("tempAsymmetricKey");

        // Pass the decrypted key to the parent component
        onVerify(new Uint8Array(atob(tempKey).split('').map(c => c.charCodeAt(0))));
      } else {
        // If no temporary key, try to decrypt the existing key
        const encryptedKey = await getAsymmetricKey();
        if (!encryptedKey) {
          throw new Error("Aucune clé asymétrique trouvée");
        }

        // Decrypt the key with the PIN
        const decryptedKey = decrypt_key(encryptedKey, pin);
        onVerify(decryptedKey);
      }
    } catch (error) {
      setError("Erreur lors de la vérification du PIN");
      console.error("Error verifying PIN:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Vérification du PIN</h2>
        <p className="text-gray-600 mb-4">
          Veuillez entrer votre PIN pour continuer.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium">PIN</label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={pin} onChange={setPin}>
                  <InputOTPGroup className="[&_input]:text-transparent [&_input]:bg-clip-text [&_input]:bg-gradient-to-r [&_input]:from-black [&_input]:to-black">
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1">
                Vérifier
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 