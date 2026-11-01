import { escapeHtml } from "../../validation.js";

const texte = (valeur) =>
  valeur == null ? valeur : escapeHtml(String(valeur));

const utilisateur = (user) =>
  user ? { ...user, name: texte(user.name), email: texte(user.email) } : user;

/**
 * Noms de l'espace, de l'invitant et du membre échappés avant d'être placés
 * dans le HTML des e-mails : ils sont saisis librement et enregistrés tels
 * quels.
 */
export function escapeOrganizationEmailData(data = {}) {
  return {
    ...data,
    organization: data.organization
      ? { ...data.organization, name: texte(data.organization.name) }
      : data.organization,
    inviter: data.inviter
      ? { ...data.inviter, user: utilisateur(data.inviter.user) }
      : data.inviter,
    member: data.member
      ? { ...data.member, user: utilisateur(data.member.user) }
      : data.member,
  };
}

export { texte as escapeEmailText };
