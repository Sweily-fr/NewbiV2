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

// Regroupe une liste de jours par semaine (même logique que la vue)
function buildWeekGroups(daysArr) {
  const groups = [];
  let current = null;
  daysArr.forEach((day, index) => {
    // Numérotation ISO 8601 (firstWeekContainsDate: 4) : sinon fin décembre
    // est numérotée S1 (semaine contenant le 1er janvier suivant)
    const weekNum = getWeek(day, {
      weekStartsOn: 1,
      firstWeekContainsDate: 4,
    });
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

// Regroupe une liste de jours par mois (même logique que la vue en mode année)
function buildMonthGroups(daysArr) {
  const groups = [];
  let current = null;
  daysArr.forEach((day, index) => {
    const monthKey = format(day, "yyyy-MM");
    if (!current || current.monthKey !== monthKey) {
      current = { monthKey, monthStart: day, startIndex: index, count: 0 };
      groups.push(current);
    }
    current.count += 1;
  });
  return groups;
}

// --- Export PDF ---

// Largeur minimale d'un jour (mm) : si la période ne tient pas en A4 paysage
// à cette échelle, la page s'élargit (page unique, hauteur A4) pour rester
// lisible au lieu de compresser la frise.
const MIN_DAY_W = 2;

/**
 * Génère un PDF vectoriel du diagramme de Gantt (une seule page en largeur,
 * hauteur A4 paysage). Format A4 classique quand la période y tient à une
 * échelle lisible ; sinon la page s'élargit (ex. ~80 cm pour une année).
 * L'en-tête s'adapte à l'échelle : semaines + jours quand les jours sont
 * lisibles, mois + semaines pour les longues périodes (trimestre/année).
 * Seules les tâches sont paginées (verticalement).
 * @param {Object} params
 * @param {string} params.boardTitle - Titre du tableau kanban
 * @param {Array} params.tasks - Tâches triées (avec `column` attachée), telles qu'affichées dans la vue
 * @param {Date[]} params.days - Jours de la période affichée
 * @param {Object} [params.membersById] - Noms des membres par id (pour afficher les assignés)
 */
export function exportGanttPDF({ boardTitle, tasks, days, membersById = {} }) {
  const margin = 10;
  const leftColW = 70;
  const timelineX = margin + leftColW;
  // Échelle : remplir l'A4 paysage si possible, sinon élargir la page
  const a4TimelineW = 297 - margin * 2 - leftColW;
  const dayW = Math.max(a4TimelineW / days.length, MIN_DAY_W);
  const timelineW = days.length * dayW;
  const pageW = timelineW + timelineX + margin;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [pageW, 210],
  });
  const pageH = pdf.internal.pageSize.getHeight();
  const rowH = 10; // 2 lignes : titre + dates, puis colonne/assignés/priorité
  const headerRowH = 5.5; // hauteur d'une ligne d'en-tête de timeline
  const headerH = headerRowH * 2; // 2 lignes : semaines+jours ou mois+semaines
  const docHeaderH = 14.5; // hauteur du bloc titre + période (1re page)

  const showDayNumbers = dayW >= 2.8; // en deçà, les numéros sont illisibles
  // Longue période : en-tête mois + semaines (comme la vue en mode année)
  const useMonthHeader = !showDayNumbers;

  const firstDay = startOfDay(days[0]);
  const lastDay = startOfDay(days[days.length - 1]);
  const today = startOfDay(new Date());
  const weekGroups = buildWeekGroups(days);
  const monthGroups = useMonthHeader ? buildMonthGroups(days) : [];

  const border = { r: 226, g: 232, b: 240 }; // slate-200

  // En-tête de document (titre + période) ; retourne le y du corps
  const drawDocHeader = () => {
    let y = margin + 4;
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.text(
      truncateToWidth(
        pdf,
        `${boardTitle || "Tableau"} - Diagramme de Gantt`,
        pageW - margin * 2,
      ),
      margin,
      y,
    );
    y += 5.5;
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    const periodLabel = `${format(firstDay, "d MMMM yyyy", { locale: fr })} - ${format(lastDay, "d MMMM yyyy", { locale: fr })}`;
    pdf.text(
      `Période : ${periodLabel}  ·  Exporté le ${format(new Date(), "d MMMM yyyy", { locale: fr })}  ·  ${tasks.length} tâche${tasks.length > 1 ? "s" : ""}`,
      margin,
      y,
    );
    pdf.setTextColor(0);
    return margin + docHeaderH;
  };

  // Ligne d'en-tête "semaines" ; label complet, sinon numéro seul, sinon rien
  const drawWeeksRow = (yTop) => {
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    weekGroups.forEach((week) => {
      const x = timelineX + week.startIndex * dayW;
      const w = week.count * dayW;
      pdf.rect(x, yTop, w, headerRowH);
      const full = `S${week.weekNum} · ${format(week.weekStart, "d MMM", { locale: fr })} - ${format(week.weekEnd, "d MMM", { locale: fr })}`;
      if (pdf.getTextWidth(full) <= w - 2) {
        pdf.text(full, x + 1, yTop + 3.7);
        return;
      }
      // Cellule étroite : numéro seul en petit, centré (comme la vue année)
      const short = `S${week.weekNum}`;
      pdf.setFontSize(5.5);
      if (pdf.getTextWidth(short) <= w - 0.5) {
        pdf.text(short, x + w / 2, yTop + 3.6, { align: "center" });
      }
      pdf.setFontSize(6.5);
    });
  };

  // Dessine l'en-tête de timeline ; retourne le y du corps
  const drawTimelineHeader = (yTop) => {
    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.setLineWidth(0.2);

    if (useMonthHeader) {
      // Ligne des mois
      pdf.setFontSize(6.5);
      pdf.setTextColor(100, 116, 139);
      monthGroups.forEach((month) => {
        const x = timelineX + month.startIndex * dayW;
        const w = month.count * dayW;
        pdf.rect(x, yTop, w, headerRowH);
        const label = format(month.monthStart, "MMMM", { locale: fr });
        pdf.text(truncateToWidth(pdf, label, w - 2), x + 1, yTop + 3.7);
      });
      // Ligne des semaines
      drawWeeksRow(yTop + headerRowH);
    } else {
      // Ligne des semaines
      drawWeeksRow(yTop);
      // Ligne des jours
      const daysY = yTop + headerRowH;
      pdf.rect(timelineX, daysY, timelineW, headerRowH);
      pdf.setFontSize(6);
      days.forEach((day, i) => {
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
  const drawBodyGrid = (bodyY, bodyH) => {
    // Week-ends (seulement si l'échelle les rend distincts)
    if (dayW >= 1) {
      pdf.setFillColor(241, 245, 249); // slate-100
      days.forEach((day, i) => {
        if (day.getDay() === 0 || day.getDay() === 6) {
          pdf.rect(timelineX + i * dayW, bodyY, dayW, bodyH, "F");
        }
      });
    }

    // Traits verticaux (jours si lisible, sinon semaines)
    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.setLineWidth(0.1);
    if (showDayNumbers) {
      days.forEach((_, i) => {
        const x = timelineX + (i + 1) * dayW;
        pdf.line(x, bodyY, x, bodyY + bodyH);
      });
    } else {
      weekGroups.forEach((week) => {
        const x = timelineX + (week.startIndex + week.count) * dayW;
        pdf.line(x, bodyY, x, bodyY + bodyH);
      });
    }

    // Trait vertical "aujourd'hui"
    if (today >= firstDay && today <= lastDay) {
      const offset = differenceInDays(today, firstDay);
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
    pdf.rect(timelineX, bodyY, timelineW, bodyH);
  };

  // Priorités : mêmes libellés/couleurs que le drapeau de la vue
  const PRIORITY_STYLES = {
    high: { label: "Priorité haute", color: hexToRgb("#ef4444") },
    medium: { label: "Priorité moyenne", color: hexToRgb("#eab308") },
    low: { label: "Priorité basse", color: hexToRgb("#22c55e") },
  };

  // Ligne 2 du libellé : colonne · assignés (ex. "À faire · Jean, Marie +1")
  const taskInfoLabel = (task) => {
    const parts = [];
    if (task.column?.title) parts.push(task.column.title);
    const memberIds = task.assignedMembers || [];
    const names = memberIds
      .map((id) => membersById[String(id)])
      .filter(Boolean);
    const unknown = memberIds.length - names.length;
    if (names.length > 0) {
      parts.push(names.join(", ") + (unknown > 0 ? ` +${unknown}` : ""));
    } else if (memberIds.length > 0) {
      parts.push(
        `${memberIds.length} assigné${memberIds.length > 1 ? "s" : ""}`,
      );
    } else {
      parts.push("Non assignée");
    }
    return parts.join("  ·  ");
  };

  // Dessine une ligne de tâche (libellé sur 2 lignes + barre) à la position y
  const drawTaskRow = (task, y) => {
    const color = hexToRgb(task.column?.color);
    const line1Y = y + 4; // baseline titre + dates
    const line2Y = y + 7.9; // baseline colonne/assignés/priorité

    // Pastille de colonne + titre
    pdf.setFillColor(color.r, color.g, color.b);
    pdf.circle(margin + 3, y + 2.9, 1, "F");
    const dateLabel = formatTaskDateRange(task);
    pdf.setFontSize(6);
    const dateLabelW = dateLabel ? pdf.getTextWidth(dateLabel) : 0;
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42); // slate-900
    const titleMaxW = leftColW - 8 - dateLabelW - 4;
    pdf.text(
      truncateToWidth(pdf, task.title || "", titleMaxW),
      margin + 6,
      line1Y,
    );
    if (dateLabel) {
      pdf.setFontSize(6);
      pdf.setTextColor(100, 116, 139);
      pdf.text(dateLabel, margin + leftColW - 2, line1Y, { align: "right" });
    }

    // Ligne 2 : priorité (à droite, colorée) puis colonne + assignés (à gauche)
    const priority = PRIORITY_STYLES[task.priority?.toLowerCase()];
    pdf.setFontSize(5.5);
    let infoMaxW = leftColW - 8 - 2;
    if (priority) {
      const pw = pdf.getTextWidth(priority.label);
      pdf.setTextColor(priority.color.r, priority.color.g, priority.color.b);
      pdf.text(priority.label, margin + leftColW - 2, line2Y, {
        align: "right",
      });
      infoMaxW -= pw + 3;
    }
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text(
      truncateToWidth(pdf, taskInfoLabel(task), infoMaxW),
      margin + 6,
      line2Y,
    );

    // Séparateur horizontal
    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y + rowH, timelineX + timelineW, y + rowH);

    // Barre (au moins une date requise, comme dans la vue)
    const start = task.startDate ? startOfDay(parseISO(task.startDate)) : null;
    const end = task.dueDate ? startOfDay(parseISO(task.dueDate)) : null;
    if (!start && !end) return;
    const taskStart = start || end;
    const taskEnd = end || start;
    if (taskEnd < firstDay || taskStart > lastDay) return;

    const visStart = Math.max(0, differenceInDays(taskStart, firstDay));
    const visEnd = Math.min(
      days.length - 1,
      differenceInDays(taskEnd, firstDay),
    );
    const inset = Math.min(0.4, dayW / 4); // marge interne réduite aux petites échelles
    const barX = timelineX + visStart * dayW + inset;
    const barW = Math.max((visEnd - visStart + 1) * dayW - inset * 2, 1);
    const barH = 4.6; // barre centrée, plus fine que la ligne double
    const barY = y + (rowH - barH) / 2;

    const fill = tint(color, 0.85);
    pdf.setFillColor(fill.r, fill.g, fill.b);
    pdf.setDrawColor(color.r, color.g, color.b);
    pdf.setLineWidth(0.2);
    const barR = Math.min(1, barW / 2); // rayon borné pour les barres très courtes
    pdf.roundedRect(barX, barY, barW, barH, barR, barR, "FD");

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

  // --- Rendu : toute la période sur chaque page, tâches paginées ---

  const maxRowsFor = (startY) =>
    Math.max(1, Math.floor((pageH - margin - (startY + headerH)) / rowH));

  const pages = [];
  let taskIndex = 0;
  let firstPage = true;
  do {
    const startY = firstPage ? margin + docHeaderH : margin;
    const pageTasks = tasks.slice(taskIndex, taskIndex + maxRowsFor(startY));
    pages.push({ tasks: pageTasks, docHeader: firstPage });
    taskIndex += pageTasks.length;
    firstPage = false;
  } while (taskIndex < tasks.length);

  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) pdf.addPage();
    const y = page.docHeader ? drawDocHeader() : margin;
    const bodyY = drawTimelineHeader(y);
    if (page.tasks.length === 0) {
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text("Aucune tâche", margin, bodyY + 8);
      pdf.setTextColor(0);
      return;
    }
    const bodyH = page.tasks.length * rowH;
    drawBodyGrid(bodyY, bodyH);
    page.tasks.forEach((task, i) => {
      drawTaskRow(task, bodyY + i * rowH);
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
