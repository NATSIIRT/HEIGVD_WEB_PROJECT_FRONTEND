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
import { encode_secret } from "../wasm/crypto/pkg/crypto"

interface AddSecretProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (secret: Secret) => void
}

export function AddSecret({ isOpen, onClose, onAdd }: AddSecretProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const encodedValue = encode_secret(
        formData.title,
        formData.description,
        formData.value
      )

      onAdd({
        id: Date.now().toString(),
        value: encodedValue,
        user_id: 1, // This will be set by the parent component
      })

      setFormData({
        title: "",
        description: "",
        value: "",
      })
    } catch (error) {
      console.error("Error encoding secret:", error)
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
