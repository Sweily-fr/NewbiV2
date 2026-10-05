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
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        data-pdf-item-image
        style={{
          width: "52px",
          height: "52px",
          objectFit: "cover",
          flexShrink: 0,
          border: "1px solid #E6E6E6",
          borderRadius: "6px",
          boxSizing: "border-box",
        }}
      />
      <div style={{ flex: 1, minWidth: 0, paddingTop: "2px" }}>{children}</div>
    </div>
  );
}
