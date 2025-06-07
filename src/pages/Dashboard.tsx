import { useEffect, useState, useMemo } from "react";
import { Plus, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SecretList } from "@/components/SecretList";
import { AddSecret } from "@/components/AddSecret";
import { EditSecret } from "@/components/EditSecret";
import { SetPIN } from "@/components/SetPIN";
import { VerifyPIN } from "@/components/VerifyPIN";
import type { Secret } from "@/types/secret";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  fetchCurrentUser,
  fetchSecrets,
  createSecret,
  updateSecret,
  deleteSecret,
} from "@/lib/api";
import { getStoredPIN, storeAsymmetricKey, getAsymmetricKey } from "@/lib/indexedDB";
import { decrypt_key } from "@/wasm/crypto/pkg/crypto";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    username: string;
  } | null>(null);
  const [showSetPIN, setShowSetPIN] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPINVerification, setShowPINVerification] = useState(true);
  const [currentPIN, setCurrentPIN] = useState<string | null>(null);
  const [asymmetricKey, setAsymmetricKey] = useState<Uint8Array | null>(null);
  const [isPINVerified, setIsPINVerified] = useState(false);
  const [decodedSecrets, setDecodedSecrets] = useState<Map<string, { title: string; description: string }>>(new Map());

  // Filtered secrets using useMemo for performance optimization
  const filteredSecrets = useMemo(() => {
    if (searchQuery.trim() === "") {
      return secrets;
    }
    
    const query = searchQuery.toLowerCase();
    return secrets.filter((secret) => {
      const decoded = decodedSecrets.get(secret.id);
      if (!decoded) return false;
      
      return (
        decoded.title.toLowerCase().includes(query) ||
        decoded.description.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, secrets, decodedSecrets]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/sign-in");
      return;
    }

    const loadData = async () => {
      try {
        // First check if the token is valid by fetching current user
        const user = await fetchCurrentUser(token);
        setCurrentUser(user);

        // Only fetch secrets if we have a valid user
        const secretsData = await fetchSecrets(token);
        setSecrets(secretsData);

        // Only check PIN if we have valid data
        const storedPIN = await getStoredPIN();
        if (!storedPIN) {
          const key = location.state?.asymmetricKey;
          if (!key) {
            throw new Error("Clé asymétrique non trouvée");
          }
          setAsymmetricKey(key);
          setShowSetPIN(true);
          setIsPINVerified(false);
        } else {
          setShowPINVerification(true);
          setIsPINVerified(false);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Session expirée ou invalide");
        localStorage.removeItem("token");
        navigate("/sign-in");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate, location.state]);

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
      setShowEditDialog(false);
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
      setShowEditDialog(false);
      setSelectedSecret(null);
      toast.success("Secret supprimé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression du secret");
      console.error("Error details:", error);
    }
  };

  const handleSecretClick = async (secret: Secret) => {
    setSelectedSecret(secret);
    setShowEditDialog(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    storeAsymmetricKey("");
    navigate("/sign-in");
  };

  const handlePINVerified = (pin: string) => {
    setCurrentPIN(pin);
    setShowPINVerification(false);
    setIsPINVerified(true);
  };

  const getDecryptedKey = async (): Promise<Uint8Array> => {
    if (!currentPIN) {
      throw new Error("PIN non disponible");
    }

    const encryptedKey = await getAsymmetricKey();
    if (!encryptedKey) {
      throw new Error("Clé asymétrique non trouvée");
    }

    return decrypt_key(encryptedKey, currentPIN);
  };

  const handleSetPINComplete = (pin: string) => {
    setCurrentPIN(pin);
    setShowSetPIN(false);
    setIsPINVerified(true);
    setShowPINVerification(false);
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
      {showSetPIN && asymmetricKey ? (
        <SetPIN onComplete={handleSetPINComplete} asymmetricKey={asymmetricKey} />
      ) : showPINVerification ? (
        <VerifyPIN onVerify={handlePINVerified} onCancel={() => navigate("/sign-in")} />
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

          {isPINVerified && (
            <SecretList
              secrets={filteredSecrets}
              onSecretClick={handleSecretClick}
              getDecryptedKey={getDecryptedKey}
              onNeedPIN={() => setShowPINVerification(true)}
              onSecretsDecoded={setDecodedSecrets}
            />
          )}

          <AddSecret
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAddSecret}
            getDecryptedKey={getDecryptedKey}
            onNeedPIN={() => setShowPINVerification(true)}
          />

          {showEditDialog && selectedSecret && (
            <EditSecret
              secret={selectedSecret}
              getDecryptedKey={getDecryptedKey}
              onClose={() => {
                setShowEditDialog(false);
                setSelectedSecret(null);
              }}
              onSecretUpdated={handleEditSecret}
              onDelete={handleDeleteSecret}
            />
          )}
        </div>
      )}
    </div>
  );
}