"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Download, LoaderCircle, FileCheck } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { domToJpeg } from "modern-screenshot";
import jsPDF from "jspdf";
import UniversalPreviewPDF from "./UniversalPreviewPDF";
import { validateFacturXData } from "@/src/utils/facturx-generator";

/**
 * Analyseur de structure PDF pour pagination intelligente
 */
class PDFLayoutAnalyzer {
  constructor(element, pixelsPerMM) {
    this.element = element;
    this.pixelsPerMM = pixelsPerMM;
    this.A4_HEIGHT_MM = 297;
    this.A4_WIDTH_MM = 210;
    this.pageHeightPx = this.A4_HEIGHT_MM * pixelsPerMM;

    // Marges de sécurité optimisées
    this.margins = {
      top: 15 * pixelsPerMM, // 15mm pour le header
      bottom: 20 * pixelsPerMM, // 20mm pour le footer + numéro page
      safe: 8 * pixelsPerMM, // 8mm de zone de sécurité
      itemSpacing: 2 * pixelsPerMM, // 2mm entre les items
    };

    this.availableHeight =
      this.pageHeightPx - this.margins.top - this.margins.bottom;
  }

  /**
   * Analyse détaillée de la structure du document
   */
  analyze() {
    const containerRect = this.element.getBoundingClientRect();

    // Sélectionner tous les éléments avec marqueurs
    const allElements = this.element.querySelectorAll(`
      [data-pdf-section],
      [data-pdf-item],
      [data-no-break],
      [data-pdf-table-header],
      [data-totals-line],
      [data-critical]
    `);

    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 ANALYSE DE STRUCTURE PDF`);
    console.log(`${"=".repeat(60)}`);
    console.log(`Éléments détectés: ${allElements.length}`);

    const elementMap = [];
    const sections = {
      header: null,
      info: null,
      items: [],
      totals: [],
      footer: null,
      tableHeader: null,
    };

    allElements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const relativeTop = (rect.top - containerRect.top) * 2; // *2 pour scale
      const relativeBottom = (rect.bottom - containerRect.top) * 2;
      const height = rect.height * 2;

      const elementInfo = {
        index,
        element: el,
        section: el.dataset.pdfSection || "unknown",
        type: this.getElementType(el),
        top: relativeTop,
        bottom: relativeBottom,
        height: height,
        canBreak: !el.hasAttribute("data-no-break"),
        repeatOnPage: el.hasAttribute("data-repeat-on-page"),
        keepWithNext: el.hasAttribute("data-keep-with-next"),
        isCritical: el.hasAttribute("data-critical"),
        itemIndex: el.dataset.itemIndex ? parseInt(el.dataset.itemIndex) : null,
        totalsType: el.dataset.totalsLine || null,
      };

      elementMap.push(elementInfo);

      // Cataloguer par section
      this.categorizeElement(elementInfo, sections);
    });

    this.logAnalysis(sections);

    return {
      elementMap,
      sections,
      totalHeight: this.element.scrollHeight * 2,
      containerRect,
    };
  }

  /**
   * Déterminer le type précis d'un élément
   */
  getElementType(el) {
    if (el.hasAttribute("data-pdf-table-header")) return "table-header";
    if (el.dataset.pdfSection) return el.dataset.pdfSection;
    if (el.hasAttribute("data-pdf-item")) return "item";
    if (el.hasAttribute("data-totals-line")) return "totals";
    if (el.hasAttribute("data-critical")) return "critical";
    return "content";
  }

  /**
   * Catégoriser les éléments par section
   */
  categorizeElement(elementInfo, sections) {
    switch (elementInfo.section) {
      case "header":
        sections.header = elementInfo;
        break;
      case "info":
        sections.info = elementInfo;
        break;
      case "items":
        if (elementInfo.type === "table-header") {
          sections.tableHeader = elementInfo;
        } else {
          sections.items.push(elementInfo);
        }
        break;
      case "totals":
        sections.totals.push(elementInfo);
        break;
      case "footer":
        sections.footer = elementInfo;
        break;
    }
  }

  /**
   * Logger l'analyse pour debug
   */
  logAnalysis(sections) {
    console.log(`\n📋 SECTIONS IDENTIFIÉES:`);
    console.log(
      `  ├─ Header: ${sections.header ? "✓" : "✗"} ${sections.header ? `(${(sections.header.height / this.pixelsPerMM).toFixed(1)}mm)` : ""}`
    );
    console.log(
      `  ├─ Info client: ${sections.info ? "✓" : "✗"} ${sections.info ? `(${(sections.info.height / this.pixelsPerMM).toFixed(1)}mm)` : ""}`
    );
    console.log(
      `  ├─ Table header: ${sections.tableHeader ? "✓" : "✗"} ${sections.tableHeader ? `(${(sections.tableHeader.height / this.pixelsPerMM).toFixed(1)}mm)` : ""}`
    );
    console.log(`  ├─ Articles: ${sections.items.length} items`);
    console.log(`  ├─ Totaux: ${sections.totals.length} lignes`);
    console.log(
      `  └─ Footer: ${sections.footer ? "✓" : "✗"} ${sections.footer ? `(${(sections.footer.height / this.pixelsPerMM).toFixed(1)}mm)` : ""}`
    );
  }

  /**
   * Calculer les pages avec pagination intelligente
   * Le footer sera toujours placé en bas de la dernière page
   */
  calculatePages(analysis) {
    const { elementMap, sections, totalHeight } = analysis;
    const pages = [];
    let currentY = 0;
    let pageNumber = 1;

    // Hauteurs des sections fixes
    const headerHeight = sections.header?.height || 0;
    const footerHeight = sections.footer?.height || 0;
    const tableHeaderHeight = sections.tableHeader?.height || 0;
    const infoHeight = sections.info?.height || 0;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`📏 CALCUL DE PAGINATION`);
    console.log(`${"=".repeat(60)}`);
    console.log(
      `Hauteur totale document: ${(totalHeight / this.pixelsPerMM).toFixed(0)}mm`
    );
    console.log(`Hauteur page A4: ${this.A4_HEIGHT_MM}mm`);
    console.log(
      `Hauteur utilisable: ${(this.availableHeight / this.pixelsPerMM).toFixed(0)}mm`
    );
    console.log(
      `Hauteur footer: ${(footerHeight / this.pixelsPerMM).toFixed(1)}mm`
    );

    // PAGE 1 : Header + Info + début items + Footer
    console.log(`\n📄 PAGE 1 (première page)`);

    // Réserver le footer sur CHAQUE page (il sera répété)
    let page1UsableHeight =
      this.availableHeight - headerHeight - infoHeight - footerHeight;
    if (sections.tableHeader) {
      page1UsableHeight -= tableHeaderHeight;
    }

    console.log(
      `  Réservé header: ${(headerHeight / this.pixelsPerMM).toFixed(1)}mm`
    );
    console.log(
      `  Réservé info: ${(infoHeight / this.pixelsPerMM).toFixed(1)}mm`
    );
    console.log(
      `  Réservé table header: ${(tableHeaderHeight / this.pixelsPerMM).toFixed(1)}mm`
    );
    console.log(
      `  Réservé footer: ${(footerHeight / this.pixelsPerMM).toFixed(1)}mm`
    );
    console.log(
      `  ➜ Espace items: ${(page1UsableHeight / this.pixelsPerMM).toFixed(1)}mm`
    );

    const page1StartY = 0;
    const page1ContentStart =
      headerHeight +
      infoHeight +
      (sections.tableHeader ? tableHeaderHeight : 0);
    let page1EndY = page1ContentStart + page1UsableHeight;

    // Trouver les items de la page 1
    const { adjustedEndY: page1AdjustedEnd, itemsIncluded: page1Items } =
      this.findItemsForPage(sections.items, page1ContentStart, page1EndY, 1);

    pages.push({
      pageNumber: 1,
      startY: page1StartY,
      endY: page1AdjustedEnd + footerHeight + this.margins.safe,
      contentStartY: page1ContentStart,
      contentEndY: page1AdjustedEnd,
      hasHeader: true,
      hasInfo: true,
      hasTableHeader: !!sections.tableHeader,
      hasFooter: true, // Footer sur chaque page
      items: page1Items,
      totalsIncluded: false,
    });

    console.log(`  ✓ ${page1Items.length} items inclus`);
    console.log(
      `  Fin ajustée: ${(page1AdjustedEnd / this.pixelsPerMM).toFixed(1)}mm`
    );

    currentY = page1AdjustedEnd;

    // PAGES SUIVANTES
    const lastItemIndex =
      page1Items.length > 0
        ? Math.max(...page1Items.map((i) => i.itemIndex))
        : -1;

    const remainingItems = sections.items.filter(
      (item) => item.itemIndex !== null && item.itemIndex > lastItemIndex
    );

    let itemsProcessed = page1Items.length;

    while (
      itemsProcessed < sections.items.length ||
      currentY < totalHeight - footerHeight
    ) {
      pageNumber++;
      console.log(`\n📄 PAGE ${pageNumber}`);

      // Réserver le footer sur TOUTES les pages
      const pageUsableHeight =
        this.availableHeight -
        (sections.tableHeader ? tableHeaderHeight : 0) -
        footerHeight;

      const pageStartY = currentY;
      const pageContentStart =
        currentY + (sections.tableHeader ? tableHeaderHeight : 0);
      let pageEndY = pageContentStart + pageUsableHeight;

      console.log(
        `  Espace disponible: ${(pageUsableHeight / this.pixelsPerMM).toFixed(1)}mm`
      );
      console.log(
        `  Réservé footer: ${(footerHeight / this.pixelsPerMM).toFixed(1)}mm`
      );

      // Items restants pour cette page
      const itemsForThisPage = sections.items.filter(
        (item) =>
          item.itemIndex !== null &&
          item.itemIndex > lastItemIndex &&
          item.top >= pageStartY
      );

      if (itemsForThisPage.length === 0) {
        console.log(
          `  ℹ️ Plus d'items, création de la dernière page avec totaux + footer`
        );

