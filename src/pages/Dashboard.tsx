import { useEffect, useState } from "react";
import { Plus, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SecretList } from "@/components/SecretList";
import { AddSecret } from "@/components/AddSecret";
import { EditSecret } from "@/components/EditSecret";
import type { Secret } from "@/types/secret";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/sign-in");
      return;
    }

    // Fetch current user info
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("http://localhost:3000/protected_route", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            "Erreur lors de la récupération des informations utilisateur"
          );
        }

        const userData = await response.json();
        setCurrentUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/sign-in");
      }
    };

    fetchCurrentUser();

    // Load secrets from API
    const fetchSecrets = async () => {
      try {
        const response = await fetch("http://localhost:3000/secrets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des secrets");
        }

        const data = await response.json();
        setSecrets(data);
        setFilteredSecrets(data);
      } catch (error) {
        toast.error("Erreur lors du chargement des secrets");
        console.error("Error fetching secrets:", error);
      }
    };

    fetchSecrets();
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
      const response = await fetch("http://localhost:3000/secrets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          secret: {
            value: newSecret.value,
            user_id: currentUser.id,
          },
        }),
      });

      // Log the response status and headers
      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // Get the raw response text first
      const responseText = await response.text();
      console.log("Raw response:", responseText);

      if (!response.ok) {
        throw new Error(responseText || "Erreur lors de l'ajout du secret");
      }

      // Only try to parse JSON if we have content
      const data = responseText ? JSON.parse(responseText) : null;
      if (data) {
        setSecrets([...secrets, data]);
        setIsAddModalOpen(false);
        toast.success("Secret ajouté avec succès");
      } else {
        toast.success("Secret ajouté avec succès");
      }
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
      const response = await fetch(
        `http://localhost:3000/secrets/${updatedSecret.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            value: updatedSecret.value,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la modification du secret");
      }

      const data = await response.json();
      const updatedSecrets = secrets.map((secret) =>
        secret.id === updatedSecret.id ? data : secret
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
      const response = await fetch(`http://localhost:3000/secrets/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du secret");
      }

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

  const handleSecretClick = (secret: Secret) => {
    setSelectedSecret(secret);
    setIsEditModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/sign-in");
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

        {selectedSecret && (
          <EditSecret
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedSecret(null);
            }}
            secret={selectedSecret}
            onEdit={handleEditSecret}
            onDelete={handleDeleteSecret}
          />
        )}
      </div>
    </div>
  );
}
