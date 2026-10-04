/**
 * Image d'un produit du catalogue à gauche du libellé d'une ligne, sur
 * l'aperçu et le PDF des documents. Sans image, la cellule est rendue telle
 * quelle (mise en page des documents existants inchangée).
 *
 * Pas de `crossOrigin` ni de `loading="lazy"` : l'affichage écran ne dépend
 * pas des en-têtes CORS de R2 (voir le logo dans UniversalPreviewPDF), les
 * captures refont leur propre fetch (`cache: "reload"`), et le rendu serveur
 * attend le chargement de toutes les images avant `page.pdf()`.
 */
export function ItemCellWithImage({ imageUrl, children }) {
  if (!imageUrl) return children;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        data-pdf-item-image
        style={{
          width: "44px",
          height: "44px",
          objectFit: "contain",
          flexShrink: 0,
          borderRadius: "4px",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
