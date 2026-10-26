import { jsPDF } from "jspdf";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { hexToRgb, tint, truncateToWidth } from "./gantt-export";
import { countHiddenByDay, layoutWeek } from "./kanban-calendar";

const PRIMARY = "#5b50ff";
const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/**
 * Génère un PDF vectoriel du calendrier affiché (A4 paysage) : une grille
 * lundi → dimanche, les tâches posées du début à l'échéance comme à l'écran.
 * Les semaines se partagent la page ; une semaine trop chargée agrandit sa
 * ligne, et les semaines passent à la page suivante si besoin.
 * @param {Object} params
 * @param {string} params.boardTitle - Titre du tableau kanban
 * @param {string} params.periodLabel - Libellé de la période (« octobre 2026 »)
 * @param {"month"|"week"} params.mode - Mode affiché
 * @param {Array<{ start: Date, end: Date, days: Date[] }>} params.weeks - Semaines affichées
 * @param {Array} params.items - Tâches datées ({ task, start, end }), triées comme la vue
 * @param {Function} [params.resolveMemberName] - Nom d'un membre assigné
 */
export function exportCalendarPDF({
  boardTitle,
  periodLabel,
  mode,
  weeks,
  items,
  resolveMemberName = () => null,
}) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const gridW = pageW - margin * 2;
  const colW = gridW / 7;
  const isWeekMode = mode === "week";
  const docHeaderH = 14.5;
  const weekdayH = 6;
  const dayHeaderH = 5;
  const laneH = isWeekMode ? 9 : 5;
  const footerH = 6;
  const border = { r: 226, g: 232, b: 240 }; // slate-200
  const today = new Date();

  const layouts = weeks.map((week) => layoutWeek(week, items));
  const periodStart = weeks[0].start;
  const periodEnd = weeks[weeks.length - 1].end;
  const taskCount = items.filter(
    (item) => item.end >= periodStart && item.start <= periodEnd,
  ).length;

  // Hauteur disponible pour les semaines sur une page
  const bodyHFor = (withDocHeader) =>
    pageH - margin * 2 - footerH - weekdayH - (withDocHeader ? docHeaderH : 0);
  // Une semaine ne dépasse jamais une page : au-delà, « +N » par jour
  const maxLanes = Math.max(
    1,
    Math.floor((bodyHFor(false) - dayHeaderH - 6) / laneH),
  );
  const naturalHeights = layouts.map(
    ({ laneCount }) => dayHeaderH + Math.min(laneCount, maxLanes) * laneH + 2,
  );
  // Tout tient sur la 1re page : les semaines se partagent sa hauteur, les
  // plus chargées gardant la leur (hauteur commune des autres recalculée)
  const firstBodyH = bodyHFor(true);
  const fitsOnePage =
    naturalHeights.reduce((sum, h) => sum + h, 0) <= firstBodyH;
  let fillH = firstBodyH / weeks.length;
  for (let i = 0; fitsOnePage && i < weeks.length; i++) {
    const tall = naturalHeights.filter((h) => h > fillH);
    if (tall.length === weeks.length) break;
    fillH =
      (firstBodyH - tall.reduce((sum, h) => sum + h, 0)) /
      (weeks.length - tall.length);
  }
  const rowHeights = naturalHeights.map((h) =>
    fitsOnePage ? Math.max(h, fillH) : Math.max(h, isWeekMode ? 40 : 24),
  );

  const drawDocHeader = () => {
    let y = margin + 4;
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.text(
      truncateToWidth(
        pdf,
        `${boardTitle || "Tableau"} - Calendrier`,
        pageW - margin * 2,
      ),
      margin,
      y,
    );
    y += 5.5;
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `Période : ${periodLabel}  ·  Exporté le ${format(today, "d MMMM yyyy", { locale: fr })}  ·  ${taskCount} tâche${taskCount > 1 ? "s" : ""}`,
      margin,
      y,
    );
    pdf.setTextColor(0);
    return margin + docHeaderH;
  };

  const drawWeekdays = (y) => {
    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.setLineWidth(0.2);
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    for (let i = 0; i < 7; i++) {
      const x = margin + i * colW;
      pdf.rect(x, y, colW, weekdayH);
      const label = isWeekMode
        ? format(weeks[0].days[i], "EEE d MMM", { locale: fr })
        : WEEKDAY_LABELS[i];
      pdf.text(label, x + 1.5, y + 4);
    }
    pdf.setTextColor(0);
    return y + weekdayH;
  };

  const drawSegment = (segment, rowY) => {
    const { item, startCol, endCol, lane, continuesBefore, continuesAfter } =
      segment;
    const { task } = item;
    const color = hexToRgb(task.column?.color);
    const fill = tint(color, 0.85);
    const inset = 0.6;
    const x = margin + startCol * colW + (continuesBefore ? 0 : inset);
    const w =
      (endCol - startCol + 1) * colW -
      (continuesBefore ? 0 : inset) -
      (continuesAfter ? 0 : inset);
    const y = rowY + dayHeaderH + lane * laneH + 0.4;
    const h = laneH - 0.8;

    pdf.setFillColor(fill.r, fill.g, fill.b);
    pdf.setDrawColor(color.r, color.g, color.b);
    pdf.setLineWidth(0.2);
    if (continuesBefore || continuesAfter) {
      pdf.rect(x, y, w, h, "FD");
    } else {
      pdf.roundedRect(x, y, w, h, 0.8, 0.8, "FD");
    }

    pdf.setFontSize(isWeekMode ? 7 : 6.5);
    pdf.setTextColor(15, 23, 42);
    const title = `${continuesBefore ? "‹ " : ""}${task.title || ""}`;
    pdf.text(
      truncateToWidth(pdf, title, w - 2.5),
      x + 1.2,
      y + (isWeekMode ? 3.4 : h / 2 + 0.9),
    );

    if (isWeekMode) {
      const names = (task.assignedMembers || [])
        .map((member) => resolveMemberName(member))
        .filter(Boolean);
      const info = [task.column?.title, names.join(", ")]
        .filter(Boolean)
        .join("  ·  ");
      pdf.setFontSize(5.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(truncateToWidth(pdf, info, w - 2.5), x + 1.2, y + 6.6);
    }
  };

  const drawWeek = (weekIndex, rowY, rowH) => {
    const week = weeks[weekIndex];
    const { segments, laneCount } = layouts[weekIndex];
    const visibleLanes = laneCount <= maxLanes ? laneCount : maxLanes - 1;

    // Cadres des jours
    week.days.forEach((day, i) => {
      const x = margin + i * colW;
      // Jours des mois voisins : cases vides, comme à l'écran
      const isOutside = day < week.visible.start || day > week.visible.end;
      if (isOutside) {
        pdf.setFillColor(241, 245, 249); // slate-100
        pdf.rect(x, rowY, colW, rowH, "F");
      } else if (i >= 5) {
        pdf.setFillColor(248, 250, 252); // slate-50
        pdf.rect(x, rowY, colW, rowH, "F");
      }
      pdf.setDrawColor(border.r, border.g, border.b);
      pdf.setLineWidth(0.2);
      pdf.rect(x, rowY, colW, rowH);

      if (!isWeekMode && !isOutside) {
        pdf.setFontSize(7);
        if (isSameDay(day, today)) {
          const p = hexToRgb(PRIMARY);
          pdf.setTextColor(p.r, p.g, p.b);
        } else {
          pdf.setTextColor(51, 65, 85);
        }
        const label =
          day.getDate() === 1
            ? format(day, "d MMM", { locale: fr })
            : format(day, "d");
        pdf.text(label, x + 1.5, rowY + 3.6);
      }
    });

    segments
      .filter((segment) => segment.lane < visibleLanes)
      .forEach((segment) => drawSegment(segment, rowY));

    // Tâches qui n'ont pas trouvé de place
    const hiddenByDay = countHiddenByDay(segments, visibleLanes);
    pdf.setFontSize(6);
    pdf.setTextColor(100, 116, 139);
    hiddenByDay.forEach((hidden, i) => {
      if (hidden === 0) return;
      pdf.text(
        `+${hidden} autre${hidden > 1 ? "s" : ""}`,
        margin + i * colW + 1.5,
        rowY + dayHeaderH + visibleLanes * laneH + 3.4,
      );
    });
    pdf.setTextColor(0);
  };

  // --- Rendu : semaines à la suite, nouvelle page quand la place manque ---
  let y = drawWeekdays(drawDocHeader());
  weeks.forEach((_, weekIndex) => {
    const rowH = rowHeights[weekIndex];
    // Tolérance : les hauteurs réparties ne tombent pas juste au centième
    if (y + rowH > pageH - margin - footerH + 0.01 && weekIndex > 0) {
      pdf.addPage();
      y = drawWeekdays(margin);
    }
    drawWeek(weekIndex, y, rowH);
    y += rowH;
  });

  // Numéros de page
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Page ${i}/${pageCount}`, pageW - margin, pageH - 4, {
      align: "right",
    });
  }

  const slug = (boardTitle || "tableau")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  pdf.save(`calendrier_${slug}_${format(today, "yyyy-MM-dd")}.pdf`);
}
