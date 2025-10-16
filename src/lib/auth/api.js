import { redirect } from "next/dist/server/api-utils";
import { authClient } from "../auth-client";

export async function loginUser(formData, rememberMe = false) {
  try {
    const { data, error } = await authClient.signIn.email(
      {
        email: formData.email,
        password: formData.password,
        // callbackURL: "/dashboard",
        rememberMe: rememberMe,
      },
      {
        onSuccess: () => {
          console.log("login");
          //   toast.success("Connexion reussie");
        },
        onError: (error) => {
          toast.error(error.message);
        },
        // Vous pouvez ajouter des callbacks ici si nécessaire
      }
    );

    if (error) {
      throw new Error(error.message || "Erreur de connexion");
    }

    return data;
  } catch (err) {
    throw new Error(err.message || "Erreur de connexion");
  }
}

export async function registerUser(formData) {
  try {
    // Format selon la documentation Better Auth
    const { data, error } = await authClient.signUp.email({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      // Supprimer passwordConfirmation car non supporté par l'API
      callbackURL: "/dashboard",
    });

    if (error) {
      // Propager le message d'erreur exact de Better Auth
      const errorMessage = error.message || "Erreur lors de l'inscription";
      
      // Gérer les erreurs spécifiques
      if (errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("exist")) {
        throw new Error("Cet email est déjà utilisé");
      } else if (errorMessage.toLowerCase().includes("already")) {
        throw new Error("Cet email est déjà utilisé");
      }
      
      throw new Error(errorMessage);
    }

    return data;
  } catch (err) {
    // Propager l'erreur sans la modifier
    throw err;
  }
}

export async function logoutUser() {
  try {
    const { error } = await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          console.log("logout");
        },
      },
    });
    console.log(error);
    if (error) {
      throw new Error(error.message || "Erreur lors de la déconnexion");
    }
    return true;
  } catch (err) {
    throw new Error(err.message || "Erreur lors de la déconnexion");
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await authClient.getSession();
    if (error) {
      return null;
    }
    return data?.user || null;
  } catch (err) {
    return null;
  }
}

export async function updateUserProfile(formData) {
  try {
    console.log(formData, "update profile");
    // Utiliser l'API Better Auth pour mettre à jour le profil utilisateur
    // Envoyer uniquement les champs fournis dans formData
    const { data, error } = await authClient.updateUser(formData);

    if (error) {
      throw new Error(
        error.message || "Erreur lors de la mise à jour du profil"
      );
    }

    return data;
  } catch (err) {
    throw new Error(err.message || "Erreur lors de la mise à jour du profil");
  }
}

export const verifyEmail = async (email) => {
  try {
    await authClient.sendVerificationEmail({
      email: email,
      callbackURL: "/dashboard",
    });
  } catch (err) {
    throw new Error(err.message || "Erreur lors de la vérification de l'email");
  }
};

export const signInGoogle = async () => {
  try {
    const data = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
    return data;
  } catch (err) {
    console.error("Erreur lors de la connexion avec Google:", err);
    throw err;
  }
};
export const signInGithub = async () => {
  try {
    const data = await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    });
    return data;
  } catch (err) {
    console.error("Erreur lors de la connexion avec Github:", err);
    throw err;
  }
};

/**
 * Récupère le token d'accès Google pour l'utilisateur connecté
 * @param {string} accountId - ID du compte Google (optionnel)
 * @returns {Promise<{accessToken: string}>} - Token d'accès Google
 */
export const getGoogleAccessToken = async (accountId) => {
  try {
    const { accessToken } = await authClient.getAccessToken({
      providerId: "google",
      accountId: accountId, // Optionnel, si vous voulez récupérer le token pour un compte spécifique
    });
    return { accessToken };
  } catch (err) {
    throw new Error(err.message || "Impossible de récupérer le token Google");
  }
};

/**
 * Récupère les informations du profil Google de l'utilisateur
 * @param {string} accessToken - Token d'accès Google
 * @returns {Promise<Object>} - Informations du profil Google
 */
export const getGoogleUserProfile = async (accessToken) => {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur API Google: ${response.status}`);
    }

    const profileData = await response.json();
    return profileData;
  } catch (err) {
    console.error("Erreur lors de la récupération du profil Google:", err);
    throw new Error(err.message || "Impossible de récupérer le profil Google");
  }
};

// export const accounts = await authClient.listAccounts();
// console.log(accounts);
// export const accountsGoogle = accounts.data.filter(
//   (account) => account.providerId === "google"
// );
// console.log(accountsGoogle, "accountsGoogle");

// export const accounts = await authClient.listAccounts();

// const accountID = accounts.data.filter(
//   (account) => account.provider === "google"
// )[0];

// console.log(accountID);

// export const getGoogleTokenForAccount = async () => {
//   try {
//     // Récupérer la liste des comptes
//     const accountsResponse = await authClient.listAccounts();
//     console.log("Tous les comptes:", accountsResponse);

//     // Filtrer pour trouver le compte Google
//     const googleAccount = accountsResponse.data.find(
//       (account) => account.provider === "google"
//     );

//     if (!googleAccount) {
//       console.error("Aucun compte Google trouvé");
//       return null;
//     }

//     console.log("Compte Google trouvé:", googleAccount);

//     // Vérifier si l'utilisateur est authentifié
//     const session = await authClient.getSession();
//     console.log("Session utilisateur:", session);

//     if (!session) {
//       console.error("Utilisateur non authentifié");
//       return null;
//     }

//     // Appel à getAccessToken avec l'ID du compte Google
//     console.log(
//       "Tentative de récupération du token pour le compte:",
//       googleAccount.id
//     );

//     const result = await authClient.getAccessToken({
//       providerId: "google",
//       accountId: googleAccount.id,
//     });

//     console.log("Résultat de getAccessToken:", result);
//     return result.data.accessToken;
//   } catch (err) {
//     console.error("Erreur lors de la récupération du token:", err);
//     console.error("Détails de l'erreur:", err.response?.data || err.message);
//     return null;
//   }
// };

// /**
//  * Vérifie si l'utilisateur est connecté via Google
//  * @returns {Promise<boolean>} - True si l'utilisateur est connecté via Google
//  */
// export const isConnectedWithGoogle = async () => {
//   try {
//     // Récupérer la session utilisateur
//     const session = await authClient.getSession();

//     if (!session || !session.user) {
//       return false;
//     }

//     // Vérifier si l'utilisateur a un compte Google associé
//     const accounts = session.user.accounts || [];
//     return accounts.some((account) => account.providerId === "google");
//   } catch (err) {
//     console.error(
//       "Erreur lors de la vérification de la connexion Google:",
//       err
//     );
//     return false;
//   }
// };
