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
import type { Secret, DecodedSecret } from "@/types/secret"
import { encrypt_secret } from "@/lib/crypto"
import { toast } from "sonner"

interface EditSecretProps {
  decodedSecret: DecodedSecret
  getDecryptedKey: () => Promise<Uint8Array>
  onClose: () => void
  onSecretUpdated: (updatedSecret: Secret) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function EditSecret({ decodedSecret, getDecryptedKey, onClose, onSecretUpdated, onDelete }: EditSecretProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: decodedSecret.decodedTitle,
    description: decodedSecret.decodedDescription,
    value: decodedSecret.decodedValue,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

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

      const updatedSecret: Secret = {
        id: decodedSecret.id,
        user_id: decodedSecret.user_id,
        value: encryptedSecret.value,
        nonce: encryptedSecret.nonce,
      };

      await onSecretUpdated(updatedSecret);
      onClose();
    } catch (error) {
      console.error("Error encrypting secret:", error);
      toast.error("Erreur lors du chiffrement du secret");
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await onDelete(decodedSecret.id)
      onClose()
    } catch (error) {
      console.error("Error deleting secret:", error)
      toast.error("Erreur lors de la suppression du secret")
    }
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Modifier le secret</DialogTitle>
              <DialogDescription>Modifiez les informations du secret</DialogDescription>
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Enregistrement..." : "Enregistrer"}
                </Button>
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
              Cette action est irréversible. Le secret sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}