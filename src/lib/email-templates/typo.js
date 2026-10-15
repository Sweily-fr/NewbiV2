// Typographie des e-mails, même règle que `typo()` de newbi-api
// (src/utils/trialEmails.js) : jamais de « : », « ; », « ? » ou « ! » seul en
// début de ligne, jamais de dernier mot seul sur la dernière ligne d'un
// paragraphe. Certaines messageries ignorent l'espace insécable : les mots à
// garder ensemble sont placés dans un `white-space: nowrap`. Seul le texte
// entre les balises est modifié, jamais les attributs.

const NOWRAP = '<span style="white-space: nowrap;">';
// Fin de bloc de texte : le dernier mot y est lié au précédent
const BLOCK_TAG = /^<\/?(p|li|ul|ol|div|h[1-6]|br)\b/i;
const PUNCTUATION_ONLY = /^[\s.,;:!?)»\u00a0]*$/;

export function typo(html) {
  // Ponctuation juste après une mise en forme (« </strong> : ») : elle entre
  // dans la balise, pour pouvoir être collée au dernier mot
  const source = String(html ?? "").replace(
    /(<\/(?:strong|b|em|a|span)>)[ \u00a0]*([:;?!»])/gi,
    "\u00a0$2$1",
  );
  const parts = source.split(/(<[^>]+>)/);
  // Le découpage alterne texte (indices pairs) et balises (indices impairs)
  const isTag = (index) => index % 2 === 1;

  // 1. Ponctuation double rattachée au mot qui précède (espace insécable)
  for (let i = 0; i < parts.length; i += 1) {
    if (!isTag(i)) {
      parts[i] = parts[i].replace(/[ \u00a0]+([:;?!»])/g, "\u00a0$1");
    }
  }

  // 2. Les deux derniers mots de chaque bloc ne se séparent pas
  const tieLastWords = (from, to) => {
    for (let i = to - 1; i >= from; i -= 1) {
      const part = parts[i];
      if (isTag(i) || part.trim() === "") continue;
      const text = part.replace(/\s+$/, "");
      const lastSpace = text.lastIndexOf(" ");
      if (lastSpace > 0) {
        const start = text.lastIndexOf(" ", lastSpace - 1) + 1;
        parts[i] =
          `${text.slice(0, start)}${NOWRAP}${text.slice(start)}</span>${part.slice(text.length)}`;
        return;
      }
      // Ponctuation seule après une balise (« </strong>. ») : mot précédent
      if (!PUNCTUATION_ONLY.test(part)) return;
    }
  };
  let blockStart = 0;
  for (let i = 0; i < parts.length; i += 1) {
    if (isTag(i) && BLOCK_TAG.test(parts[i])) {
      tieLastWords(blockStart, i);
      blockStart = i + 1;
    }
  }
  tieLastWords(blockStart, parts.length);

  // 3. Mot + ponctuation dans un même nowrap : un nowrap qui ne contiendrait
  //    que « &nbsp;: » laisse Chrome couper juste avant
  for (let i = 0; i < parts.length; i += 1) {
    if (!isTag(i)) {
      parts[i] = parts[i]
        .replace(
          /([^ \u00a0<>]*)\u00a0([:;?!»])/g,
          `${NOWRAP}$1&nbsp;$2</span>`,
        )
        .replace(/\u00a0/g, "&nbsp;");
    }
  }
  return parts.join("");
}
