"use client";

import { memo, useMemo } from "react";
import { ImagePlus } from "lucide-react";
import {
  HEADING_SIZES,
  blockWithDefaults,
  fontStack,
  resolveStyle,
} from "@/src/utils/email-campaign-design";
import { highlightVariables, sanitizeCampaignHtml } from "./rich-html";
import { SocialIcon } from "./social-icons";

/**
 * Rendu React d'un e-mail de campagne, fidèle au HTML envoyé par l'API
 * (newbi-api, src/services/emailCampaigns/render.js) : mêmes tailles,
 * marges, couleurs et polices, en styles en ligne. Sert à la toile de
 * l'éditeur et aux vignettes des modèles.
 */

/**
 * Mise en forme du texte riche à l'intérieur d'un bloc : paragraphes
 * espacés, listes, liens soulignés de la couleur des liens (--ec-link), et
 * variables en pastille. Le reset de Tailwind retire marges et puces : on
 * les remet comme dans une messagerie.
 */
export const RICH_CLASS =
  "ec-rich break-words [&_p]:m-0 [&_p]:mb-[0.75em] [&_p:last-child]:mb-0 [&_ul]:m-0 [&_ul]:mb-[0.75em] [&_ul:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-[1.4em] [&_ol]:m-0 [&_ol]:mb-[0.75em] [&_ol:last-child]:mb-0 [&_ol]:list-decimal [&_ol]:pl-[1.4em] [&_li>p]:mb-0 [&_a]:text-[var(--ec-link)] [&_a]:underline [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_s]:line-through [&_.ec-var]:rounded-[4px] [&_.ec-var]:bg-[#5a50ff]/10 [&_.ec-var]:px-[3px] [&_.ec-var]:text-[#4a41e0] [&_.ec-var]:[text-decoration:none]";

export const paddingStyle = (padding) =>
  padding
    ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`
    : undefined;

/** Texte riche nettoyé, variables en pastille. */
export const RichHtml = memo(function RichHtml({ html, className = "" }) {
  const clean = useMemo(
    () => highlightVariables(sanitizeCampaignHtml(html)),
    [html],
  );
  return (
    <div
      className={`${RICH_CLASS} ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
});

/** Texte visible d'un bouton : variables en pastille légère. */
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
 * Zone d'une image pas encore choisie (bloc image vide) : visible dans
 * l'éditeur, jamais envoyée.
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

const textAlign = (align) => align || "left";
const blockAlign = (align) =>
  align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";

/**
 * Bouton du bloc Bouton (ou du bloc Image et texte) : même allure qu'à
 * l'envoi (bouton « bulletproof » de l'API).
 */
export function EmailButton({
  label,
  backgroundColor,
  textColor = "#ffffff",
  borderRadius = 6,
  fontSize = 16,
  fullWidth = false,
}) {
  return (
    <span
      style={{
        display: fullWidth ? "block" : "inline-block",
        backgroundColor,
        color: textColor,
        borderRadius,
        fontSize,
        fontWeight: 700,
        lineHeight: 1.2,
        padding: "12px 24px",
        textAlign: "center",
        textDecoration: "none",
        wordBreak: "break-word",
      }}
    >
      <LabelWithVariables text={label || "Bouton"} />
    </span>
  );
}

/**
 * Contenu d'un bloc, marges comprises. `renderRichText(block, html)` : la
 * toile y monte l'éditeur de texte du bloc sélectionné ; sinon le texte
 * riche est affiché.
 */
