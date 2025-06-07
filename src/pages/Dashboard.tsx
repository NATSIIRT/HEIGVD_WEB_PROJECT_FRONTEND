import { useEffect, useState, useMemo } from "react";
import { Plus, Search, LogOut, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SecretList } from "@/components/SecretList";
import { AddSecret } from "@/components/AddSecret";
import { EditSecret } from "@/components/EditSecret";
import { SetPIN } from "@/components/SetPIN";
import { VerifyPIN } from "@/components/VerifyPIN";
import type { Secret, DecodedSecret } from "@/types/secret";
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
import { decrypt_key, encrypt_key } from "@/wasm/crypto/pkg/crypto";
import { decrypt_secret } from "@/lib/crypto";
import { uint8ArrayToBase64 } from "@/lib/utils";
import { useSecurity } from "@/hooks/useSecurity";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [decodedSecrets, setDecodedSecrets] = useState<Map<string, DecodedSecret>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSecretId, setSelectedSecretId] = useState<string | null>(null);
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
  const [isDecoding, setIsDecoding] = useState(false);

  // Security hooks
  const { lockSession, resetActivityTimer, manualLock } = useSecurity(
    currentPIN,
    decodedSecrets,
    setCurrentPIN,
    setDecodedSecrets,
    setIsPINVerified,
    setShowPINVerification
  );

  // Get decrypted key function
  const getDecryptedKey = async (): Promise<Uint8Array> => {
    if (!currentPIN) {
      throw new Error("PIN non disponible");
    }

    const encryptedKey = await getAsymmetricKey();
    if (!encryptedKey) {
      throw new Error("Clé asymétrique non trouvée");
    }

    resetActivityTimer();
    return decrypt_key(encryptedKey, currentPIN);
  };

  // Decode a single secret
  const decodeSecret = async (secret: Secret): Promise<DecodedSecret> => {
    try {
      const decryptedKey = await getDecryptedKey();
      const decoded = await decrypt_secret(secret.value, secret.nonce, decryptedKey);
      
      return {
        ...secret,
        decodedTitle: decoded.title || "",
        decodedDescription: decoded.description || "",
        decodedValue: decoded.value || "",
        isDecoded: true,
      };
    } catch (error) {
      console.error("Error decoding secret:", error);
      return {
        ...secret,
        decodedTitle: "Secret invalide",
        decodedDescription: "Impossible de décoder ce secret",
        decodedValue: "",
        isDecoded: false,
      };
    }
  };

  // Decode all secrets when they change or PIN is verified
  useEffect(() => {
    if (!isPINVerified || secrets.length === 0) return;

    const decodeAllSecrets = async () => {
      setIsDecoding(true);
      
      try {
        const secretsToDecode = secrets.filter(secret => 
          !decodedSecrets.has(secret.id) || 
          decodedSecrets.get(secret.id)?.value !== secret.value
        );

        if (secretsToDecode.length === 0) {
          setIsDecoding(false);
          return;
        }

        const decodedResults = await Promise.all(
          secretsToDecode.map(secret => decodeSecret(secret))
        );

        setDecodedSecrets(prev => {
          const newMap = new Map(prev);
          decodedResults.forEach(decoded => {
            newMap.set(decoded.id, decoded);
          });
          
          const currentIds = new Set(secrets.map(s => s.id));
          const filteredMap = new Map();
          newMap.forEach((value, key) => {
            if (currentIds.has(key)) {
              filteredMap.set(key, value);
            }
          });
          
          return filteredMap;
        });
      } catch (error) {
        console.error("Error decoding secrets:", error);
        if (error instanceof Error && error.message.includes("PIN")) {
          lockSession();
        }
      } finally {
        setIsDecoding(false);
      }
    };

    decodeAllSecrets();
  }, [secrets, isPINVerified, currentPIN]);

  // Filtered secrets using decoded data
  const filteredDecodedSecrets = useMemo(() => {
    const decoded = Array.from(decodedSecrets.values());
    
    if (searchQuery.trim() === "") {
      return decoded;
    }
    
    const query = searchQuery.toLowerCase();
    return decoded.filter((secret) => 
      secret.decodedTitle.toLowerCase().includes(query) ||
      secret.decodedDescription.toLowerCase().includes(query)
    );
  }, [searchQuery, decodedSecrets]);

  const selectedDecodedSecret = selectedSecretId ? decodedSecrets.get(selectedSecretId) : null;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/sign-in");
      return;
    }

    const loadData = async () => {
      try {
        const user = await fetchCurrentUser(token);
        setCurrentUser(user);

        const secretsData = await fetchSecrets(token);
        setSecrets(secretsData);

        const storedPIN = await getStoredPIN();
        const key = location.state?.asymmetricKey;
        
        if (!key) {
          throw new Error("Clé asymétrique non trouvée");
        }

        if (!storedPIN) {
          setAsymmetricKey(key);
          setShowSetPIN(true);
          setIsPINVerified(false);
        } else {
          setAsymmetricKey(key);
          setShowPINVerification(true);
          setIsPINVerified(false);
        }
      } catch (error) {
        console.error("Error loading data:", error);
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
      setSecrets(prev => [...prev, newEntry]);
      setIsAddModalOpen(false);
      toast.success("Secret ajouté avec succès");
      resetActivityTimer();
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
      
      setSecrets(prev => prev.map(secret =>
        secret.id === updated.id ? updated : secret
      ));
      
      setShowEditDialog(false);
      setSelectedSecretId(null);
      toast.success("Secret modifié avec succès");
      resetActivityTimer();
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
      setSecrets(prev => prev.filter(secret => secret.id !== id));
      setDecodedSecrets(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      setShowEditDialog(false);
      setSelectedSecretId(null);
      toast.success("Secret supprimé avec succès");
      resetActivityTimer();
    } catch (error) {
      toast.error("Erreur lors de la suppression du secret");
      console.error("Error details:", error);
    }
  };

  const handleSecretClick = (secret: DecodedSecret) => {
    setSelectedSecretId(secret.id);
    setShowEditDialog(true);
    resetActivityTimer();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    storeAsymmetricKey("");
    navigate("/sign-in");
  };

  const handlePINVerified = async (pin: string) => {
    setCurrentPIN(pin);
    setShowPINVerification(false);
    setIsPINVerified(true);
    resetActivityTimer();

    if (asymmetricKey) {
      try {
        const encryptedKey = encrypt_key(asymmetricKey, pin);
        await storeAsymmetricKey(uint8ArrayToBase64(encryptedKey));
      } catch (error) {
        console.error("Error storing asymmetric key:", error);
        toast.error("Erreur lors du stockage de la clé");
      }
    }
  };

  const handleSetPINComplete = (pin: string) => {
    setCurrentPIN(pin);
    setShowSetPIN(false);
    setIsPINVerified(true);
    setShowPINVerification(false);
    resetActivityTimer();
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
              <Button variant="outline" onClick={manualLock}>
                <Lock className="mr-2 h-4 w-4" />
                Verrouiller
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                resetActivityTimer();
              }}
            />
          </div>

          {isPINVerified && (
            <SecretList
              decodedSecrets={filteredDecodedSecrets}
              onSecretClick={handleSecretClick}
              isDecoding={isDecoding}
            />
          )}

          <AddSecret
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAddSecret}
            getDecryptedKey={getDecryptedKey}
            onNeedPIN={() => setShowPINVerification(true)}
          />

          {showEditDialog && selectedDecodedSecret && (
            <EditSecret
              decodedSecret={selectedDecodedSecret}
              onClose={() => {
                setShowEditDialog(false);
                setSelectedSecretId(null);
              }}
              onSecretUpdated={handleEditSecret}
              onDelete={handleDeleteSecret}
              getDecryptedKey={getDecryptedKey}
            />
          )}
        </div>
      )}
    </div>
  );
}