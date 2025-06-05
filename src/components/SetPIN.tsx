import { useState } from "react";
import { Button } from "@/components/ui/button";
import { storePIN, storeAsymmetricKey } from "@/lib/indexedDB";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { uint8ArrayToBase64 } from "@/lib/utils";
import { encrypt_key } from "@/wasm/crypto/pkg/crypto";

interface SetPINProps {
  onComplete: (pin: string) => void;
  asymmetricKey: Uint8Array;
}

export function SetPIN({ onComplete, asymmetricKey }: SetPINProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (pin.length < 4) {
      setError("Le PIN doit contenir au moins 4 chiffres");
      return;
    }

    if (pin !== confirmPin) {
      setError("Les PINs ne correspondent pas");
      return;
    }

    try {
      // Encrypt the key with the PIN
      const encryptedKey = encrypt_key(asymmetricKey, pin);

      // Store both the PIN and the encrypted key
      await Promise.all([
        storePIN(pin),
        storeAsymmetricKey(uint8ArrayToBase64(encryptedKey))
      ]);

      toast.success("PIN configuré avec succès");
      onComplete(pin);
    } catch (error) {
      setError("Erreur lors de la configuration du PIN");
      console.error("Error setting PIN:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Configuration du PIN</h2>
        <p className="text-gray-600 mb-4">
          Veuillez définir un PIN pour sécuriser l'accès à vos mots de passe.
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
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Confirmez le PIN
              </label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={confirmPin} onChange={setConfirmPin}>
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
            <Button type="submit" className="w-full">
              Configurer le PIN
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 