        // Dernière page : totaux + footer
        const totalsHeight = sections.totals.reduce(
          (sum, t) => sum + t.height,
          0
        );

        pages.push({
          pageNumber,
          startY: pageStartY,
          endY: pageStartY + totalsHeight + footerHeight + this.margins.safe,
          contentStartY: pageStartY,
          contentEndY: pageStartY + totalsHeight,
          hasHeader: false,
          hasInfo: false,
          hasTableHeader: false,
          hasFooter: true, // Footer sur la dernière page
          items: [],
          totalsIncluded: true,
          isLastPage: true,
        });

        break;
      }

      const { adjustedEndY: pageAdjustedEnd, itemsIncluded: pageItems } =
        this.findItemsForPage(
          itemsForThisPage,
          pageContentStart,
          pageEndY,
          pageNumber
        );

      // Vérifier si c'est la dernière page (tous les items sont traités)
      const isLastPage =
        itemsProcessed + pageItems.length >= sections.items.length;

      // Calculer l'espace nécessaire pour les totaux
      const totalsHeight = sections.totals.reduce(
        (sum, t) => sum + t.height,
        0
      );
      const spaceAfterItems = pageEndY - pageAdjustedEnd;
      const canIncludeTotals =
        isLastPage && spaceAfterItems >= totalsHeight + this.margins.safe;

      pages.push({
        pageNumber,
        startY: pageStartY,
        endY:
          pageAdjustedEnd +
          footerHeight +
          (canIncludeTotals ? totalsHeight : 0) +
          this.margins.safe,
        contentStartY: pageContentStart,
        contentEndY: pageAdjustedEnd,
        hasHeader: false,
        hasInfo: false,
        hasTableHeader: !!sections.tableHeader,
        hasFooter: true, // Footer sur TOUTES les pages
        items: pageItems,
        totalsIncluded: canIncludeTotals,
        isLastPage: isLastPage,
      });

      console.log(`  ✓ ${pageItems.length} items inclus`);
      console.log(`  ✓ Footer inclus en bas de page`);
      if (canIncludeTotals) {
        console.log(`  ✓ Totaux inclus sur cette page`);
      } else if (isLastPage) {
        console.log(
          `  ⚠️ Dernière page mais pas assez de place pour les totaux`
        );
        console.log(`  ➜ Une page supplémentaire sera créée pour les totaux`);
      }

      itemsProcessed += pageItems.length;
      currentY = pageAdjustedEnd;

      if (canIncludeTotals) break;

      // Si c'est la dernière page mais qu'on n'a pas pu inclure les totaux,
      // créer une page supplémentaire pour eux (avec footer)
      if (isLastPage) {
        pageNumber++;
        console.log(
          `\n📄 PAGE ${pageNumber} (page finale pour totaux + footer)`
        );

        const totalsHeight = sections.totals.reduce(
          (sum, t) => sum + t.height,
          0
        );
        const finalPageStartY = currentY;

        pages.push({
          pageNumber,
          startY: finalPageStartY,
          endY:
            finalPageStartY + totalsHeight + footerHeight + this.margins.safe,
          contentStartY: finalPageStartY,
          contentEndY: finalPageStartY + totalsHeight,
          hasHeader: false,
          hasInfo: false,
          hasTableHeader: false,
          hasFooter: true, // Footer aussi sur la page des totaux
          items: [],
          totalsIncluded: true,
          isLastPage: true,
        });

        console.log(`  ✓ Totaux inclus`);
        console.log(`  ✓ Footer inclus en bas de page`);
        break;
      }

      // Sécurité
      if (pageNumber > 50) {
        console.error("⚠️ Limite de 50 pages atteinte");
        break;
      }
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ PAGINATION TERMINÉE: ${pages.length} page(s)`);
    console.log(`${"=".repeat(60)}\n`);

    return pages;
  }

  /**
   * Trouver les items qui rentrent dans une plage donnée
   */
  findItemsForPage(items, startY, endY, pageNumber) {
    const itemsIncluded = [];
    let adjustedEndY = endY;

    for (const item of items) {
      // L'item commence avant la fin de page prévue
      if (item.top < endY) {
        // Si l'item dépasse, vérifier s'il peut être coupé
        if (item.bottom > endY) {
          if (!item.canBreak) {
            // Ne peut pas être coupé, on s'arrête avant
            console.log(
              `  ⚠️ Item ${item.itemIndex} serait coupé (${(item.height / this.pixelsPerMM).toFixed(1)}mm)`
            );
            adjustedEndY = item.top - this.margins.itemSpacing;
            break;
          }
        }

        itemsIncluded.push(item);

        // Si l'item doit rester avec le suivant
        if (item.keepWithNext) {
          const nextItem = items.find(
            (i) => i.itemIndex === item.itemIndex + 1
          );
          if (nextItem && nextItem.bottom > endY) {
            console.log(
              `  🔗 Item ${item.itemIndex} doit rester avec le suivant`
            );
            adjustedEndY = item.top - this.margins.itemSpacing;
            itemsIncluded.pop();
            break;
          }
        }
      } else {
        // L'item commence après la fin de page
        break;
      }
    }

    if (itemsIncluded.length === 0 && items.length > 0) {
      // Forcer l'inclusion du premier item même s'il dépasse
      console.log(`  ⚠️ Forçage inclusion premier item`);
      itemsIncluded.push(items[0]);
      adjustedEndY = items[0].bottom + this.margins.itemSpacing;
    }

    return { adjustedEndY, itemsIncluded };
  }
}

/**
 * Composant principal de génération PDF
 */
const UniversalPDFDownloaderWithFacturX = ({
  data,
  type = "invoice",
  filename,
  children,
  className = "",
  variant = "outline",
  size = "sm",
  disabled = false,
  enableFacturX = true,
  previousSituationInvoices = [],
  contractTotalTTC = null,
  ...props
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const componentRef = useRef(null);

  const canUseFacturX =
    enableFacturX && (type === "invoice" || type === "creditNote");

  // Attendre que le composant soit prêt
  useEffect(() => {
    if (componentRef.current) {
      const images = componentRef.current.querySelectorAll("img");

      if (images.length === 0) {
        setIsReady(true);
        return;
      }

      const timeout = setTimeout(() => {
        console.log("⏱️ Timeout images, on continue quand même");
        setIsReady(true);
      }, 5000);

      Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => {
              console.log("✓ Image chargée:", img.src.substring(0, 50));
              resolve();
            };
            img.onerror = () => {
              console.warn("⚠️ Erreur image:", img.src.substring(0, 50));
              resolve();
            };
          });
        })
      ).then(() => {
        clearTimeout(timeout);
        setTimeout(() => {
          console.log("✅ Toutes les images chargées");
          setIsReady(true);
        }, 300);
      });

      return () => clearTimeout(timeout);
    }
  }, [data]);

  /**
   * Génération PDF principale
   */
  const handlePDFDownload = async () => {
    setIsGenerating(true);

    try {
      console.log("\n" + "=".repeat(70));
      console.log("🚀 DÉBUT GÉNÉRATION PDF AVEC PAGINATION PRÉCISE");
      console.log("=".repeat(70));

      if (!componentRef.current) {
        throw new Error("Référence du composant non trouvée");
      }

      // Attendre stabilisation du layout
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Fonction helper pour capturer une section
      const captureSection = async (selector, name, options = {}) => {
        const element = componentRef.current.querySelector(selector);
        if (!element) {
          console.log(`⚠️ Section ${name} non trouvée`);
          return null;
        }

        console.log(`📸 Capture de ${name}...`);
        const dataUrl = await domToJpeg(element, {
          quality: 0.98,
          backgroundColor: "#ffffff", // Toujours blanc pour que les rgba transparents soient visibles
          scale: 2,
          pixelRatio: 2,
          ...options.captureOptions,
        });

        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = dataUrl;
        });

        console.log(`✅ ${name} capturé: ${img.width}x${img.height}px`);
        return { dataUrl, img, element };
      };

      // Capturer toutes les sections séparément
      console.log("\n📸 CAPTURE DES SECTIONS SÉPARÉMENT");
      console.log("=".repeat(60));

      const sections = {
        header: await captureSection('[data-pdf-section="header"]', "Header"),
        info: await captureSection('[data-pdf-section="info"]', "Info client"),
        headerNotes: await captureSection(
          '[data-pdf-section="header-notes"]',
          "Note d'en-tête"
        ),
        marketAmount: await captureSection(
          '[data-pdf-section="market-amount"]',
          "Montant du marché"
        ),
        tableHeader: await captureSection(
          "[data-pdf-table-header]",
          "Table header"
        ),
        items: [], // On capturera les items individuellement
        totals: await captureSection('[data-pdf-section="totals"]', "Totaux"),
        vatExemption: await captureSection(
          '[data-pdf-section="vat-exemption"]',
          "Exonération TVA"
        ),
        terms: await captureSection('[data-pdf-section="terms"]', "Conditions"),
        situationRecap: await captureSection(
          '[data-pdf-section="situation-recap"]',
          "Récapitulatif de situation"
        ),
        footer: await captureSection('[data-pdf-section="footer"]', "Footer"),
      };

      // Capturer chaque item individuellement
      console.log("\n📸 Capture des items...");
      const itemElements =
        componentRef.current.querySelectorAll("[data-pdf-item]");
      for (let i = 0; i < itemElements.length; i++) {
        const itemCapture = await captureSection(
          `[data-pdf-item][data-item-index="${i}"]`,
          `Item ${i + 1}`
        );
        if (itemCapture) {
          sections.items.push(itemCapture);
        }
      }

      console.log(`✅ ${sections.items.length} items capturés`);

      // Calculer les dimensions en mm
      const A4_WIDTH_MM = 210;
      const A4_HEIGHT_MM = 297;

      // Utiliser la largeur réelle de la première image capturée pour calculer le ratio
      const referenceImg =
        sections.header?.img || sections.info?.img || sections.items[0]?.img;
      if (!referenceImg) {
        throw new Error("Aucune section capturée pour calculer les dimensions");
      }

      const pixelsPerMM = referenceImg.width / A4_WIDTH_MM;
      console.log(
        `\n📐 Ratio: ${pixelsPerMM.toFixed(2)} pixels/mm (basé sur largeur ${referenceImg.width}px)`
      );

      // Calculer les hauteurs en mm de chaque section
      const getHeightMM = (img) => (img ? img.height / pixelsPerMM : 0);

      const heights = {
        header: getHeightMM(sections.header?.img),
        info: getHeightMM(sections.info?.img),
        headerNotes: getHeightMM(sections.headerNotes?.img),
        marketAmount: getHeightMM(sections.marketAmount?.img),
        tableHeader: getHeightMM(sections.tableHeader?.img),
        items: sections.items.map((item) => getHeightMM(item.img)),
        totals: getHeightMM(sections.totals?.img),
        vatExemption: getHeightMM(sections.vatExemption?.img),
        terms: getHeightMM(sections.terms?.img),
        situationRecap: getHeightMM(sections.situationRecap?.img),
        footer: getHeightMM(sections.footer?.img),
      };

      console.log("\n📏 Hauteurs des sections (mm):");
      console.log(`  Header: ${heights.header.toFixed(1)}mm`);
      console.log(`  Info: ${heights.info.toFixed(1)}mm`);
      console.log(`  Note d'en-tête: ${heights.headerNotes.toFixed(1)}mm`);
      console.log(`  Montant du marché: ${heights.marketAmount.toFixed(1)}mm`);
      console.log(`  Table header: ${heights.tableHeader.toFixed(1)}mm`);
      console.log(`  Items: ${heights.items.length} items`);
      console.log(`  Totaux: ${heights.totals.toFixed(1)}mm`);
      console.log(`  Récapitulatif situation: ${heights.situationRecap.toFixed(1)}mm`);
      console.log(`  Footer: ${heights.footer.toFixed(1)}mm`);

      // Calculer la pagination intelligente
      console.log("\n📄 CALCUL DE LA PAGINATION");
      console.log("=".repeat(60));

      const MARGIN_TOP = 10; // 10mm marge haute
      const MARGIN_BOTTOM = 0; // Pas de marge basse (pagination collée)
      const PAGINATION_HEIGHT = 12; // 12mm pour la bande de pagination (plus de padding)
      const MARGIN_LEFT = 13; // 13mm marge gauche (équivalent px-14)
      const MARGIN_RIGHT = 13; // 13mm marge droite (équivalent px-14)
      const SECTION_SPACING = 2; // 2mm entre les sections
      const CONTENT_WIDTH = A4_WIDTH_MM - MARGIN_LEFT - MARGIN_RIGHT; // Largeur du contenu

      // Hauteur disponible pour les pages (avec pagination réservée)
      const AVAILABLE_HEIGHT = A4_HEIGHT_MM - MARGIN_TOP - PAGINATION_HEIGHT;

      console.log(
        `Hauteur disponible par page: ${AVAILABLE_HEIGHT.toFixed(1)}mm (pagination: ${PAGINATION_HEIGHT}mm)`
      );

      // Construire les pages
      const pages = [];
      let currentPage = {
        number: 1,
        sections: [],
        currentHeight: 0,
      };

      // Page 1 : Header + Info + Note d'en-tête + Montant du marché + Table header + Items
      currentPage.sections.push({
        type: "header",
        data: sections.header,
        height: heights.header,
        spacing: SECTION_SPACING,
      });
      currentPage.currentHeight += heights.header + SECTION_SPACING;

      if (sections.info) {
        currentPage.sections.push({
          type: "info",
          data: sections.info,
          height: heights.info,
          spacing: SECTION_SPACING * 2,
        }); // Double espacement avant les notes
        currentPage.currentHeight += heights.info + SECTION_SPACING * 2;
      }

      if (sections.headerNotes) {
        currentPage.sections.push({
          type: "headerNotes",
          data: sections.headerNotes,
          height: heights.headerNotes,
          spacing: SECTION_SPACING,
        });
        currentPage.currentHeight += heights.headerNotes + SECTION_SPACING;
      }

      if (sections.marketAmount) {
        currentPage.sections.push({
          type: "marketAmount",
          data: sections.marketAmount,
          height: heights.marketAmount,
          spacing: SECTION_SPACING,
        });
        currentPage.currentHeight += heights.marketAmount + SECTION_SPACING;
      }

      if (sections.tableHeader) {
        currentPage.sections.push({
          type: "tableHeader",
          data: sections.tableHeader,
          height: heights.tableHeader,
          spacing: 0,
        });
        currentPage.currentHeight += heights.tableHeader;
      }

      // Ajouter les items un par un avec pagination intelligente
      // Les items utilisent TOUTE la hauteur disponible (pas de réservation footer)
      console.log(`\n📦 Ajout des ${sections.items.length} items...`);
      console.log(
        `   Hauteur disponible pour items: ${AVAILABLE_HEIGHT.toFixed(1)}mm (sans réservation footer)`
      );

      for (let i = 0; i < sections.items.length; i++) {
        const itemHeight = heights.items[i];
        const itemSpacing =
          i < sections.items.length - 1 ? 0.5 : SECTION_SPACING;
        const totalHeight = itemHeight + itemSpacing;

        console.log(
          `  Item ${i + 1}: ${itemHeight.toFixed(1)}mm (page actuelle: ${currentPage.currentHeight.toFixed(1)}mm)`
        );

        // Vérifier si l'item rentre sur la page actuelle (SANS réserver le footer)
        if (currentPage.currentHeight + totalHeight > AVAILABLE_HEIGHT) {
          // Item ne rentre pas, nouvelle page nécessaire
          console.log(`    ➜ Nouvelle page nécessaire`);
          pages.push(currentPage);
          currentPage = {
            number: pages.length + 1,
            sections: [],
            currentHeight: 0,
          };

          // Répéter le table header sur la nouvelle page
          if (sections.tableHeader) {
            currentPage.sections.push({
              type: "tableHeader",
              data: sections.tableHeader,
              height: heights.tableHeader,
              spacing: 0,
            });
            currentPage.currentHeight += heights.tableHeader;
            console.log(
              `    + Table header répété (${heights.tableHeader.toFixed(1)}mm)`
            );
          }
        }

        // Ajouter l'item sur la page actuelle
        currentPage.sections.push({
          type: "item",
          data: sections.items[i],
          height: itemHeight,
          spacing: itemSpacing,
          itemIndex: i,
        });
        currentPage.currentHeight += totalHeight;
        console.log(
          `    ✓ Item ${i + 1} ajouté (hauteur totale page: ${currentPage.currentHeight.toFixed(1)}mm)`
        );
      }

      // Ajouter totaux (ne peut pas être coupé)
      console.log(`\n📊 Ajout des sections finales...`);

      // Calculer la hauteur totale des sections finales
      let totalFinalSectionsHeight = 0;
      if (sections.totals)
        totalFinalSectionsHeight += heights.totals + SECTION_SPACING;
      if (sections.vatExemption)
        totalFinalSectionsHeight += heights.vatExemption + SECTION_SPACING;
      if (sections.terms)
        totalFinalSectionsHeight += heights.terms + SECTION_SPACING;

      // Vérifier si TOUT (sections finales + footer) rentre sur la page actuelle
      const everythingFitsOnCurrentPage =
        currentPage.currentHeight + totalFinalSectionsHeight + heights.footer <=
        AVAILABLE_HEIGHT;

      if (everythingFitsOnCurrentPage) {
        console.log(
          `   ✅ Toutes les sections finales + footer rentrent sur cette page`
        );
        console.log(
          `   ⚠️ Réservation de l'espace du footer (${heights.footer.toFixed(1)}mm)`
        );
      } else {
        console.log(
          `   ⚠️ Les sections finales ne rentrent pas toutes avec le footer`
        );
        console.log(
          `   ➜ Utilisation de toute la hauteur disponible (pas de réservation footer)`
        );
      }

      if (sections.totals) {
        const totalHeight = heights.totals + SECTION_SPACING;

        // Si tout rentre, on vérifie avec le footer, sinon sans
        const spaceCheck = everythingFitsOnCurrentPage
          ? currentPage.currentHeight + totalHeight + heights.footer
          : currentPage.currentHeight + totalHeight;

        if (spaceCheck > AVAILABLE_HEIGHT) {
          console.log(`  Totaux: nouvelle page nécessaire`);
          pages.push(currentPage);
          currentPage = {
            number: pages.length + 1,
            sections: [],
            currentHeight: 0,
          };

          // Recalculer si tout rentre sur la nouvelle page
          const newPageCheck =
            totalFinalSectionsHeight + heights.footer <= AVAILABLE_HEIGHT;
          if (newPageCheck) {
            console.log(
              `   ✅ Sur cette nouvelle page, tout rentre avec le footer`
            );
          }
        }

        currentPage.sections.push({
          type: "totals",
          data: sections.totals,
          height: heights.totals,
          spacing: SECTION_SPACING,
          canBreak: false,
        });
        currentPage.currentHeight += totalHeight;
        console.log(`  ✓ Totaux ajouté (${heights.totals.toFixed(1)}mm)`);
      }

      // Ajouter VAT exemption et terms (peuvent être coupés)
      const breakableSections = [
        {
          type: "vatExemption",
          data: sections.vatExemption,
          height: heights.vatExemption,
        },
        { type: "terms", data: sections.terms, height: heights.terms },
      ].filter((s) => s.data);

      for (const section of breakableSections) {
        // Recalculer si tout rentre maintenant
        const remainingFinalSectionsHeight = breakableSections
          .filter(
            (s) =>
              s.type === section.type ||
              breakableSections.indexOf(s) > breakableSections.indexOf(section)
          )
          .reduce((sum, s) => sum + s.height + SECTION_SPACING, 0);

        const allFitsNow =
          currentPage.currentHeight +
            remainingFinalSectionsHeight +
            heights.footer <=
          AVAILABLE_HEIGHT;

        // Calculer l'espace restant
        const spaceRemaining = allFitsNow
          ? AVAILABLE_HEIGHT - currentPage.currentHeight - heights.footer
          : AVAILABLE_HEIGHT - currentPage.currentHeight;

        console.log(
          `  ${section.type}: ${section.height.toFixed(1)}mm (espace restant: ${spaceRemaining.toFixed(1)}mm)`
        );

        if (section.height <= spaceRemaining) {
          // La section rentre entièrement
          currentPage.sections.push({
            ...section,
            spacing: SECTION_SPACING,
            canBreak: true,
          });
          currentPage.currentHeight += section.height + SECTION_SPACING;
          console.log(`    ✓ Section ajoutée entièrement`);
        } else {
          // La section doit être coupée
          console.log(
            `    ⚠️ Section trop longue, sera coupée sur plusieurs pages`
          );

          // Ajouter la partie qui rentre sur la page actuelle
          if (spaceRemaining > 20) {
            // Au moins 20mm pour que ça vaille le coup
            currentPage.sections.push({
              type: section.type,
              data: section.data,
              height: spaceRemaining - SECTION_SPACING,
              spacing: SECTION_SPACING,
              canBreak: true,
              isPartial: true,
              partialStart: 0,
              partialHeight: spaceRemaining - SECTION_SPACING,
            });
            currentPage.currentHeight += spaceRemaining;
            console.log(
              `    ✓ Partie 1 ajoutée (${(spaceRemaining - SECTION_SPACING).toFixed(1)}mm)`
            );

            // Créer une nouvelle page pour le reste
            pages.push(currentPage);
            currentPage = {
              number: pages.length + 1,
              sections: [],
              currentHeight: 0,
            };

            const remainingHeight =
              section.height - (spaceRemaining - SECTION_SPACING);
            currentPage.sections.push({
              type: section.type,
              data: section.data,
              height: remainingHeight,
              spacing: SECTION_SPACING,
              canBreak: true,
              isPartial: true,
              partialStart: spaceRemaining - SECTION_SPACING,
              partialHeight: remainingHeight,
            });
            currentPage.currentHeight += remainingHeight + SECTION_SPACING;
            console.log(
              `    ✓ Partie 2 ajoutée (${remainingHeight.toFixed(1)}mm)`
            );
          } else {
            // Pas assez de place, mettre toute la section sur la page suivante
            pages.push(currentPage);
            currentPage = {
              number: pages.length + 1,
              sections: [],
              currentHeight: 0,
            };

            currentPage.sections.push({
              ...section,
              spacing: SECTION_SPACING,
              canBreak: true,
            });
            currentPage.currentHeight += section.height + SECTION_SPACING;
            console.log(`    ✓ Section entière sur nouvelle page`);
          }
        }
      }

      // Ajouter le récapitulatif de situation si présent (sur une nouvelle page)
      if (sections.situationRecap && heights.situationRecap > 0) {
        console.log(`\n📊 Ajout du récapitulatif de situation...`);
        
        // Le récapitulatif de situation doit être sur une nouvelle page
        pages.push(currentPage);
        currentPage = {
          number: pages.length + 1,
          sections: [],
          currentHeight: 0,
        };
        
        currentPage.sections.push({
          type: "situationRecap",
          data: sections.situationRecap,
          height: heights.situationRecap,
          spacing: SECTION_SPACING,
          canBreak: false,
        });
        currentPage.currentHeight += heights.situationRecap + SECTION_SPACING;
        console.log(`  ✓ Récapitulatif de situation ajouté (${heights.situationRecap.toFixed(1)}mm)`);
      }

      // Vérifier si le footer rentre sur la page courante
      if (currentPage.currentHeight + heights.footer > AVAILABLE_HEIGHT) {
        // Pas assez de place pour le footer, créer une page dédiée
        console.log(`⚠️ Footer ne rentre pas, création d'une page dédiée`);
        pages.push(currentPage);
        currentPage = {
          number: pages.length + 1,
          sections: [],
          currentHeight: 0,
        };
      }

      // Ajouter la dernière page
      pages.push(currentPage);

      console.log(`✅ ${pages.length} page(s) calculée(s)`);

      // Créer le PDF
      console.log("\n📄 ASSEMBLAGE DU PDF");
      console.log("=".repeat(60));
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
        precision: 16,
      });

      // Générer chaque page en assemblant les sections
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        if (i > 0) {
          pdf.addPage();
        }

        console.log(`\n📄 Page ${page.number}/${pages.length}`);
        let currentY = MARGIN_TOP;

        // Ajouter chaque section de la page avec marges
        for (const section of page.sections) {
          if (!section.data) continue;

          if (section.isPartial) {
            console.log(
              `  + ${section.type} (PARTIEL: ${section.height.toFixed(1)}mm de ${section.partialStart.toFixed(1)}mm à ${(section.partialStart + section.partialHeight).toFixed(1)}mm)`
            );
          } else {
            console.log(
              `  + ${section.type} (${section.height.toFixed(1)}mm + ${section.spacing.toFixed(1)}mm spacing)`
            );
          }

          if (section.isPartial) {
            // Section partielle : utiliser un canvas pour découper
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            const img = section.data.img;
            const startPixels = section.partialStart * pixelsPerMM;
            const heightPixels = section.partialHeight * pixelsPerMM;

            canvas.width = img.width;
            canvas.height = heightPixels;

            // Dessiner la partie de l'image
            ctx.drawImage(
              img,
              0,
              startPixels, // Source x, y
              img.width,
              heightPixels, // Source width, height
              0,
              0, // Dest x, y
              img.width,
              heightPixels // Dest width, height
            );

            const partialDataUrl = canvas.toDataURL("image/jpeg", 0.98);

            pdf.addImage(
              partialDataUrl,
              "JPEG",
              MARGIN_LEFT,
              currentY,
              CONTENT_WIDTH,
              section.height,
              `${section.type}-partial-${i}-${currentY}`,
              "FAST"
            );
          } else {
            // Section complète
            // Le récapitulatif de situation inclut déjà son padding, donc pas de marge supplémentaire
            const isFullWidthSection = section.type === "situationRecap";
            pdf.addImage(
              section.data.dataUrl,
              "JPEG",
              isFullWidthSection ? 0 : MARGIN_LEFT,
              isFullWidthSection ? 0 : currentY,
              isFullWidthSection ? A4_WIDTH_MM : CONTENT_WIDTH,
              section.height,
              `${section.type}-${i}-${currentY}`,
              "FAST"
            );
          }

          // Ajouter une bordure sous chaque item du tableau
          if (section.type === "item") {
            pdf.setDrawColor(204, 204, 204); // #CCCCCC
            pdf.setLineWidth(0.1); // Ligne fine
            pdf.line(
              MARGIN_LEFT,
              currentY + section.height,
              MARGIN_LEFT + CONTENT_WIDTH,
              currentY + section.height
            );
          }

          currentY += section.height + section.spacing;
        }

        // Numéro de page (à droite, avec fond de couleur identique au footer)
        const paginationHeight = 12; // Hauteur de la bande de pagination en mm (avec padding)
        const paginationY = A4_HEIGHT_MM - paginationHeight; // Collée en bas (pas de marge)

        // Ajouter le footer uniquement sur la dernière page (collé à la pagination)
        if (sections.footer && i === pages.length - 1) {
          // Footer collé directement à la pagination (pas d'espace)
          const footerYPosition =
            Math.floor((paginationY - heights.footer) * 100) / 100;

          pdf.addImage(
            sections.footer.dataUrl,
            "JPEG",
            0,
            footerYPosition,
            A4_WIDTH_MM,
            heights.footer,
            `footer-${i}`,
            "FAST"
          );

          console.log(
            `  + Footer collé à la pagination (${footerYPosition.toFixed(2)}mm)`
          );
        }

        // Extraire la couleur du footer depuis data.appearance
        const headerBgColor = data.appearance?.headerBgColor || "#1d1d1b";

        // Convertir la couleur hex en RGB avec opacité 0.1 sur fond blanc
        const hexToRgb = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
              }
            : { r: 29, g: 29, b: 27 };
        };

        const baseColor = hexToRgb(headerBgColor);
        const opacity = 0.1;
        // Appliquer l'opacité sur fond blanc
        const r = Math.round(255 * (1 - opacity) + baseColor.r * opacity);
        const g = Math.round(255 * (1 - opacity) + baseColor.g * opacity);
        const b = Math.round(255 * (1 - opacity) + baseColor.b * opacity);

        // Dessiner le fond de couleur sur toute la largeur (même couleur que le footer)
        pdf.setFillColor(r, g, b);
        pdf.rect(0, paginationY, A4_WIDTH_MM, paginationHeight, "F");

        // Ajouter le texte de pagination avec padding
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100); // Gris foncé pour contraste
        const pageText = `Page ${page.number} / ${pages.length}`;
        const textWidth = pdf.getTextWidth(pageText);
        // Centrer le texte verticalement dans la bande de 8mm
        // Position Y = début de la bande + (hauteur / 2) + ajustement pour baseline du texte
        const textY = paginationY + paginationHeight / 2 + 1.5; // Centré avec padding équilibré
        pdf.text(pageText, A4_WIDTH_MM - textWidth - MARGIN_RIGHT, textY);

        console.log(`  ✅ Page ${page.number} assemblée`);
      }

      // Nom du fichier
      const documentType =
        type === "invoice" ? "facture" : type === "quote" ? "devis" : "avoir";
      const number = data.number || "document";
      const prefix = data.prefix || "";
      const fileName =
        filename ||
        (prefix
          ? `${documentType}_${prefix}-${number}.pdf`
          : `${documentType}_${number}.pdf`);

      console.log(`\n💾 Fichier: ${fileName}`);

      // Intégration Factur-X
      if (canUseFacturX) {
        console.log("\n🔧 Tentative intégration Factur-X...");
        const validation = validateFacturXData(data);

        if (validation.isValid) {
          try {
            const pdfBase64 = btoa(pdf.output());
            const { generateFacturXXML } = await import(
              "@/src/utils/facturx-generator"
            );
            const xmlString = generateFacturXXML(data, type);

            const response = await fetch("/api/generate-facturx", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pdfBase64,
                xmlString,
                invoiceNumber: data.number,
                documentType: type,
              }),
            });

            if (!response.ok) {
              throw new Error(`Erreur serveur: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
              const binaryString = atob(result.pdfBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: "application/pdf" });

              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              console.log("✅ PDF Factur-X téléchargé avec succès");
              toast.success("PDF Factur-X téléchargé", {
                description: `${pages.length} page(s) • PDF/A-3 + XML EN16931`,
                icon: <FileCheck className="h-4 w-4" />,
              });

              return;
            } else {
              throw new Error(result.error);
            }
          } catch (error) {
            console.error("❌ Erreur Factur-X:", error);
            toast.warning("Factur-X non disponible", {
              description: "Téléchargement du PDF standard",
            });
          }
        } else {
          console.warn(
            "⚠️ Validation Factur-X échouée:",
            validation.errors.slice(0, 3)
          );
          toast.info("PDF standard", {
            description: "Données Factur-X incomplètes",
          });
        }
      }

      // Téléchargement PDF standard
      pdf.save(fileName);
      console.log("✅ PDF standard téléchargé");
      toast.success("PDF téléchargé avec succès", {
        description: `${pages.length} page(s) générée(s)`,
      });

      console.log("\n" + "=".repeat(70));
      console.log("✅ GÉNÉRATION TERMINÉE AVEC SUCCÈS");
      console.log("=".repeat(70) + "\n");
    } catch (error) {
      console.error("\n" + "=".repeat(70));
      console.error("❌ ERREUR DE GÉNÉRATION");
      console.error("=".repeat(70));
      console.error(error);
      toast.error("Erreur lors de la génération", {
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (e) => {
    e?.preventDefault();
    if (!isReady) {
      toast.info("Veuillez patienter", {
        description: "Chargement du document...",
      });
      return;
    }
    handlePDFDownload();
  };

  return (
    <>
      {/* Conteneur hors écran pour le rendu */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0",
          width: "794px",
          backgroundColor: "#ffffff",
          zIndex: -1,
        }}
      >
        <div
          ref={componentRef}
          style={{
            position: "relative",
            width: "794px",
            backgroundColor: "#ffffff",
          }}
        >
          <UniversalPreviewPDF
            data={data}
            type={type}
            isMobile={false}
            forPDF={true}
            previousSituationInvoices={previousSituationInvoices}
            contractTotalTTC={contractTotalTTC}
          />
        </div>
      </div>

      {/* Bouton de téléchargement */}
      <Button
        onClick={handleDownload}
        disabled={isGenerating || disabled || !isReady}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 font-normal ${className || ""}`}
        {...props}
      >
        {isGenerating ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {children || "Génération..."}
          </>
        ) : !isReady ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Chargement...
          </>
        ) : (
          <>
            {canUseFacturX ? (
              <Download className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {children || "Télécharger le PDF"}
          </>
        )}
      </Button>
    </>
  );
};

export default UniversalPDFDownloaderWithFacturX;
