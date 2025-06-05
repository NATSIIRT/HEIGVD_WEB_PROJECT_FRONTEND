import { Key } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Secret } from "@/types/secret"
import { useEffect, useState } from "react"
import { decrypt_secret } from "@/lib/crypto"

interface SecretListProps {
  secrets: Secret[]
  onSecretClick: (secret: Secret) => void
  getDecryptedKey: () => Promise<Uint8Array>
  onNeedPIN: () => void
  onSecretsDecoded: (decodedSecrets: Map<string, { title: string; description: string }>) => void
}

interface DecodedSecret {
  id: string
  user_id: number
  title: string
  description: string
  value: string
}

export function SecretList({ secrets, onSecretClick, getDecryptedKey, onNeedPIN, onSecretsDecoded }: SecretListProps) {
  const [decodedSecrets, setDecodedSecrets] = useState<Map<string, DecodedSecret>>(new Map())
  const [isDecoding, setIsDecoding] = useState(false)

  useEffect(() => {
    const decodeAllSecrets = async () => {
      if (secrets.length === 0) return;

      try {
        setIsDecoding(true)

        // Only decode secrets that haven't been decoded yet
        const secretsToDecode = secrets.filter(secret => !decodedSecrets.has(secret.id));
        
        if (secretsToDecode.length === 0) {
          setIsDecoding(false);
          return;
        }

        try {
          const decodedSecrets = await Promise.all(
            secretsToDecode.map(async (secret) => {
              try {
                const decryptedKey = await getDecryptedKey();
                const decodedSecret = await decrypt_secret(
                  secret.value,
                  secret.nonce,
                  decryptedKey
                );
                return {
                  id: secret.id,
                  user_id: secret.user_id,
                  title: decodedSecret.title || "",
                  description: decodedSecret.description || "",
                  value: decodedSecret.value || "",
                };
              } catch (error) {
                console.error("Error decoding secret:", error);
                if (error instanceof Error && error.message.includes("PIN required")) {
                  onNeedPIN();
                }
                return {
                  id: secret.id,
                  user_id: secret.user_id,
                  title: "Secret invalide",
                  description: "Impossible de décoder ce secret",
                  value: "",
                };
              }
            })
          );

          // Merge new decoded secrets with existing ones
          const mergedDecodedSecrets = new Map<string, DecodedSecret>();
          // Add existing secrets
          decodedSecrets.forEach((secret) => {
            mergedDecodedSecrets.set(secret.id, secret);
          });
          // Add new secrets
          decodedSecrets.forEach((secret) => {
            mergedDecodedSecrets.set(secret.id, secret);
          });

          // Notify parent component of all decoded secrets
          const decodedSecretsMap = new Map<string, { title: string; description: string }>(
            Array.from(mergedDecodedSecrets.entries()).map(([id, secret]) => [
              id,
              { title: secret.title, description: secret.description }
            ])
          );
          onSecretsDecoded(decodedSecretsMap);
          setDecodedSecrets(mergedDecodedSecrets);
        } catch (error) {
          console.error("Error getting decrypted key:", error)
          onNeedPIN()
          return
        }
      } catch (error) {
        console.error("Error initializing WASM:", error)
      } finally {
        setIsDecoding(false)
      }
    }

    decodeAllSecrets()
  }, [secrets, getDecryptedKey, onNeedPIN, onSecretsDecoded])

  if (secrets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <Key className="mb-2 h-10 w-10 text-gray-400" />
        <h3 className="mb-1 text-lg font-medium">Aucun secret</h3>
        <p className="text-sm text-gray-500">
          Ajoutez votre premier secret en cliquant sur le bouton &quot;Ajouter&quot;
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {secrets.map((secret) => {
        const decodedSecret = decodedSecrets.get(secret.id) || {
          id: secret.id,
          user_id: secret.user_id,
          title: isDecoding ? "Déchiffrement..." : "Chargement...",
          description: "",
          value: "",
        }

        return (
          <Card
            key={secret.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => onSecretClick(secret)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{decodedSecret.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{decodedSecret.description}</p>
                </div>
                <Key className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
