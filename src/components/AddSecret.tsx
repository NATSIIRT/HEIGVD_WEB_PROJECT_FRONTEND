import type React from "react"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Secret } from "@/types/secret"
import { uint8ArrayToBase64 } from "@/lib/utils"
import { encrypt } from "@/wasm/crypto/pkg/crypto"
import { toast } from "sonner"
import { encrypt_secret } from "@/lib/crypto"

interface AddSecretProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (secret: Secret) => void
  getDecryptedKey: () => Promise<Uint8Array>
  onNeedPIN: () => void
}

export function AddSecret({ isOpen, onClose, onAdd, getDecryptedKey, onNeedPIN }: AddSecretProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    value: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePINVerified = async (pin: string) => {
    try {
      const decryptedKey = await getDecryptedKey();
      const encryptedSecret = await encrypt_secret(
        {
          title: formData.title,
          description: formData.description,
          value: formData.value,
        },
        decryptedKey
      );

      onAdd({
        id: "", // TODO : Check if the id is needed
        user_id: 0, // TODO : Check if the user_id is needed
        value: encryptedSecret.value,
        nonce: encryptedSecret.nonce,
        title: formData.title,
        description: formData.description,
      });
      onClose();
    } catch (error) {
      console.error("Error encrypting secret:", error);
      toast.error("Erreur lors du chiffrement du secret");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const decryptedKey = await getDecryptedKey();

      // Generate a random nonce for encryption
      const nonce = new Uint8Array(12)
      crypto.getRandomValues(nonce)

      // Create the secret object to encrypt
      const secretToEncrypt = {
        title: formData.title,
        description: formData.description,
        value: formData.value,
      }

      // Encrypt the entire secret object
      const secretBytes = new TextEncoder().encode(JSON.stringify(secretToEncrypt))
      const encryptedValue = encrypt(secretBytes, decryptedKey, nonce)

      // Create the secret object for the API
      const secret: Secret = {
        id: Date.now().toString(),
        value: uint8ArrayToBase64(encryptedValue),
        nonce: uint8ArrayToBase64(nonce),
        user_id: 1, // This will be set by the parent component
      }

      onAdd(secret)

      // Clear the form and close the dialog
      setFormData({
        title: "",
        description: "",
        value: "",
      })
      onClose()

      toast.success("Secret ajouté avec succès")
    } catch (error) {
      console.error("Error encoding secret:", error)
      if (error instanceof Error && error.message === "PIN non disponible") {
        onNeedPIN()
      } else {
        toast.error("Erreur lors de l'ajout du secret")
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter un secret</DialogTitle>
            <DialogDescription>Ajoutez un nouveau secret</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Gmail, Facebook, etc."
                required
                value={formData.title}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Notes ou informations supplémentaires"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Valeur</Label>
              <div className="relative">
                <Input
                  id="value"
                  name="value"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={formData.value}
                  onChange={handleChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">
                    {showPassword ? "Cacher le secret" : "Afficher le secret"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">Ajouter</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
