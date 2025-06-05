// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Plus, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SecretList } from "@/components/SecretList";
import { AddSecret } from "@/components/AddSecret";
import { EditSecret } from "@/components/EditSecret";
import { SetPIN } from "@/components/SetPIN";
import type { Secret } from "@/types/secret";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  fetchCurrentUser,
  fetchSecrets,
  createSecret,
  updateSecret,
  deleteSecret,
} from "@/lib/api";
import { getStoredPIN, storeAsymmetricKey } from "@/lib/indexedDB";

export default function Dashboard() {
  const navigate = useNavigate();
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [filteredSecrets, setFilteredSecrets] = useState<Secret[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    username: string;
  } | null>(null);
  const [showSetPIN, setShowSetPIN] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [decryptedKey, setDecryptedKey] = useState<Uint8Array | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    const checkPIN = async () => {
      try {
        const storedPIN = await getStoredPIN();
        if (!storedPIN) {
          setShowSetPIN(true);
        }
      } catch (error) {
        console.error("Error checking PIN:", error);
        toast.error("Erreur lors de la vérification du PIN");
      } finally {
        setIsLoading(false);
      }
    };

    checkPIN();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/sign-in");
      return;
    }

    fetchCurrentUser(token)
      .then(setCurrentUser)
      .catch((error) => {
        console.error("Error fetching user:", error);
        navigate("/sign-in");
      });

    fetchSecrets(token)
      .then((data) => {
        setSecrets(data);
        setFilteredSecrets(data);
      })
      .catch((error) => {
        toast.error("Erreur lors du chargement des secrets");
        console.error("Error fetching secrets:", error);
      });
  }, [navigate]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSecrets(secrets);
    } else {
      const filtered = secrets.filter(
        (secret) =>
          (secret.title?.toLowerCase().includes(searchQuery.toLowerCase()) ??
            false) ||
          (secret.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ??
            false)
      );
      setFilteredSecrets(filtered);
    }
  }, [searchQuery, secrets]);

  const handleAddSecret = async (newSecret: Secret) => {
    const token = localStorage.getItem("token");
    if (!token || !currentUser) return;

    try {
      const newEntry = await createSecret(token, currentUser.id, {
        value: newSecret.value,
        nonce: newSecret.nonce,
      });
      setSecrets([...secrets, newEntry]);
      setIsAddModalOpen(false);
      toast.success("Secret ajouté avec succès");
    } catch (error) {
      console.error("Error details:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'ajout du secret"
      );
    }
  };

  const handleEditSecret = async (updatedSecret: Secret) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const updated = await updateSecret(token, updatedSecret.id, {
        value: updatedSecret.value,
        nonce: updatedSecret.nonce,
      });
      const updatedSecrets = secrets.map((secret) =>
        secret.id === updated.id ? updated : secret
      );
      setSecrets(updatedSecrets);
      setIsEditModalOpen(false);
      setSelectedSecret(null);
      toast.success("Secret modifié avec succès");
    } catch (error) {
      toast.error("Erreur lors de la modification du secret");
      console.error("Error details:", error);
    }
  };

  const handleDeleteSecret = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await deleteSecret(token, id);
      const updatedSecrets = secrets.filter((secret) => secret.id !== id);
      setSecrets(updatedSecrets);
      setIsEditModalOpen(false);
      setSelectedSecret(null);
      toast.success("Secret supprimé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression du secret");
      console.error("Error details:", error);
    }
  };

  const handleSecretClick = (secret: Secret, decryptedKey: Uint8Array) => {
    setSelectedSecret(secret);
    setDecryptedKey(decryptedKey);
    setShowEditDialog(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    storeAsymmetricKey("");
    navigate("/sign-in");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showSetPIN ? (
        <SetPIN onComplete={() => setShowSetPIN(false)} />
      ) : (
        <div className="mx-auto max-w-4xl p-4">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Mes mots de passe</h1>
            <div className="flex gap-2">
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher un mot de passe..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <SecretList
            secrets={filteredSecrets}
            onSecretClick={handleSecretClick}
          />

          <AddSecret
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAddSecret}
          />

          {showEditDialog && selectedSecret && (
            <EditSecret
              secret={selectedSecret}
              decryptedKey={decryptedKey}
              onClose={() => {
                setShowEditDialog(false);
                setSelectedSecret(null);
                setDecryptedKey(null);
              }}
              onSecretUpdated={handleEditSecret}
            />
          )}
        </div>
      )}
    </div>
  );
}

