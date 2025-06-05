import { useState } from "react";
import { Button } from "@/components/ui/button";
import { verifyPIN } from "@/lib/indexedDB";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface VerifyPINProps {
  onVerify: (pin: string) => void;
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

      onVerify(pin);
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