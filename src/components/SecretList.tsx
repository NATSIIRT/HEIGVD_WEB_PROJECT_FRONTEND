import { Key } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Secret } from "@/types/secret"
import { useEffect, useState } from "react"
import { decrypt_secret } from "@/lib/crypto"

interface SecretListProps {
  secrets: Secret[]
  onSecretClick: (secret: Secret) => void
}

interface DecodedSecret {
  title: string
  description: string
  value: Uint8Array<ArrayBufferLike> | null
}

export function SecretList({ secrets, onSecretClick }: SecretListProps) {
  const [decodedSecrets, setDecodedSecrets] = useState<Map<string, DecodedSecret>>(new Map())

  useEffect(() => {
    const decodeAllSecrets = async () => {
      try {
        const newDecodedSecrets = new Map<string, DecodedSecret>()

        for (const secret of secrets) {
          try {
            const value = decrypt_secret(secret.value, secret.nonce);

            newDecodedSecrets.set(secret.id, value as unknown as DecodedSecret)
          } catch (error) {
            console.error(`Error decoding secret ${secret.id}:`, error)
            newDecodedSecrets.set(secret.id, {
              title: "Secret invalide",
              description: "Impossible de décoder ce secret",
              value: null,
            })
          }
        }

        setDecodedSecrets(newDecodedSecrets)
      } catch (error) {
        console.error("Error initializing WASM:", error)
      }
    }

    decodeAllSecrets()
  }, [secrets])

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
          title: "Chargement...",
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