export function BlockView({ block: raw, style: rawStyle, renderRichText }) {
  const block = blockWithDefaults(raw);
  if (!block) return null;
  const style = rawStyle?.__resolved ? rawStyle : resolveStyle(rawStyle);
  const rich = (html, extraClass) =>
    renderRichText ? (
      renderRichText(block, html, extraClass)
    ) : (
      <RichHtml html={html} className={extraClass} />
    );

  switch (block.type) {
    case "heading":
      return (
        <div
          style={{
            padding: paddingStyle(block.padding),
            textAlign: textAlign(block.align),
            color: block.color || style.headingColor,
            fontSize: HEADING_SIZES[block.level],
            lineHeight: 1.3,
            fontWeight: 700,
          }}
        >
          {rich(block.html)}
        </div>
      );
    case "text":
      return (
        <div
          style={{
            padding: paddingStyle(block.padding),
            textAlign: textAlign(block.align),
            color: block.color || style.textColor,
            fontSize: block.fontSize,
            lineHeight: block.lineHeight,
          }}
        >
          {rich(block.html)}
        </div>
      );
    case "button":
      return (
        <div
          style={{
            padding: paddingStyle(block.padding),
            textAlign: block.fullWidth ? "center" : textAlign(block.align),
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
              // Image choisie par l'utilisateur (URL publique), affichée
              // telle qu'elle partira : pas d'optimisation Next
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
            lineHeight: 1.6,
          }}
        >
          {rich(block.html)}
          {block.buttonLabel ? (
            <div style={{ marginTop: 16 }}>
              <EmailButton
                label={block.buttonLabel}
                backgroundColor={style.primaryColor}
                fontSize={15}
              />
            </div>
          ) : null}
        </div>
      );
      const left = block.imagePosition === "right" ? text : image;
      const right = block.imagePosition === "right" ? image : text;
      return (
        <div
          style={{
            padding: paddingStyle(block.padding),
            display: "flex",
            gap: 24,
            alignItems: "center",
          }}
        >
          <div style={{ flex: "1 1 0", minWidth: 0 }}>{left}</div>
          <div style={{ flex: "1 1 0", minWidth: 0 }}>{right}</div>
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
            gap: 10,
            flexWrap: "wrap",
            opacity: block.items.length ? 1 : 0.45,
          }}
        >
          {items.map((item, index) => (
            <SocialIcon
              key={`${item.network}-${index}`}
              network={item.network}
              iconStyle={block.iconStyle}
              size={32}
            />
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}

/**
 * Pied de page ajouté par l'API à chaque envoi (identité de l'entreprise et
 * désinscription) : affiché grisé, jamais modifiable. Adresse manquante :
 * signalée à la place, sans être inventée.
 */
export function EmailFooterView({
  style: rawStyle,
  companyName,
  companyAddress,
  addressMissingHint = false,
}) {
  const style = rawStyle?.__resolved ? rawStyle : resolveStyle(rawStyle);
  const name = companyName || "Votre entreprise";
  return (
    <div
      style={{
        padding: "24px 32px 8px",
        textAlign: "center",
        fontSize: 12,
        lineHeight: 1.6,
        color: style.footerTextColor,
        fontFamily: fontStack(style.fontFamily),
      }}
    >
      <div style={{ fontWeight: 700 }}>{name}</div>
      {companyAddress ? (
        <div>{companyAddress}</div>
      ) : addressMissingHint ? (
        <div style={{ color: "#b45309" }}>
          Adresse de l&apos;entreprise à compléter
        </div>
      ) : null}
      <div style={{ marginTop: 8 }}>
        Vous recevez cet e-mail car vous êtes en relation avec {name}.
      </div>
      <div style={{ marginTop: 4, textDecoration: "underline" }}>
        Se désinscrire
      </div>
    </div>
  );
}

/** Style général complet, marqué pour ne pas être recalculé bloc par bloc. */
export const resolvedStyle = (style) => ({
  ...resolveStyle(style),
  __resolved: true,
});

/**
 * Fond et cadre de l'e-mail (largeur, arrondi, police, couleurs). Les
 * blocs vont dans `children`, le pied dans `footer`.
 */
export function EmailShell({
  style: rawStyle,
  children,
  footer,
  className = "",
  frameClassName = "",
  outerPadding = "32px 16px",
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
      {footer}
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
