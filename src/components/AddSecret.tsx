"use client"

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
import { getAsymmetricKey } from "@/lib/indexedDB"
import { base64ToUint8Array, uint8ArrayToBase64 } from "@/lib/utils"
import { decrypt_key, encrypt } from "@/wasm/crypto/pkg/crypto"
import { toast } from "sonner"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

interface AddSecretProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (secret: Secret) => void
}

export function AddSecret({ isOpen, onClose, onAdd }: AddSecretProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showPINVerification, setShowPINVerification] = useState(false)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    value: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowPINVerification(true)
  }

  const handlePINSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPinError("")

    try {
      // Get the encrypted asymmetric key
      const encryptedKey = await getAsymmetricKey()
      if (!encryptedKey) {
        throw new Error("Clé asymétrique non trouvée")
      }

      // Decrypt the asymmetric key
      const decryptedKey = decrypt_key(encryptedKey, pin)

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
      setPin("")
      setShowPINVerification(false)
      onClose()

      toast.success("Secret ajouté avec succès")
    } catch (error) {
      console.error("Error encoding secret:", error)
      setPinError("PIN incorrect")
    }
  }

  const handleCancel = () => {
    setShowPINVerification(false)
    setPin("")
    setPinError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        {!showPINVerification ? (
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
              <Button type="button" variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button type="submit">Ajouter</Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handlePINSubmit}>
            <DialogHeader>
              <DialogTitle>Vérification du PIN</DialogTitle>
              <DialogDescription>
                Veuillez entrer votre PIN pour chiffrer le secret
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>PIN</Label>
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
                {pinError && <p className="text-red-500 text-sm text-center">{pinError}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button type="submit">Vérifier</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
