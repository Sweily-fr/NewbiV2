import { ObjectId } from "mongodb";

/**
 * Couleurs par défaut des documents enregistrées dans l'espace
 * (documentTextColor, invoiceHeaderBgColor...). Elles sont reprises dans
 * l'apparence des nouveaux documents, puis dans les styles du PDF : seules
 * des valeurs de couleur sont acceptées.
 *
 * Formats admis (mêmes règles que l'API) : code hexadécimal, rgb()/rgba()
 * et hsl()/hsla() à valeurs numériques, noms de couleur CSS. Seule une
 * couleur qui CHANGE est contrôlée : un espace existant s'enregistre comme
 * avant si ses couleurs n'ont pas bougé.
 */

const COLOR_FIELD = /^[a-z][A-Za-z]*(?:TextColor|HeaderBgColor)$/;

const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const ALPHA = String.raw`(?:0|1|0?\.\d{1,4}|1\.0{1,4}|\d{1,3}%)`;
const RGB_CHANNEL = String.raw`\d{1,3}(?:\.\d{1,4})?%?`;
const RGB_COLOR = new RegExp(
  String.raw`^rgba?\(\s*${RGB_CHANNEL}\s*,\s*${RGB_CHANNEL}\s*,\s*${RGB_CHANNEL}\s*(?:,\s*${ALPHA}\s*)?\)$`,
  "i",
);
const HSL_COLOR = new RegExp(
  String.raw`^hsla?\(\s*\d{1,3}(?:\.\d{1,4})?(?:deg)?\s*,\s*\d{1,3}(?:\.\d{1,4})?%\s*,\s*\d{1,3}(?:\.\d{1,4})?%\s*(?:,\s*${ALPHA}\s*)?\)$`,
  "i",
);

const NAMED_COLORS = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black
  blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse
  chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan
  darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta
  darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
  darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink
  deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen
  fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey
  honeydew hotpink indianred indigo ivory khaki lavender lavenderblush
  lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow
  lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
  lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime
  limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid
  mediumpurple mediumseagreen mediumslateblue mediumspringgreen
  mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
  navajowhite navy oldlace olive olivedrab orange orangered orchid
  palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff
  peru pink plum powderblue purple rebeccapurple red rosybrown royalblue
  saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue
  slateblue slategray slategrey snow springgreen steelblue tan teal thistle
  tomato turquoise violet wheat white whitesmoke yellow yellowgreen
  transparent`
    .split(/\s+/)
    .filter(Boolean),
);

/** Vrai si la valeur est une couleur admise (valeur vide comprise). */
export function isSafeDocumentColor(value) {
  if (value === undefined || value === null) return true;
  if (typeof value !== "string") return false;
  const color = value.trim();
  if (!color) return true;
  if (color.length > 64) return false;
  return (
    HEX_COLOR.test(color) ||
    RGB_COLOR.test(color) ||
    HSL_COLOR.test(color) ||
    NAMED_COLORS.has(color.toLowerCase())
  );
}

/**
 * Contrôle des couleurs envoyées à `organization.update` (web et mobile).
 *
 * @returns {Promise<{ ok: true } | { ok: false, message: string }>}
 */
export async function checkOrganizationColorsUpdate({
  mongoDb,
  organizationId,
  data,
}) {
  if (!data || typeof data !== "object") return { ok: true };
  const fields = Object.keys(data).filter((key) => COLOR_FIELD.test(key));
  if (!fields.length) return { ok: true };

  let current = null;
  const changed = [];
  for (const field of fields) {
    if (isSafeDocumentColor(data[field])) continue;
    if (current === null) {
      current =
        (await mongoDb
          .collection("organization")
          .findOne(
            { _id: new ObjectId(String(organizationId)) },
            { projection: Object.fromEntries(fields.map((f) => [f, 1])) },
          )) || {};
    }
    if (data[field] !== current[field]) changed.push(field);
  }

  if (changed.length) {
    return {
      ok: false,
      message:
        "Couleur du document invalide : utilisez un code couleur hexadécimal (par exemple #1D1D1B).",
    };
  }
  return { ok: true };
}
