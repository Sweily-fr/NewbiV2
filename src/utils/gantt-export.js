import { jsPDF } from "jspdf";
import {
  format,
  getWeek,
  startOfWeek,
  endOfWeek,
  parseISO,
  startOfDay,
  differenceInDays,
  isSameDay,
} from "date-fns";
import { fr } from "date-fns/locale";

// --- Helpers ---

const PRIMARY = "#5b50ff";

function hexToRgb(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!match) return { r: 148, g: 163, b: 184 }; // slate-400 par défaut
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

// Éclaircit une couleur vers le blanc (factor 0 = couleur pure, 1 = blanc)
function tint({ r, g, b }, factor) {
  return {
    r: Math.round(r + (255 - r) * factor),
    g: Math.round(g + (255 - g) * factor),
    b: Math.round(b + (255 - b) * factor),
  };
}

function truncateToWidth(pdf, text, maxWidth) {
  if (pdf.getTextWidth(text) <= maxWidth) return text;
  let truncated = text;
  while (
    truncated.length > 1 &&
    pdf.getTextWidth(truncated + "...") > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "...";
}

function formatTaskDateRange(task) {
  const start = task.startDate
    ? format(parseISO(task.startDate), "d MMM", { locale: fr })
    : null;
  const end = task.dueDate
    ? format(parseISO(task.dueDate), "d MMM", { locale: fr })
    : null;
  if (start && end) return `${start} - ${end}`;
  if (start) return `Début : ${start}`;
  if (end) return `Fin : ${end}`;
  return "";
}

// Regroupe une liste de jours par semaine (même logique que la vue).
// Les index retournés sont relatifs au segment fourni.
function buildWeekGroups(daysArr) {
  const groups = [];
  let current = null;
  daysArr.forEach((day, index) => {
    const weekNum = getWeek(day, { weekStartsOn: 1 });
    if (!current || current.weekNum !== weekNum) {
      current = {
        weekNum,
        weekStart: startOfWeek(day, { weekStartsOn: 1 }),
        weekEnd: endOfWeek(day, { weekStartsOn: 1 }),
        startIndex: index,
        count: 0,
      };
      groups.push(current);
    }
    current.count += 1;
  });
  return groups;
}

// --- Export PDF ---

// Largeur minimale d'un jour (mm) en deçà de laquelle la frise devient illisible.
// Si la période ne tient pas à cette échelle, on la pagine horizontalement.
const MIN_DAY_W = 3.5;

/**
 * Génère un PDF vectoriel du diagramme de Gantt (A4 paysage, paginé).
 * Les périodes longues (ex. une année) sont découpées en plusieurs pages
 * dans le temps (pagination horizontale) afin de rester lisibles.
 * @param {Object} params
 * @param {string} params.boardTitle - Titre du tableau kanban
 * @param {Array} params.tasks - Tâches triées (avec `column` attachée), telles qu'affichées dans la vue
 * @param {Date[]} params.days - Jours de la période affichée
 */
export function exportGanttPDF({ boardTitle, tasks, days }) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const leftColW = 70;
  const timelineX = margin + leftColW;
  const timelineW = pageW - margin - timelineX;
  const rowH = 7;
  const weekRowH = 5.5;
  const dayRowH = 5.5;
  const headerH = weekRowH + dayRowH;
  const docHeaderH = 14.5; // hauteur du bloc titre + période (1re page de chaque segment)

  // Largeur d'un jour : on remplit la page si la période tient à une échelle
  // lisible, sinon on borne à MIN_DAY_W et on pagine la frise horizontalement.
  const dayW = Math.max(timelineW / days.length, MIN_DAY_W);
  const showDayNumbers = dayW >= 2.8;
  const daysPerSegment = Math.max(1, Math.floor(timelineW / dayW));

  const today = startOfDay(new Date());

  // Découpe la période en segments horizontaux (un groupe de pages chacun).
  const segments = [];
  for (let i = 0; i < days.length; i += daysPerSegment) {
    const segDays = days.slice(i, i + daysPerSegment);
    segments.push({
      days: segDays,
      firstDay: startOfDay(segDays[0]),
      lastDay: startOfDay(segDays[segDays.length - 1]),
      width: segDays.length * dayW,
      weekGroups: buildWeekGroups(segDays),
    });
  }

  const border = { r: 226, g: 232, b: 240 }; // slate-200

  // En-tête de document (titre + période du segment) ; retourne le y du corps
  const drawDocHeader = (seg, segIndex) => {
    let y = margin + 4;
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    const titleSuffix =
      segments.length > 1 ? ` (${segIndex + 1}/${segments.length})` : "";
    pdf.text(
      truncateToWidth(
        pdf,
        `${boardTitle || "Tableau"} - Diagramme de Gantt${titleSuffix}`,
        pageW - margin * 2,
      ),
      margin,
      y,
    );
    y += 5.5;
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    const periodLabel = `${format(seg.firstDay, "d MMMM yyyy", { locale: fr })} - ${format(seg.lastDay, "d MMMM yyyy", { locale: fr })}`;
    pdf.text(
      `Période : ${periodLabel}  ·  Exporté le ${format(new Date(), "d MMMM yyyy", { locale: fr })}  ·  ${tasks.length} tâche${tasks.length > 1 ? "s" : ""}`,
      margin,
      y,
    );
    pdf.setTextColor(0);
    return margin + docHeaderH;
  };

  // Dessine l'en-tête de timeline (semaines + jours) ; retourne le y du corps
  const drawTimelineHeader = (seg, yTop) => {
    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.setLineWidth(0.2);

    // Ligne des semaines
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    seg.weekGroups.forEach((week) => {
      const x = timelineX + week.startIndex * dayW;
      const w = week.count * dayW;
      pdf.rect(x, yTop, w, weekRowH);
      const label = `S${week.weekNum} · ${format(week.weekStart, "d MMM", { locale: fr })} - ${format(week.weekEnd, "d MMM", { locale: fr })}`;
      pdf.text(truncateToWidth(pdf, label, w - 2), x + 1, yTop + 3.7);
    });

    // Ligne des jours
    const daysY = yTop + weekRowH;
    pdf.rect(timelineX, daysY, seg.width, dayRowH);
    if (showDayNumbers) {
      pdf.setFontSize(6);
      seg.days.forEach((day, i) => {
        const x = timelineX + i * dayW;
        const isToday = isSameDay(day, today);
        if (isToday) {
          const p = hexToRgb(PRIMARY);
          pdf.setTextColor(p.r, p.g, p.b);
        } else {
          pdf.setTextColor(100, 116, 139);
        }
        pdf.text(format(day, "d"), x + dayW / 2, daysY + 3.8, {
          align: "center",
        });
      });
    }
    pdf.setTextColor(0);
    return yTop + headerH;
  };

  // Dessine le fond du corps : week-ends, traits verticaux, trait "aujourd'hui"
  const drawBodyGrid = (seg, bodyY, bodyH) => {
    // Week-ends
    pdf.setFillColor(241, 245, 249); // slate-100
    seg.days.forEach((day, i) => {
      if (day.getDay() === 0 || day.getDay() === 6) {
        pdf.rect(timelineX + i * dayW, bodyY, dayW, bodyH, "F");
      }
    });

    // Traits verticaux (jours si lisible, sinon semaines)
    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.setLineWidth(0.1);
    if (showDayNumbers) {
      seg.days.forEach((_, i) => {
        const x = timelineX + (i + 1) * dayW;
        pdf.line(x, bodyY, x, bodyY + bodyH);
      });
    } else {
      seg.weekGroups.forEach((week) => {
        const x = timelineX + (week.startIndex + week.count) * dayW;
        pdf.line(x, bodyY, x, bodyY + bodyH);
      });
    }

    // Trait vertical "aujourd'hui"
    if (today >= seg.firstDay && today <= seg.lastDay) {
      const offset = differenceInDays(today, seg.firstDay);
      const x = timelineX + (offset + 0.5) * dayW;
      const p = hexToRgb(PRIMARY);
      pdf.setDrawColor(p.r, p.g, p.b);
      pdf.setLineWidth(0.4);
      pdf.line(x, bodyY, x, bodyY + bodyH);
    }

    // Bordures du bloc
    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.setLineWidth(0.2);
    pdf.rect(margin, bodyY, leftColW, bodyH);
    pdf.rect(timelineX, bodyY, seg.width, bodyH);
  };

  // Dessine une ligne de tâche (libellé + barre) à la position y
  const drawTaskRow = (seg, task, y) => {
    const color = hexToRgb(task.column?.color);

    // Pastille de colonne + titre
    pdf.setFillColor(color.r, color.g, color.b);
    pdf.circle(margin + 3, y + rowH / 2, 1, "F");
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42); // slate-900
    const dateLabel = formatTaskDateRange(task);
    pdf.setFontSize(6);
    const dateLabelW = dateLabel ? pdf.getTextWidth(dateLabel) : 0;
    pdf.setFontSize(7.5);
    const titleMaxW = leftColW - 8 - dateLabelW - 4;
    pdf.text(
      truncateToWidth(pdf, task.title || "", titleMaxW),
      margin + 6,
      y + rowH / 2 + 1,
    );
    if (dateLabel) {
      pdf.setFontSize(6);
      pdf.setTextColor(100, 116, 139);
      pdf.text(dateLabel, margin + leftColW - 2, y + rowH / 2 + 1, {
        align: "right",
      });
    }

    // Séparateur horizontal
    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y + rowH, timelineX + seg.width, y + rowH);

    // Barre (au moins une date requise, comme dans la vue)
    const start = task.startDate ? startOfDay(parseISO(task.startDate)) : null;
    const end = task.dueDate ? startOfDay(parseISO(task.dueDate)) : null;
    if (!start && !end) return;
    const taskStart = start || end;
    const taskEnd = end || start;
    if (taskEnd < seg.firstDay || taskStart > seg.lastDay) return;

    const visStart = Math.max(0, differenceInDays(taskStart, seg.firstDay));
    const visEnd = Math.min(
      seg.days.length - 1,
      differenceInDays(taskEnd, seg.firstDay),
    );
    const barX = timelineX + visStart * dayW + 0.4;
    const barW = Math.max((visEnd - visStart + 1) * dayW - 0.8, 1);
    const barY = y + 1.2;
    const barH = rowH - 2.4;

    const fill = tint(color, 0.85);
    pdf.setFillColor(fill.r, fill.g, fill.b);
    pdf.setDrawColor(color.r, color.g, color.b);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(barX, barY, barW, barH, 1, 1, "FD");

    // Titre dans la barre si la place le permet
    if (barW > 14) {
      pdf.setFontSize(6.5);
      pdf.setTextColor(color.r, color.g, color.b);
      pdf.text(
        truncateToWidth(pdf, task.title || "", barW - 3),
        barX + 1.5,
        barY + barH / 2 + 0.9,
      );
    }
  };

  // --- Rendu ---

  const maxRowsFor = (startY) =>
    Math.max(1, Math.floor((pageH - margin - (startY + headerH)) / rowH));

  // Construit la liste des pages : pour chaque segment temporel, on pagine
  // verticalement les tâches. La 1re page d'un segment porte l'en-tête doc.
  const pages = [];
  segments.forEach((seg, segIndex) => {
    let taskIndex = 0;
    let segmentStart = true;
    do {
      const startY = segmentStart ? margin + docHeaderH : margin;
      const cap = maxRowsFor(startY);
      const pageTasks = tasks.slice(taskIndex, taskIndex + cap);
      pages.push({ seg, segIndex, tasks: pageTasks, docHeader: segmentStart });
      taskIndex += pageTasks.length;
      segmentStart = false;
    } while (taskIndex < tasks.length);
  });

  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) pdf.addPage();
    const y = page.docHeader ? drawDocHeader(page.seg, page.segIndex) : margin;
    const bodyY = drawTimelineHeader(page.seg, y);
    if (page.tasks.length === 0) {
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text("Aucune tâche", margin, bodyY + 8);
      pdf.setTextColor(0);
      return;
    }
    const bodyH = page.tasks.length * rowH;
    drawBodyGrid(page.seg, bodyY, bodyH);
    page.tasks.forEach((task, i) => {
      drawTaskRow(page.seg, task, bodyY + i * rowH);
    });
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
  pdf.save(`gantt_${slug}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
