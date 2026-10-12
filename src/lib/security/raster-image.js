/**
 * Type réel d'une image matricielle d'après ses premiers octets (signature),
 * indépendamment du type MIME et du nom annoncés par le client.
 *
 * Seuls PNG, JPEG, GIF et WebP sont reconnus : le SVG (texte pouvant porter
 * du script, des attributs `on*` ou des références externes) n'est jamais
 * accepté par les routes d'upload.
 *
 * @param {Buffer|Uint8Array} buffer
 * @returns {{ mime: string, ext: string } | null}
 */
export function detectRasterImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  const b = buffer;

  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }

  // JPEG : FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  // GIF : "GIF87a" ou "GIF89a"
  const head6 = String.fromCharCode(...b.subarray(0, 6));
  if (head6 === "GIF87a" || head6 === "GIF89a") {
    return { mime: "image/gif", ext: "gif" };
  }

  // WebP : "RIFF" .... "WEBP"
  const riff = String.fromCharCode(...b.subarray(0, 4));
  const webp = String.fromCharCode(...b.subarray(8, 12));
  if (riff === "RIFF" && webp === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
}
