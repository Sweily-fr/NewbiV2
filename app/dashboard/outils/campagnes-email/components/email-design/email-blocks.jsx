"use client";

import { memo, useMemo } from "react";
import { ImagePlus, Signature } from "lucide-react";
import {
  HEADING_SIZES,
  blockWithDefaults,
  fontStack,
  isBlankHtml,
  resolveStyle,
} from "@/src/utils/email-campaign-design";
import { trackingNoticeSentence } from "@/src/utils/email-campaigns";
import { EmailFrame } from "../email-frame";
import { useCampaignData } from "./campaign-data";
import { highlightVariables, sanitizeCampaignHtml } from "./rich-html";
import { SocialIcon } from "./social-icons";

/**
 * Rendu React d'un e-mail de campagne, calqué sur le HTML envoyé par l'API
 * (newbi-api, src/services/emailCampaigns/render.js) : mêmes tailles,
 * marges, interlignes, couleurs et polices. Sert à la toile de l'éditeur et
 * aux vignettes des modèles.
 */

// Mise en forme commune du texte riche : liens soulignés de la couleur des
// liens (--ec-link), variables en pastille. Le reset de Tailwind retire
// marges et puces : on les remet comme à l'envoi.
const RICH_BASE =
  "ec-rich break-words [&_a]:text-[var(--ec-link)] [&_a]:underline [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_s]:line-through [&_.ec-var]:rounded-[4px] [&_.ec-var]:bg-[#5a50ff]/10 [&_.ec-var]:px-[3px] [&_.ec-var]:text-[#4a41e0] [&_.ec-var]:[text-decoration:none]";

/**
 * Texte (et colonne de texte) : paragraphes et listes séparés d'une ligne
 * de la taille du texte, dernier élément sans marge, ligne vide gardée.
 */
export const RICH_CLASS = `${RICH_BASE} [&_p]:m-0 [&_p]:mb-[1em] [&_p:empty]:min-h-[1lh] [&_ul]:m-0 [&_ul]:mb-[1em] [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:m-0 [&_ol]:mb-[1em] [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_li_p]:mb-0 [&>:last-child]:mb-0`;

/** Titre : chaque paragraphe est une ligne, sans écart ni puce. */
export const HEADING_RICH_CLASS = `${RICH_BASE} [&_p]:m-0 [&_p:empty]:min-h-[1lh] [&_ul]:m-0 [&_ul]:list-none [&_ul]:p-0 [&_ol]:m-0 [&_ol]:list-none [&_ol]:p-0 [&_li]:m-0`;

export const paddingStyle = (padding) =>
  padding
    ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`
    : undefined;

const lineHeightPx = (fontSize, ratio) => `${Math.round(fontSize * ratio)}px`;

/** Texte riche nettoyé, variables en pastille. */
export const RichHtml = memo(function RichHtml({
  html,
  className = RICH_CLASS,
}) {
  const clean = useMemo(
    () => highlightVariables(sanitizeCampaignHtml(html)),
    [html],
  );
  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />
  );
});

/** Texte d'un bouton : variables en pastille légère. */
function LabelWithVariables({ text }) {
  const parts = String(text || "").split(/(\{\{[^{}]*\}\})/g);
  return parts.map((part, index) =>
    /^\{\{[^{}]*\}\}$/.test(part) ? (
      <span
        key={index}
        className="rounded-[4px] bg-white/25 px-[3px]"
        style={{ textDecoration: "none" }}
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/**
 * Zone d'une image pas encore choisie : visible dans l'éditeur, jamais
 * envoyée (l'API ignore une image vide).
 */
export function ImagePlaceholder({
  height = 160,
  radius = 0,
  compact = false,
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1.5 border border-dashed border-[#c9cbd1] bg-[#f3f4f6] text-[#6b7280]"
      style={{ height, borderRadius: radius }}
    >
      <ImagePlus size={compact ? 18 : 22} strokeWidth={1.6} aria-hidden />
      {!compact && (
        <span
          className="text-[13px] font-medium"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          Ajouter une image
        </span>
      )}
    </div>
  );
}

/** Invite d'un texte vide (éditeur seulement : l'API ne l'envoie pas). */
function EmptyText({ children }) {
  return (
    <p style={{ margin: 0, opacity: 0.35, fontStyle: "italic" }}>{children}</p>
  );
}

/**
 * Document d'une signature (HTML rendu par l'API, celui de l'e-mail) dans
 * sa propre iframe : les styles de l'application ne la déforment pas.
 */
function signatureDocument(html, align) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;}body{text-align:${align};font-family:Arial,Helvetica,sans-serif;}.nb-sig{display:inline-block;text-align:left;vertical-align:top;}</style></head><body><div class="nb-sig">${html}</div></body></html>`;
}

