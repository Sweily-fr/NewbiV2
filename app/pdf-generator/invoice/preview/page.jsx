"use client";

import { useEffect, useRef, useState } from "react";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import { domToJpeg } from "modern-screenshot";

/**
 * PDF Preview Generator Page
 *
 * Unlike /pdf-generator/invoice/[id] which fetches from DB,
 * this page reads invoice data from window.__PREVIEW_DATA
 * injected by Puppeteer via page.evaluateOnNewDocument().
 *
 * Used by POST /api/invoices/preview-pdf endpoint.
 */
export default function PDFPreviewPage() {
  const [invoiceData, setInvoiceData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [isVisual, setIsVisual] = useState(false);
  const componentRef = useRef(null);

  useEffect(() => {
    async function init() {
      try {
        // Read data injected by Puppeteer
        const data = window.__PREVIEW_DATA;
        if (!data) {
          console.error("❌ No __PREVIEW_DATA found on window");
          setStatus("error");
          window.pdfGenerationResult = { error: "No preview data provided" };
          return;
        }

        console.log("✅ Preview data loaded");
        setInvoiceData(data);
        setStatus("ready");

        // Visual mode : détecté via l'URL (?mode=visual) OU l'injection JS.
        // L'URL est FIABLE (dispo immédiatement), contrairement à
        // window.__PREVIEW_MODE injecté par la WebView mobile qui, sur iOS
        // WKWebView, n'est parfois pas prêt quand ce code s'exécute → la page
        // basculait alors en mode PDF (A4 + wrapper blanc plein écran).
        const urlMode =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("mode")
            : null;
        const isVisualMode =
          urlMode === "visual" || window.__PREVIEW_MODE === "visual";
        if (isVisualMode) {
          console.log("👁️ Visual mode — skipping PDF generation");
          setIsVisual(true);
          return;
        }

        // PDF mode: wait for render then generate
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await generatePDF();
      } catch (error) {
        console.error("❌ Error:", error);
        setStatus("error");
        window.pdfGenerationResult = { error: error.message };
      }
    }

    init();
  }, []);

  async function generatePDF() {
    try {
      if (!componentRef.current) {
        throw new Error("Component ref not found");
      }

      // Wait for images
      const images = componentRef.current.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(() => resolve(), 3000);
          });
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Capture with modern-screenshot
      const dataUrl = await domToJpeg(componentRef.current, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        width: 794,
        scale: 2,
        fetch: {
          requestInit: { mode: "cors", credentials: "omit" },
        },
      });

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });

      // Create PDF
      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgHeightMM = (img.height * pdfWidth) / img.width;

      if (imgHeightMM <= pdfHeight + 1) {
        // Single page
        pdf.addImage(
          dataUrl,
          "JPEG",
          0,
          0,
          pdfWidth,
          imgHeightMM,
          undefined,
          "FAST",
        );
      } else {
        // Multi-page (same logic as [id] page)
        const footerElement = componentRef.current.querySelector(
          '[data-pdf-section="footer"]',
        );
        let footerHeight = 0;
        let footerPositionY = img.height;
        let footerBgColor = "rgb(232, 232, 232)";

        if (footerElement) {
          const containerRect = componentRef.current.getBoundingClientRect();
          const footerRect = footerElement.getBoundingClientRect();
          footerHeight = footerRect.height * 2;
          footerPositionY = (footerRect.top - containerRect.top) * 2;
        }

        const colorCanvas = document.createElement("canvas");
        colorCanvas.width = img.width;
        colorCanvas.height = img.height;
        const colorCtx = colorCanvas.getContext("2d");
        colorCtx.drawImage(img, 0, 0);

        if (footerPositionY < img.height) {
          const sampleY = Math.min(footerPositionY + 20, img.height - 1);
          const pixelData = colorCtx.getImageData(50, sampleY, 1, 1).data;
          footerBgColor = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
        }

        const paginationBannerHeightMM = 12;
        const paginationBannerHeightPx =
          paginationBannerHeightMM * (img.width / pdfWidth);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const pixelsPerMM = img.width / pdfWidth;
        const pageHeightPixels = pdfHeight * pixelsPerMM;
        canvas.width = img.width;
        canvas.height = pageHeightPixels;

        let currentY = 0;
        let pageNumber = 0;
        const pages = [];

        while (currentY < img.height) {
          let targetY = currentY + pageHeightPixels;
          if (targetY > img.height) targetY = img.height;
          const isLastPage = targetY >= img.height;

          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (isLastPage && footerElement && footerHeight > 0) {
            const topMarginPx = pageNumber > 0 ? 15 * pixelsPerMM : 0;
            const contentWithoutFooter = footerPositionY - currentY;
            if (contentWithoutFooter > 0) {
              ctx.drawImage(
                img,
                0,
                currentY,
                canvas.width,
                contentWithoutFooter,
                0,
                topMarginPx,
                canvas.width,
                contentWithoutFooter,
              );
            }
            ctx.fillStyle = footerBgColor;
            ctx.fillRect(
              0,
              pageHeightPixels - paginationBannerHeightPx,
              canvas.width,
              paginationBannerHeightPx,
            );
            const footerDestY =
              pageHeightPixels - footerHeight - paginationBannerHeightPx;
            ctx.drawImage(
              img,
              0,
              footerPositionY,
              canvas.width,
              footerHeight,
              0,
              footerDestY,
              canvas.width,
              footerHeight,
            );
          } else {
            const topMarginPx = pageNumber > 0 ? 15 * pixelsPerMM : 0;
            const availableContentHeight =
              pageHeightPixels - paginationBannerHeightPx - topMarginPx;
            let contentToDraw = availableContentHeight;
            if (footerElement && footerPositionY > 0) {
              const maxContentY = footerPositionY - 2;
              if (currentY + contentToDraw > maxContentY) {
                contentToDraw = Math.max(0, maxContentY - currentY);
              }
            }
            if (contentToDraw > 0) {
              ctx.drawImage(
                img,
                0,
                currentY,
                canvas.width,
                contentToDraw,
                0,
                topMarginPx,
                canvas.width,
                contentToDraw,
              );
            }
            ctx.fillStyle = footerBgColor;
            ctx.fillRect(
              0,
              pageHeightPixels - paginationBannerHeightPx,
              canvas.width,
              paginationBannerHeightPx,
            );
          }

          pages.push({
            imageData: canvas.toDataURL("image/jpeg", 0.95),
            heightMM: pdfHeight,
            isLastPage,
          });

          if (isLastPage) {
            currentY = targetY;
          } else {
            const availH = pageHeightPixels - paginationBannerHeightPx;
            currentY =
              footerElement && currentY + availH > footerPositionY
                ? footerPositionY
                : currentY + availH;
          }
          pageNumber++;
          if (pageNumber > 50) break;
        }

        pages.forEach((page, index) => {
          if (index > 0) pdf.addPage();
          pdf.addImage(
            page.imageData,
            "JPEG",
            0,
            0,
            pdfWidth,
            page.heightMM,
            undefined,
            "FAST",
          );
          pdf.setFontSize(9);
          pdf.setTextColor(80, 80, 80);
          const pageText = `Page ${index + 1}/${pages.length}`;
          pdf.text(
            pageText,
            pdfWidth - pdf.getTextWidth(pageText) - 10,
            pdfHeight - 4,
          );
        });
      }

      const arrayBuffer = pdf.output("arraybuffer");
      window.pdfGenerationResult = {
        success: true,
        buffer: Array.from(new Uint8Array(arrayBuffer)),
      };
      setStatus("complete");
    } catch (error) {
      console.error("PDF generation error:", error);
      window.pdfGenerationResult = { error: error.message };
      setStatus("error");
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-red-600">Erreur de génération</p>
      </div>
    );
  }

  return (
    <div
      className={
        // Mode visuel (preview mobile WebView) : fond NOIR opaque plein écran.
        // La WebView de l'app (app-newbi) force parfois `body{background:#fff}`
        // (bundle non rechargé), ce qui laissait une bande blanche sous le footer.
        // Un wrapper bg-black min-h-screen RECOUVRE ce body blanc → le rendu ne
        // dépend plus de l'app : noir sous la facture, comme le PDF R2.
        // Seule la facture (UniversalPreviewPDF) reste blanche.
        isVisual ? "bg-black min-h-screen" : "bg-white min-h-screen p-4"
      }
    >
      <div
        ref={componentRef}
        style={
          isVisual
            ? {
                // PAS de fond blanc ici : le wrapper peut être un peu plus haut
                // que le document (hauteur calculée), et son blanc dépassait sous
                // le footer. Transparent → cette zone montre le fond noir du modal
                // (comme le PDF). Seule la facture (UniversalPreviewPDF) reste blanche.
                width: "100%",
                maxWidth: "794px",
                margin: "0 auto",
              }
            : { width: "794px", backgroundColor: "#ffffff", margin: "0 auto" }
        }
      >
        {invoiceData && (
          <UniversalPreviewPDF
            data={invoiceData}
            type="invoice"
            forPDF={!isVisual}
            isMobile={isVisual}
          />
        )}
      </div>
    </div>
  );
}
