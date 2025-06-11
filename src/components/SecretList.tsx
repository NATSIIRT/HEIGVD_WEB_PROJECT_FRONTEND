import { Key, Copy, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { DecodedSecret } from "@/types/secret"
interface SecretListProps {
  decodedSecrets: DecodedSecret[]
  onSecretClick: (secret: DecodedSecret) => void
  isDecoding: boolean
}

export function SecretList({ decodedSecrets, onSecretClick, isDecoding }: SecretListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (secret: DecodedSecret) => {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = secret.decodedValue
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      document.execCommand('copy')
      textArea.remove()
      
      setCopiedId(secret.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  if (decodedSecrets.length === 0 && !isDecoding) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center bg-card/50 backdrop-blur-sm transition-all duration-300 hover:bg-card/60">
        <Key className="mb-4 h-12 w-12 text-primary/60 transition-transform duration-300 hover:scale-110" />
        <h3 className="mb-2 text-xl font-semibold text-card-foreground">Aucun secret</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Ajoutez votre premier secret en cliquant sur le bouton &quot;Ajouter&quot;
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {decodedSecrets.map((secret) => (
        <Card
          key={secret.id}
          className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-card/80 backdrop-blur-sm border-border/50"
          onClick={() => onSecretClick(secret)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-medium truncate text-card-foreground group-hover:text-primary transition-colors duration-300">
                  {isDecoding && !secret.isDecoded ? "Déchiffrement..." : secret.decodedTitle}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {secret.decodedDescription}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopy(secret)
                  }}
                  className="h-9 w-9 rounded-full transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                  disabled={!secret.isDecoded}
                >
                  {copiedId === secret.id ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Key className="h-5 w-5 text-primary/60 transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}