/** Signature telle qu'elle partira ; les clics sélectionnent le bloc. */
function SignatureFrame({ html, align, name }) {
  const doc = useMemo(() => signatureDocument(html, align), [html, align]);
  return (
    <EmailFrame
      html={doc}
      title={name ? `Signature ${name}` : "Signature"}
      fit
      className="pointer-events-none bg-transparent"
    />
  );
}

/** Bloc Signature pas encore affichable (éditeur seulement). */
function SignaturePlaceholder({ children, warning = false }) {
  return (
    <div
      className={
        warning
          ? "flex items-center gap-2.5 rounded-md border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-[#92400e]"
          : "flex items-center gap-2.5 rounded-md border border-dashed border-[#c9cbd1] bg-[#f3f4f6] px-4 py-3 text-[#6b7280]"
      }
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <Signature size={18} strokeWidth={1.6} aria-hidden className="shrink-0" />
      <span className="text-[13px] leading-5 font-medium">{children}</span>
    </div>
  );
}

/**
 * Bloc Signature : la signature choisie, rendue par l'API. Dans l'éditeur,
 * une invite tant qu'elle n'est pas affichable (rien n'est envoyé).
 */
function SignatureBlockView({ block, editor }) {
  const data = useCampaignData();
  const signature = block.signatureId
    ? data?.signaturesById.get(block.signatureId)
    : null;
  const padding = paddingStyle(block.padding);
  if (signature?.html) {
    return (
      <div style={{ padding }}>
        <SignatureFrame
          html={signature.html}
          align={block.align}
          name={signature.name}
        />
      </div>
    );
  }
  if (!editor) return null;
  let message;
  let warning = false;
  if (!data) message = "Signature";
  else if (!data.signaturesLoaded)
    message = data.signaturesError
      ? "Signature indisponible pour le moment"
      : "Chargement de la signature…";
  else if (!block.signatureId)
    message = data.signatures.some((item) => item.mine)
      ? "Choisissez une signature dans le panneau de droite"
      : "Aucune signature\u00a0: créez-en une dans l'outil Signatures de mail";
  else if (signature) message = "Cette signature est vide";
  else {
    message =
      "Signature introuvable (supprimée\u00a0?)\u00a0: choisissez-en une autre, sinon ce bloc ne sera pas envoyé";
    warning = true;
  }
  return (
    <div style={{ padding }}>
      <SignaturePlaceholder warning={warning}>{message}</SignaturePlaceholder>
    </div>
  );
}

const blockAlign = (align) =>
  align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";

/**
 * Bouton : même allure que le bouton « bulletproof » de l'API (hauteur
 * 2,75 fois la taille du texte, 28 px de part et d'autre du texte).
 */
export function EmailButton({
  label,
  backgroundColor,
  textColor = "#ffffff",
  borderRadius = 6,
  fontSize = 16,
  fullWidth = false,
}) {
  const empty = !String(label || "").trim();
  return (
    <span
      style={{
        display: fullWidth ? "block" : "inline-block",
        backgroundColor,
        color: textColor,
        borderRadius,
        fontSize,
        fontWeight: 700,
        lineHeight: lineHeightPx(fontSize, 2.75),
        padding: fullWidth ? 0 : "0 28px",
        textAlign: "center",
        textDecoration: "none",
        wordBreak: "break-word",
        opacity: empty ? 0.45 : 1,
      }}
    >
      <LabelWithVariables text={empty ? "Texte du bouton" : label} />
    </span>
  );
}

/**
 * Contenu d'un bloc, marges comprises. `renderRichText(block, html)` : la
 * toile y monte l'éditeur du bloc sélectionné ; sinon le texte riche est
 * affiché. `editor` : invites des textes vides (jamais envoyées).
 */
