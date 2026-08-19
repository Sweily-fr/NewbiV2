/**
 * Génération PDF vectorielle via Puppeteer page.pdf().
 *
 * Remplace la capture JPEG (domToJpeg + jsPDF, ~288 DPI) faite dans les pages
 * /pdf-generator/* : le texte devient vectoriel (net à tout zoom, sélectionnable,
 * fichiers plus légers). Les pages sont ouvertes en `?mode=print` : elles rendent
 * le document (forPDF, gabarit 794px = 210mm à 96dpi) sans générer le PDF
 * elles-mêmes, et c'est la route API qui appelle page.pdf().
 *
 * Kill-switch : PDF_VECTOR_ENGINE=false rebascule sur l'ancien pipeline raster
 * (les pages /pdf-generator/* conservent leur chemin de capture historique).
 *
 * Pagination : le DOM porte déjà les marqueurs sémantiques (data-no-break,
 * data-pdf-item, thead data-pdf-table-header... cf. MARQUEURS_PAGINATION_PDF.md),
 * exploités ici via une feuille de style injectée. Deux gabarits :
 *  - une page : layout forPDF intact (racine flex min-height 1123px, footer
 *    épinglé en bas par margin-top:auto) → parité visuelle avec le raster ;
 *  - multi-pages : ce gabarit "page unique" est neutralisé (la fragmentation
 *    print de Chromium gère mal les conteneurs flex à hauteur forcée) et le
 *    footer suit le flux ; numérotation "Page x/y" dans la marge basse.
 */

export const VECTOR_PDF_ENABLED = process.env.PDF_VECTOR_ENGINE !== "false";

// Gabarit A4 à 96dpi : 794×1123px = 210×297mm (même base que la capture raster).
const A4_HEIGHT_PX = 1123;

const PRINT_BASE_STYLE = `
  html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  [data-no-break], [data-critical], [data-pdf-item], .no-break { break-inside: avoid !important; page-break-inside: avoid !important; }
  [data-pdf-section="totals"] { break-inside: avoid !important; }
  thead[data-pdf-table-header] { display: table-header-group !important; }
`;

// Voir en-tête : appliqué uniquement quand le contenu dépasse une page.
const PRINT_MULTIPAGE_STYLE = `
  [data-pdf-root] { min-height: 0 !important; display: block !important; }
  [data-pdf-section="footer"] { margin-top: 0 !important; }
`;

// Parité avec la numérotation du pipeline raster : 9pt gris, alignée à droite,
// à ~10mm du bord. Rendue par Chromium dans la marge basse de 12mm.
const FOOTER_TEMPLATE = `
  <div style="width:100%;font-size:9px;color:#505050;font-family:Helvetica,Arial,sans-serif;text-align:right;padding-right:10mm;">
    Page <span class="pageNumber"></span>/<span class="totalPages"></span>
  </div>
`;

/**
 * Génère le PDF vectoriel d'une page /pdf-generator/* déjà chargée en mode print.
 * @param {import("puppeteer-core").Page} page - page Puppeteer après goto()
 * @returns {Promise<Buffer>}
 */
export async function generateVectorPdf(page) {
  // Attendre le rendu du document — ou l'erreur que la page pose sur window
  // (échec de fetch des données) pour ne pas attendre le timeout complet.
  await page.waitForFunction(
    () =>
      window.pdfGenerationResult?.error ||
      document.querySelector("[data-pdf-root]"),
    { timeout: 60000 },
  );
  const pageError = await page.evaluate(
    () => window.pdfGenerationResult?.error || null,
  );
  if (pageError) {
    throw new Error(`Erreur génération PDF: ${pageError}`);
  }

  // Logo et polices : page.pdf() fige la page telle quelle, tout doit être chargé.
  await page.evaluate(async () => {
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
              setTimeout(resolve, 3000);
            }),
      ),
    );
    await document.fonts.ready;
  });

  // page.pdf() capture TOUTE la page, contrairement à l'ancienne capture qui
  // recadrait sur le document : masquer les overlays hors document (bandeau
  // cookies, bannière d'installation d'app, portails/toasts éventuels).
  await page.evaluate(() => {
    const root = document.querySelector("[data-pdf-root]");
    let keep = root;
    while (keep && keep.parentElement !== document.body) {
      keep = keep.parentElement;
    }
    for (const child of Array.from(document.body.children)) {
      if (
        child !== keep &&
        child.tagName !== "SCRIPT" &&
        child.tagName !== "STYLE" &&
        child.tagName !== "LINK"
      ) {
        child.style.display = "none";
      }
    }
  });

  await page.addStyleTag({ content: PRINT_BASE_STYLE });

  const contentHeight = await page.evaluate(() => {
    const root = document.querySelector("[data-pdf-root]");
    return root ? Math.ceil(root.getBoundingClientRect().height) : 0;
  });
  // +2px de tolérance d'arrondi : évite une page 2 blanche sur un document
  // qui fait exactement la hauteur du gabarit.
  const singlePage = contentHeight <= A4_HEIGHT_PX + 2;

  if (!singlePage) {
    await page.addStyleTag({ content: PRINT_MULTIPAGE_STYLE });
  }

  const pdf = await page.pdf({
    width: "794px",
    height: "1123px",
    printBackground: true,
    margin: singlePage
      ? { top: 0, right: 0, bottom: 0, left: 0 }
      : { top: "10mm", right: 0, bottom: "12mm", left: 0 },
    displayHeaderFooter: !singlePage,
    headerTemplate: "<span></span>",
    footerTemplate: FOOTER_TEMPLATE,
    timeout: 60000,
  });

  return Buffer.from(pdf);
}
