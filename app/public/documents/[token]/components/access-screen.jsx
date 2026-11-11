"use client";

import Image from "next/image";
import { Card, CardContent } from "@/src/components/ui/card";

/** Logo et nom de l'entreprise qui partage les documents. */
export function WorkspaceIdentity({ workspace, size = "md" }) {
  if (!workspace?.name && !workspace?.logo) return null;
  const logoSize = size === "lg" ? "h-12 w-12" : "h-8 w-8";
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {workspace.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={workspace.logo}
          alt=""
          className={`${logoSize} rounded-md object-contain shrink-0`}
        />
      )}
      {workspace.name && (
        <span
          className={`font-medium truncate ${size === "lg" ? "text-base" : "text-sm"}`}
        >
          {workspace.name}
        </span>
      )}
    </div>
  );
}

/** « Partagé avec newbi. » : signature discrète des pages du visiteur. */
export function NewbiSignature({ className = "" }) {
  return (
    <a
      href="https://www.newbi.fr"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      Partagé avec
      <Image
        src="/newbiLetter.png"
        alt="Newbi"
        width={52}
        height={13}
        className="h-[13px] w-auto dark:invert"
      />
    </a>
  );
}

/**
 * Écran d'accès (mot de passe, e-mail, code, nom, accès retiré, lien
 * expiré) : carte centrée sur le fond Newbi, comme le transfert de fichiers
 * et le tableau kanban partagés.
 */
export function AccessScreen({ workspace, children }) {
  return (
    // isolate : le fond (-z-10) reste au-dessus du fond uni du gabarit public
    <div className="relative isolate min-h-screen overflow-hidden flex flex-col items-center justify-center px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#f4f3ff] via-background to-[#f4f3ff] dark:from-background dark:to-background pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#5a50ff]/10 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-[#5a50ff]/10 blur-3xl -z-10 pointer-events-none" />

      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="pt-6 space-y-5">
          {(workspace?.name || workspace?.logo) && (
            <div className="flex justify-center pb-1">
              <WorkspaceIdentity workspace={workspace} size="lg" />
            </div>
          )}
          {children}
        </CardContent>
      </Card>

      <NewbiSignature className="mt-6" />
    </div>
  );
}

/** Pastille, titre et explication d'un écran d'accès. */
export function AccessHeader({ icon: Icon, title, children }) {
  return (
    <div className="text-center space-y-2">
      {Icon && (
        <div className="flex justify-center">
          <div className="size-12 rounded-full bg-[#5a50ff]/10 flex items-center justify-center">
            <Icon className="size-5 text-[#5a50ff]" />
          </div>
        </div>
      )}
      <h1 className="text-lg font-medium">{title}</h1>
      {children && <p className="text-sm text-muted-foreground">{children}</p>}
    </div>
  );
}