export function BlockView({
  block: raw,
  style: rawStyle,
  renderRichText,
  editor = false,
}) {
  const block = blockWithDefaults(raw);
  if (!block) return null;
  const style = rawStyle?.__resolved ? rawStyle : resolveStyle(rawStyle);
  const rich = (html, className, emptyLabel) => {
    if (renderRichText) return renderRichText(block, html);
    if (editor && isBlankHtml(html)) return <EmptyText>{emptyLabel}</EmptyText>;
    return <RichHtml html={html} className={className} />;
  };

  switch (block.type) {
    case "heading": {
      const fontSize = HEADING_SIZES[block.level];
      return (
        <div
          style={{
            padding: paddingStyle(block.padding),
            textAlign: block.align,
            color: block.color || style.headingColor,
            fontSize,
            lineHeight: lineHeightPx(fontSize, 1.3),
            fontWeight: 700,
          }}
        >
          {rich(block.html, HEADING_RICH_CLASS, "Votre titre")}
        </div>
      );
    }
    case "text":
      return (
        <div
          style={{
            padding: paddingStyle(block.padding),
            textAlign: block.align,
            color: block.color || style.textColor,
            fontSize: block.fontSize,
            lineHeight: lineHeightPx(block.fontSize, block.lineHeight),
          }}
        >
          {rich(block.html, RICH_CLASS, "Écrivez votre texte")}
        </div>
      );
    case "button":
      return (
        <div
          style={{
            padding: paddingStyle(block.padding),
            textAlign: block.fullWidth ? "center" : block.align,
          }}
        >
          <EmailButton
            label={block.label}
            backgroundColor={block.backgroundColor || style.primaryColor}
            textColor={block.textColor}
            borderRadius={block.borderRadius}
            fontSize={block.fontSize}
            fullWidth={block.fullWidth}
          />
        </div>
      );
    case "image":
      return (
        <div
          style={{
            padding: paddingStyle(block.padding),
            display: "flex",
            justifyContent: blockAlign(block.align),
          }}
        >
          <div style={{ width: `${block.width}%` }}>
            {block.src ? (
              // Image choisie par l'utilisateur, montrée telle qu'elle partira
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={block.src}
                alt={block.alt || ""}
                draggable={false}
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  borderRadius: block.borderRadius,
                }}
              />
            ) : (
              <ImagePlaceholder radius={block.borderRadius} />
            )}
          </div>
        </div>
      );
    case "imageText": {
      const image = block.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.src}
          alt={block.alt || ""}
          draggable={false}
          style={{ display: "block", width: "100%", height: "auto" }}
        />
      ) : (
        <ImagePlaceholder height={150} compact />
      );
      const text = (
        <div
          style={{
            color: style.textColor,
            fontSize: 16,
            lineHeight: lineHeightPx(16, 1.6),
            textAlign: "left",
          }}
        >
          {rich(block.html, RICH_CLASS, "Écrivez votre texte")}
          {block.buttonLabel ? (
            <div style={{ marginTop: 16 }}>
              <EmailButton
                label={block.buttonLabel}
                backgroundColor={style.primaryColor}
              />
            </div>
          ) : null}
        </div>
      );
      // Image à gauche ou à droite, colonnes alignées en haut, 24 px entre
      const right = block.imagePosition === "right";
      return (
        <div
          style={{
            padding: paddingStyle(block.padding),
            display: "flex",
            flexDirection: right ? "row-reverse" : "row",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: "1 1 0", minWidth: 0 }}>{image}</div>
          <div style={{ flex: "1 1 0", minWidth: 0 }}>{text}</div>
        </div>
      );
    }
    case "divider":
      return (
        <div style={{ padding: paddingStyle(block.padding) }}>
          <div
            style={{
              width: `${block.width}%`,
              margin: "0 auto",
              borderTop: `${block.thickness}px solid ${block.color}`,
            }}
          />
        </div>
      );
    case "spacer":
      return <div style={{ height: block.height }} />;
    case "social": {
      const items = block.items.length
        ? block.items
        : [{ network: "facebook" }, { network: "instagram" }];
      return (
        <div
          style={{
            padding: paddingStyle(block.padding),
            display: "flex",
            justifyContent: blockAlign(block.align),
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {items.map((item, index) => {
            // Sans adresse, l'icône n'est pas envoyée : estompée ici
            const linked = /^https?:\/\/[^/\s]+\.[^\s]+/i.test(item.url || "");
            return (
              <span
                key={`${item.network}-${index}`}
                style={{ opacity: linked ? 1 : 0.35 }}
                title={
                  linked
                    ? undefined
                    : "Ajoutez l'adresse pour afficher cette icône dans l'e-mail"
                }
              >
                <SocialIcon
                  network={item.network}
                  iconStyle={block.iconStyle}
                  primaryColor={style.primaryColor}
                  size={32}
                />
              </span>
            );
          })}
        </div>
      );
    }
    case "signature":
      return <SignatureBlockView block={block} editor={editor} />;
    default:
      return null;
  }
}

