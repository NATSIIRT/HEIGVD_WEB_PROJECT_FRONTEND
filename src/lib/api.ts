// src/lib/api.ts
import type { Secret } from "@/types/secret";

const API_URL = "http://localhost:3000";

export async function fetchCurrentUser(token: string) {
  const response = await fetch(`${API_URL}/protected_route`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.errors?.[0] || "Erreur lors de la récupération des informations utilisateur");
  }

  return await response.json();
}

export async function fetchSecrets(token: string): Promise<Secret[]> {
  const response = await fetch(`${API_URL}/secrets`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.errors?.[0] || "Erreur lors du chargement des secrets");
  }

  return await response.json();
}

export async function createSecret(token: string, user_id: number, secret: Pick<Secret, "value" | "nonce">): Promise<Secret> {
  const response = await fetch(`${API_URL}/secrets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ secret: { ...secret, user_id } }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.errors?.[0] || "Erreur lors de l'ajout du secret");
  }

  return await response.json();
}

export async function updateSecret(token: string, id: string, update: Pick<Secret, "value" | "nonce">): Promise<Secret> {
  const response = await fetch(`${API_URL}/secrets/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.errors?.[0] || "Erreur lors de la modification du secret");
  }

  return await response.json();
}

export async function deleteSecret(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_URL}/secrets/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.errors?.[0] || "Erreur lors de la suppression du secret");
  }
}

