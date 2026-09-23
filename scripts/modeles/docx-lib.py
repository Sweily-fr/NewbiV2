#!/usr/bin/env python3
"""
Générateur de modèles Word (.docx).

textutil (macOS) produit un .docx valide mais perd les tableaux, or un modèle
de facture est essentiellement un tableau. On réutilise donc le squelette
d'archive qu'il génère (Content_Types, rels, theme, docProps : tout ce qui
rend le fichier ouvrable) et on remplace word/document.xml par un corps
WordprocessingML écrit à la main, tables comprises.
"""
import zipfile, shutil, os, sys, re
from xml.sax.saxutils import escape

NS = (
    'xmlns:ve="http://schemas.openxmlformats.org/markup-compatibility/2006" '
    'xmlns:o="urn:schemas-microsoft-com:office:office" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:v="urn:schemas-microsoft-com:vml" '
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
    'xmlns:w10="urn:schemas-microsoft-com:office:word" '
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
)
FONT = '<w:rFonts w:ascii="Helvetica" w:hAnsi="Helvetica" w:cs="Helvetica"/>'


def run(text, *, bold=False, size=20, color=None):
    """Un fragment de texte. `size` en demi-points (20 = 10 pt)."""
    rpr = FONT + f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'
    if bold:
        rpr += "<w:b/>"
    if color:
        rpr += f'<w:color w:val="{color}"/>'
    return (
        f"<w:r><w:rPr>{rpr}</w:rPr>"
        f'<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'
    )


def para(text="", *, bold=False, size=20, after=120, color=None, align=None):
    ppr = f'<w:spacing w:after="{after}"/>'
    if align:
        ppr += f'<w:jc w:val="{align}"/>'
    body = run(text, bold=bold, size=size, color=color) if text else ""
    return f"<w:p><w:pPr>{ppr}</w:pPr>{body}</w:p>"


def heading(text, size=32):
    return para(text, bold=True, size=size, after=200)


def cell(text, *, width, bold=False, size=18, align=None, shade=None):
    tcpr = f'<w:tcW w:w="{width}" w:type="dxa"/>'
    if shade:
        tcpr += f'<w:shd w:val="clear" w:color="auto" w:fill="{shade}"/>'
    tcpr += (
        "<w:tcBorders>"
        '<w:top w:val="single" w:sz="4" w:color="CCCCCC"/>'
        '<w:left w:val="single" w:sz="4" w:color="CCCCCC"/>'
        '<w:bottom w:val="single" w:sz="4" w:color="CCCCCC"/>'
        '<w:right w:val="single" w:sz="4" w:color="CCCCCC"/>'
        "</w:tcBorders>"
    )
    ppr = '<w:spacing w:after="0"/>'
    if align:
        ppr += f'<w:jc w:val="{align}"/>'
    return (
        f"<w:tc><w:tcPr>{tcpr}</w:tcPr>"
        f"<w:p><w:pPr>{ppr}</w:pPr>{run(text, bold=bold, size=size)}</w:p></w:tc>"
    )


def table(rows, widths, *, header=True, aligns=None):
    """rows : liste de listes de chaînes. widths : largeurs en twips."""
    aligns = aligns or [None] * len(widths)
    out = [
        "<w:tbl><w:tblPr>"
        '<w:tblW w:w="0" w:type="auto"/>'
        '<w:tblLayout w:type="fixed"/>'
        "</w:tblPr><w:tblGrid>"
        + "".join(f'<w:gridCol w:w="{w}"/>' for w in widths)
        + "</w:tblGrid>"
    ]
    for i, r in enumerate(rows):
        is_head = header and i == 0
        out.append("<w:tr>")
        for j, c in enumerate(r):
            out.append(
                cell(
                    c,
                    width=widths[j],
                    bold=is_head,
                    align=aligns[j],
                    shade="F2F1FF" if is_head else None,
                )
            )
        out.append("</w:tr>")
    out.append("</w:tbl>")
    # Word exige un paragraphe après un tableau
    out.append(para(after=200))
    return "".join(out)


def build(skeleton, out_path, blocks):
    """Copie le squelette en remplaçant word/document.xml."""
    doc = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f"<w:document {NS}><w:body>"
        + "".join(blocks)
        + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
        '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" '
        'w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>'
        "</w:body></w:document>"
    )
    src = zipfile.ZipFile(skeleton)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        for item in src.namelist():
            if item == "word/document.xml":
                z.writestr(item, doc.encode("utf-8"))
            else:
                z.writestr(item, src.read(item))
    src.close()
    return out_path