/**
 * Pied de page ajouté par l'API à chaque envoi (identité de l'entreprise,
 * raison de l'envoi, suivi s'il est actif, désinscription), sous le cadre :
 * affiché tel quel, jamais modifiable. Adresse manquante : signalée, jamais
 * inventée. Campagne suivie : version d'un destinataire qui a accepté le
 * suivi (phrase), et lien « Gérer mes préférences » (accepter ou refuser le
 * suivi) avant la désinscription, comme l'API.
 *
 * @param {{ opens?: boolean, clicks?: boolean, privacyPolicyUrl?: string }} [trackingNotice]
 */
export function EmailFooterView({
  style: rawStyle,
  companyName,
  companyAddress,
  addressMissingHint = false,
  trackingNotice = null,
}) {
  const style = rawStyle?.__resolved ? rawStyle : resolveStyle(rawStyle);
  const name = companyName || "l'expéditeur";
  const trackingSentence = trackingNoticeSentence(
    companyName,
    trackingNotice || {},
  );
  const tracked = Boolean(trackingNotice?.opens || trackingNotice?.clicks);
  const line = {
    margin: 0,
    fontSize: 12,
    lineHeight: "18px",
    color: style.footerTextColor,
  };
  return (
    <div
      style={{
        padding: "24px 24px 8px",
        textAlign: "center",
        fontFamily: fontStack(style.fontFamily),
      }}
    >
      <p style={{ ...line, marginBottom: 4, fontWeight: 700 }}>{name}</p>
      {companyAddress ? (
        <p style={{ ...line, marginBottom: 12 }}>{companyAddress}</p>
      ) : addressMissingHint ? (
        <p style={{ ...line, marginBottom: 12, color: "#b45309" }}>
          Adresse de l&apos;entreprise à compléter dans les paramètres
        </p>
      ) : null}
      <p style={{ ...line, marginBottom: 12 }}>
        Vous recevez cet e-mail car vous êtes en relation avec {name}.
      </p>
      {trackingSentence && (
        <p style={{ ...line, marginBottom: 12 }}>
          {trackingSentence}
          {trackingNotice?.privacyPolicyUrl ? (
            <>
              {" "}
              <span style={{ textDecoration: "underline" }}>
                Politique de confidentialité
              </span>
            </>
          ) : null}
        </p>
      )}
      {tracked ? (
        <p style={line}>
          <span style={{ textDecoration: "underline" }}>
            Gérer mes préférences
          </span>
          {" · "}
          <span style={{ textDecoration: "underline" }}>Se désinscrire</span>
        </p>
      ) : (
        <p style={{ ...line, textDecoration: "underline" }}>Se désinscrire</p>
      )}
    </div>
  );
}

/** Style général complet, marqué pour ne pas être recalculé bloc par bloc. */
export const resolvedStyle = (style) => ({
  ...resolveStyle(style),
  __resolved: true,
});

/**
 * Fond et cadre de l'e-mail (largeur, arrondi, police, couleurs) ; les
 * blocs vont dans `children`, le pied dans `footer`.
 */
export function EmailShell({
  style: rawStyle,
  children,
  footer,
  className = "",
  frameClassName = "",
  outerPadding = "24px 12px",
  frameProps = {},
}) {
  const style = rawStyle?.__resolved ? rawStyle : resolvedStyle(rawStyle);
  return (
    <div
      className={className}
      style={{
        backgroundColor: style.backgroundColor,
        padding: outerPadding,
        fontFamily: fontStack(style.fontFamily),
        "--ec-link": style.linkColor,
      }}
    >
      <div
        {...frameProps}
        className={frameClassName}
        style={{
          maxWidth: style.contentWidth,
          width: "100%",
          margin: "0 auto",
          backgroundColor: style.contentBackgroundColor,
          borderRadius: style.contentRadius,
          color: style.textColor,
          ...(frameProps.style || {}),
        }}
      >
        {children}
      </div>
      <div style={{ maxWidth: style.contentWidth, margin: "0 auto" }}>
        {footer}
      </div>
    </div>
  );
}

/** E-mail complet en lecture seule (vignettes des modèles). */
export function StaticEmail({
  design,
  companyName,
  companyAddress,
  showFooter = true,
}) {
  const style = resolvedStyle(design?.style);
  return (
    <EmailShell
      style={style}
      footer={
        showFooter ? (
          <EmailFooterView
            style={style}
            companyName={companyName}
            companyAddress={companyAddress}
          />
        ) : null
      }
      frameProps={{ style: { overflow: "hidden" } }}
    >
      {(design?.blocks || []).map((block) => (
        <BlockView key={block.id} block={block} style={style} />
      ))}
    </EmailShell>
  );
}
