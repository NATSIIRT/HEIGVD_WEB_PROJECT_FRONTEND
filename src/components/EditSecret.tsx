import type React from "react"

import { useState, useEffect } from "react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Secret } from "@/types/secret"
import { decrypt_secret, encrypt_secret } from "@/lib/crypto"

interface DecodedSecret {
  title: string
  description: string
  value: string
  nonce: Uint8Array | null
}

interface EditSecretProps {
  isOpen: boolean
  onClose: () => void
  secret: Secret
  onEdit: (secret: Secret) => void
  onDelete: (id: string) => void
}


export function EditSecret({ isOpen, onClose, secret, onEdit, onDelete }: EditSecretProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState<DecodedSecret>({
    title: "",
    description: "",
    value: "",
    nonce: null,
  })

  useEffect(() => {
    const loadSecret = async () => {
      try {
        const value = await decrypt_secret(secret.value, secret.nonce);

        setFormData(value as unknown as DecodedSecret)
      } catch (error) {
        console.error("Error decoding secret:", error)
        setFormData({
          title: "Secret invalide",
          description: "Impossible de décoder ce secret",
          value: "",
          nonce: null,
        })
      }
    }

    loadSecret()
  }, [secret])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const encrypted_secret = await encrypt_secret({
        title: formData.title,
        description: formData.description,
        value: formData.value,
      });


      onEdit({
        ...secret,
        value: encrypted_secret.value,
        nonce: encrypted_secret.nonce
      })
    } catch (error) {
      console.error("Error encoding secret:", error)
    }
  }

  const handleDelete = () => {
    onDelete(secret.id)
    setIsDeleteDialogOpen(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Modifier le secret</DialogTitle>
              <DialogDescription>Modifiez ou supprimez ce secret</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Titre</Label>
                <Input
                  id="edit-title"
                  name="title"
                  placeholder="Ex: Gmail, Facebook, etc."
                  required
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  placeholder="Notes ou informations supplémentaires"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-value">Valeur</Label>
                <div className="relative">
                  <Input
                    id="edit-value"
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
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                Supprimer
              </Button>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Ce secret sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
