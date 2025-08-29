"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { authClient, useSession } from "@/src/lib/auth-client";

export default function AcceptInvitationPage() {
  const { invitationId } = useParams();
  const { data: session } = useSession();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        console.log(
          "🔍 Récupération invitation avec getInvitation:",
          invitationId
        );

        // Récupérer l'invitation directement par son ID
        const { data, error: authError } =
          await authClient.organization.getInvitation({
            id: invitationId,
          });

        if (authError) {
          throw new Error(
            authError.message ||
              "Erreur lors de la récupération de l'invitation"
          );
        }

        console.log("✅ Invitation récupérée:", data);
        setInvitation(data);
      } catch (err) {
        console.error("❌ Erreur:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (invitationId) {
      fetchInvitation();
    }
  }, [invitationId]);

  if (loading) {
    return (
      <div style={{ padding: "50px", fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ color: "#2563eb", fontSize: "2rem" }}>🔄 Chargement...</h1>
        <p>Récupération de l'invitation en cours...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "50px", fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ color: "#dc2626", fontSize: "2rem" }}>❌ Erreur</h1>
        <p style={{ color: "#dc2626" }}>{error}</p>
        <p style={{ color: "#6b7280" }}>ID: {invitationId}</p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div style={{ padding: "50px", fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ color: "#dc2626", fontSize: "2rem" }}>
          ❌ Invitation non trouvée
        </h1>
        <p>Aucune invitation trouvée avec cet ID.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "50px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ color: "#2563eb", fontSize: "2rem" }}>
        ✅ Invitation trouvée !
      </h1>
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#f3f4f6",
          borderRadius: "8px",
        }}
      >
        <h2 style={{ color: "#374151", marginBottom: "10px" }}>
          Détails de l'invitation :
        </h2>
        <p>
          <strong>Organisation:</strong>{" "}
          {invitation.organization?.name || "N/A"}
        </p>
        <p>
          <strong>Rôle:</strong> {invitation.role || "N/A"}
        </p>
        <p>
          <strong>Email:</strong> {invitation.email || "N/A"}
        </p>
        <p>
          <strong>Statut:</strong> {invitation.status || "N/A"}
        </p>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#e0f2fe",
          borderRadius: "8px",
        }}
      >
        <h2 style={{ color: "#374151", marginBottom: "10px" }}>
          Statut de connexion :
        </h2>
        {session?.user ? (
          <div>
            <p>
              <strong>✅ Connecté en tant que:</strong>{" "}
              {session.user.name || session.user.email}
            </p>
            <div style={{ marginTop: "15px" }}>
              <button
                style={{
                  backgroundColor: "#059669",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "4px",
                  marginRight: "10px",
                  cursor: "pointer",
                }}
              >
                ✅ Accepter l'invitation
              </button>
              <button
                style={{
                  backgroundColor: "#dc2626",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ❌ Rejeter l'invitation
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p>
              <strong>❌ Non connecté</strong>
            </p>
            <p style={{ color: "#6b7280", marginBottom: "15px" }}>
              Vous devez vous connecter ou créer un compte pour accepter cette
              invitation.
            </p>
            <div>
              <button
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "4px",
                  marginRight: "10px",
                  cursor: "pointer",
                }}
              >
                🔑 Se connecter
              </button>
              <button
                style={{
                  backgroundColor: "#059669",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ➕ Créer un compte
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
