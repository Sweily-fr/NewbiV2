"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { FOCUS_RING, GmailSize } from "./controls";

/**
 * Copie le HTML dans le presse-papiers. L'API Clipboard passe en premier :
 * elle copie le HTML brut, sans que le navigateur y injecte les styles de
 * la page (fond blanc en mode sombre). execCommand reste en secours.
 *
 * `render` : la signature affichée ({ html, text }). `fresher` : la promesse
 * d'un rendu plus récent, que le presse-papiers attend lui-même. L'écriture
 * est ainsi demandée dans le clic, avant toute attente : Safari 18 et
 * antérieurs refusent une copie demandée après un aller-retour réseau.
 */
export async function copySignatureHtml(render, fresher = null) {
  if (!render?.html) return false;
  try {
    if (navigator.clipboard && typeof window.ClipboardItem !== "undefined") {
      const part = (type, pick) => {
        const blob = (r) =>
          new Blob([pick(r?.html ? r : render) || ""], { type });
        return fresher ? fresher.then(blob, () => blob(render)) : blob(render);
      };
      await navigator.clipboard.write([
        new window.ClipboardItem({
          "text/html": part("text/html", (r) => r.html),
          "text/plain": part("text/plain", (r) => r.text),
        }),
      ]);
      return true;
    }
  } catch {
    // on tente le secours ci-dessous
  }
  // Secours sans attente : la signature affichée
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0.01;background:transparent;";
  container.setAttribute("contenteditable", "true");
  container.innerHTML = render.html;
  document.body.appendChild(container);
  try {
    const range = document.createRange();
    range.selectNodeContents(container);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    const ok = document.execCommand("copy");
    selection.removeAllRanges();
    return ok;
  } catch {
    return false;
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Copie avec retour à l'utilisateur : toast et `onCopied` si elle a réussi.
 * Un refus du navigateur propose « Réessayer » : ce nouveau clic copie la
 * signature déjà prête, ce qui passe partout. S'il échoue encore, reste le
 * fichier, ouvert dans le navigateur puis copié à la main.
 */
export async function copySignature(
  render,
  { fresher = null, onCopied, retry = true } = {},
) {
  // Dernière signature connue : celle que « Réessayer » copiera
  let latest = render;
  const fresh = fresher?.then(
    (r) => (latest = r?.html ? r : latest),
    () => latest,
  );
  const ok = await copySignatureHtml(render, fresh);
  if (ok) {
    onCopied?.();
    toast.success("Signature copiée, collez-la dans votre client mail");
  } else if (retry) {
    toast.document("La copie n'a pas abouti", {
      fallbackIcon: Copy,
      action: {
        label: "Réessayer",
        onClick: () => copySignature(latest, { onCopied, retry: false }),
      },
      duration: 10000,
    });
  } else {
    toast.error("La copie n'a pas abouti", {
      description:
        "Passez par le fichier : « Télécharger le HTML » dans la fenêtre d'installation, puis ouvrez le fichier, sélectionnez tout (Ctrl+A ou Cmd+A), copiez et collez.",
    });
  }
  return ok;
}

export function downloadSignatureHtml(html, name) {
  const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${
    name || "Signature"
  }</title></head><body>${html}</body></html>`;
  const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(name || "signature").replace(/[^a-z0-9àâäéèêëïîôöùûüç_ -]/gi, "").trim() || "signature"}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const GUIDES = [
  {
    id: "gmail",
    label: "Gmail",
    steps: [
      "Copiez la signature avec le bouton ci-dessus.",
      "Dans Gmail, ouvrez Paramètres (roue dentée) puis « Voir tous les paramètres ».",
      "Onglet Général, section Signature : cliquez sur « Créer », donnez un nom.",
      "Collez la signature dans la zone de texte (Cmd+V ou Ctrl+V).",
      "Choisissez-la comme signature par défaut pour les nouveaux messages et les réponses, puis « Enregistrer les modifications » tout en bas.",
    ],
    note: "Gmail limite une signature à 10 000 caractères, mais en retire une partie au collage : une signature signalée « peut dépasser » passe souvent. S'il la refuse, retirez un élément (réseaux, bannière…).",
  },
  {
    id: "outlook-web",
    label: "Outlook (web et nouveau)",
    steps: [
      "Copiez la signature.",
      "Dans Outlook, Paramètres (roue dentée) → Comptes → Signatures (sur une version plus ancienne : Courrier → Composer et répondre).",
      "Cliquez sur « Ajouter une signature » (ou « Nouvelle signature »), donnez un nom.",
      "Collez la signature dans l'éditeur.",
      "Sélectionnez-la pour les nouveaux messages et les réponses, puis « Enregistrer ».",
    ],
    note: "Un menu « Fichier » en haut à gauche ? C'est Outlook classique : prenez l'onglet correspondant. Le nouvel Outlook et Outlook sur le web partagent le même réglage : la signature est synchronisée avec votre compte.",
  },
  {
    id: "outlook-desktop",
    label: "Outlook classique (Windows)",
    steps: [
      "Copiez la signature.",
      "Dans Outlook : Fichier → Options → Courrier → Signatures… (ou, dans un nouveau message : Message → Signature → Signatures…).",
      "Cliquez sur « Nouveau », donnez un nom.",
      "Collez la signature dans la zone « Modifier la signature » (Ctrl+V).",
      "En haut à droite, sous « Choisir une signature par défaut » : choisissez votre compte de messagerie, puis sélectionnez la signature pour « Nouveaux messages » et « Réponses/transferts ». Validez avec OK.",
      "Rendu décalé ou collage vide : cliquez sur « Télécharger le HTML », ouvrez le fichier d'un double-clic (il s'affiche dans votre navigateur), Ctrl+A puis Ctrl+C, et recollez à l'étape 4.",
    ],
    note: "Outlook classique utilise le moteur de Word : la signature est conçue pour lui, mais les angles arrondis des boutons y sont droits.",
  },
  {
    id: "outlook-mac",
    label: "Outlook (Mac)",
    steps: [
      "Copiez la signature.",
      "Dans Outlook, menu Outlook → Réglages (ou Paramètres) → Signatures.",
      "Cliquez sur « + », nommez la signature, puis collez-la (Cmd+V).",
      "Plus bas, choisissez votre compte, puis la signature à ajouter aux nouveaux messages et aux réponses ou transferts.",
      "Fermez la fenêtre Signatures : c'est enregistré.",
    ],
  },
  {
    id: "apple-mail",
    label: "Apple Mail",
    steps: [
      "Copiez la signature.",
      "Dans Mail, menu Mail → Réglages (ou Préférences) → Signatures.",
      "Sélectionnez votre compte, cliquez sur « + » et nommez la signature.",
      "Décochez « Toujours utiliser ma police de message par défaut », puis collez la signature.",
      "En bas de la fenêtre, menu « Choisir la signature » : sélectionnez-la, sinon elle ne s'ajoute pas toute seule.",
      "Fermez la fenêtre : la signature est enregistrée automatiquement.",
    ],
    note: "En mode sombre, Apple Mail inverse les textes sombres : la signature est prévue pour rester lisible.",
  },
  {
    id: "thunderbird",
    label: "Thunderbird",
    steps: [
      "Téléchargez le HTML avec le bouton ci-dessus.",
      "Dans Thunderbird, Paramètres des comptes → votre compte.",
      "Cochez « Apposer la signature à partir d'un fichier », puis choisissez le fichier téléchargé.",
      "Validez : la signature est ajoutée à chaque nouveau message.",
    ],
    note: "Thunderbird relit ce fichier à chaque message : rangez-le dans un dossier où il restera. Après une modification, téléchargez-le à nouveau et remplacez l'ancien.",
  },
  {
    id: "other",
    label: "Autre messagerie (Orange, SFR, Free…)",
    steps: [
      "Copiez la signature.",
      "Dans les paramètres de votre messagerie, cherchez la rubrique « Signature » (Mail Orange : Paramètres → Tous les paramètres → Écrire un mail).",
      "Créez une signature, collez-la (Ctrl+V ou Cmd+V) puis enregistrez.",
      "Si la messagerie le propose, choisissez-la comme signature par défaut.",
    ],
    note: "Si la messagerie n'accepte que du texte simple, les images et les couleurs n'apparaîtront pas.",
  },
];

/** Sous les guides, valables pour toutes les messageries. */
const TIPS = [
  {
    title: "Déjà installée ?",
    text: "Ouvrez la signature existante dans votre messagerie, effacez son contenu puis collez la nouvelle version, sinon vous en aurez deux.",
  },
  {
    title: "Rien ne se colle ?",
    text: "Cliquez sur « Télécharger le HTML », ouvrez le fichier (il s'affiche dans votre navigateur), sélectionnez tout (Ctrl+A ou Cmd+A), copiez puis collez.",
  },
  {
    title: "Pour vérifier :",
    text: "écrivez un nouveau message, la signature doit s'ajouter seule. Envoyez-le-vous pour la voir comme vos destinataires.",
  },
];

export default function InstallDialog({ open, onOpenChange, render, name, gmailMaxChars = 10000 }) {
  const [copied, setCopied] = useState(false);
  const html = render?.html || "";
  const chars = render?.chars || 0;

  const handleCopy = () =>
    copySignature(render, {
      onCopied: () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      },
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Installer la signature</DialogTitle>
          <DialogDescription>
            {
              "Copiez la signature puis suivez les étapes de votre messagerie. Elle garde la version collée : après chaque modification, revenez ici, recopiez-la et remplacez l'ancienne."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={handleCopy} disabled={!html} className={`cursor-pointer ${FOCUS_RING}`}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copiée" : "Copier la signature"}
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadSignatureHtml(html, name)}
            disabled={!html}
            className={`cursor-pointer ${FOCUS_RING}`}
          >
            <Download size={14} />
            Télécharger le HTML
          </Button>
          {chars > 0 && (
            <div className="ml-auto text-xs">
              <GmailSize chars={chars} max={gmailMaxChars} />
            </div>
          )}
        </div>

        {render?.warnings?.length > 0 && (
          <ul className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200 space-y-1">
            {render.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}

        <Tabs defaultValue="gmail">
          {/* Deux rangées d'onglets : chacun garde sa hauteur, pour que la
              seconde reste dans le fond de la liste */}
          <TabsList className="flex flex-wrap h-auto">
            {GUIDES.map((g) => (
              <TabsTrigger
                key={g.id}
                value={g.id}
                className={`h-auto text-xs ${FOCUS_RING}`}
              >
                {g.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {GUIDES.map((g) => (
            <TabsContent key={g.id} value={g.id} className="mt-3">
              <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                {g.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              {g.note && <p className="mt-3 text-xs text-muted-foreground">{g.note}</p>}
            </TabsContent>
          ))}
        </Tabs>

        <div className="space-y-1.5 border-t pt-3 text-xs text-muted-foreground">
          {TIPS.map((t) => (
            <p key={t.title}>
              <span className="font-medium text-foreground">{t.title}</span>{" "}
              {t.text}
            </p>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
