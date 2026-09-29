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
import { GmailSize } from "./controls";

/**
 * Copie le HTML dans le presse-papiers. L'API Clipboard passe en premier :
 * elle copie le HTML brut, sans que le navigateur y injecte les styles de
 * la page (fond blanc en mode sombre). execCommand reste en secours.
 */
export async function copySignatureHtml(html, text) {
  if (!html) return false;
  try {
    if (navigator.clipboard && typeof window.ClipboardItem !== "undefined") {
      await navigator.clipboard.write([
        new window.ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text || ""], { type: "text/plain" }),
        }),
      ]);
      return true;
    }
  } catch {
    // on tente le secours ci-dessous
  }
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0.01;background:transparent;";
  container.setAttribute("contenteditable", "true");
  container.innerHTML = html;
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
    note: "Au-delà de 10 000 caractères, Gmail refuse la signature : la jauge ci-dessus vous indique où vous en êtes.",
  },
  {
    id: "outlook-web",
    label: "Outlook (web et nouveau)",
    steps: [
      "Copiez la signature.",
      "Dans Outlook, Paramètres (roue dentée) → Courrier → Composer et répondre.",
      "Dans « Signature électronique », cliquez sur « Nouvelle signature », donnez un nom.",
      "Collez la signature dans l'éditeur.",
      "Sélectionnez-la pour les nouveaux messages et les réponses, puis « Enregistrer ».",
    ],
    note: "Le nouvel Outlook et Outlook sur le web partagent le même réglage : la signature est synchronisée avec votre compte.",
  },
  {
    id: "outlook-desktop",
    label: "Outlook classique (Windows, Mac)",
    steps: [
      "Copiez la signature.",
      "Ouvrez un nouveau message, puis Insertion → Signature → Signatures…",
      "Cliquez sur « Nouveau », donnez un nom, puis collez dans la zone d'édition (Ctrl+V).",
      "Choisissez-la pour les nouveaux messages et les réponses, puis OK.",
      "Si le rendu semble décalé, utilisez plutôt « Télécharger le HTML » et importez le fichier via le même menu.",
    ],
    note: "Outlook classique utilise le moteur de Word : la signature est conçue pour lui, mais les angles arrondis des boutons y sont droits.",
  },
  {
    id: "apple-mail",
    label: "Apple Mail",
    steps: [
      "Copiez la signature.",
      "Dans Mail, menu Mail → Réglages → Signatures.",
      "Sélectionnez votre compte, cliquez sur « + » et nommez la signature.",
      "Décochez « Toujours utiliser ma police par défaut pour les messages », puis collez la signature.",
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
  },
];

export default function InstallDialog({ open, onOpenChange, render, name, gmailMaxChars = 10000 }) {
  const [copied, setCopied] = useState(false);
  const html = render?.html || "";
  const chars = render?.chars || 0;

  const handleCopy = async () => {
    const ok = await copySignatureHtml(html, render?.text);
    if (ok) {
      setCopied(true);
      toast.success("Signature copiée, collez-la dans votre client mail");
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast.error("Impossible de copier. Utilisez le téléchargement HTML.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Installer la signature</DialogTitle>
          <DialogDescription>
            Copiez la signature puis suivez les étapes de votre client mail.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={handleCopy} disabled={!html} className="cursor-pointer">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copiée" : "Copier la signature"}
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadSignatureHtml(html, name)}
            disabled={!html}
            className="cursor-pointer"
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
          <TabsList className="flex flex-wrap h-auto">
            {GUIDES.map((g) => (
              <TabsTrigger key={g.id} value={g.id} className="text-xs">
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
      </DialogContent>
    </Dialog>
  );
}
