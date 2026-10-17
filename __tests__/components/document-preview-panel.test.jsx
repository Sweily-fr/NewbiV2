// Volet d'aperçu des justificatifs rendu dans un tiroir ou un dialogue :
// Échap ne ferme que la couche du dessus (volet, confirmation, liste,
// dialogue, tiroir), et le volet défile au doigt malgré le verrou de
// défilement de son hôte.
import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/src/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { DocumentPreviewPanel } from "@/src/components/document-preview-panel";

const DOCS = [
  {
    url: "https://exemple.test/justificatif.png",
    filename: "justificatif.png",
    mimeType: "image/png",
  },
];

const flush = () => act(async () => {});

// Échap sur l'élément qui a le focus (body à défaut), comme au clavier
async function pressEscape(target = document.activeElement || document.body) {
  fireEvent.keyDown(target, { key: "Escape" });
  await flush();
}

// Fond sombre d'un volet ouvert (le plus récent en dernier)
const backdrops = () =>
  [...document.querySelectorAll("[data-document-preview-panel]")].map(
    (panel) => panel.firstElementChild,
  );

// Tiroir facture d'achat (vaul) ouvert avec son aperçu : corbeille avec
// confirmation, liste (popover) et relance OCR, un dialogue qui a son propre
// aperçu. Chaque fermeture est notée dans `log`.
function PurchaseInvoiceDrawer({ log }) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerPreview, setDrawerPreview] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrPreview, setOcrPreview] = useState(false);
  const closer = (label, setter) => (open) => {
    if (!open) log.push(label);
    setter(open);
  };
  return (
    <Drawer
      open={drawerOpen}
      onOpenChange={closer("tiroir", setDrawerOpen)}
      direction="right"
    >
      <DrawerContent>
        <DrawerTitle>Facture d&apos;achat</DrawerTitle>
        <DrawerDescription>Fiche</DrawerDescription>
        <button type="button" onClick={() => setConfirmOpen(true)}>
          Supprimer
        </button>
        <button type="button" onClick={() => setOcrOpen(true)}>
          Relancer l&apos;OCR
        </button>
        <Popover open={listOpen} onOpenChange={closer("liste", setListOpen)}>
          <PopoverTrigger asChild>
            <button type="button">Catégorie</button>
          </PopoverTrigger>
          <PopoverContent>
            <button type="button">Carburant</button>
          </PopoverContent>
        </Popover>
        <DocumentPreviewPanel
          items={drawerPreview ? DOCS : []}
          onClose={() => closer("volet du tiroir", setDrawerPreview)(false)}
        />
        <AlertDialog
          open={confirmOpen}
          onOpenChange={closer("confirmation", setConfirmOpen)}
        >
          <AlertDialogContent>
            <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
        <Dialog open={ocrOpen} onOpenChange={closer("dialogue", setOcrOpen)}>
          <DialogContent>
            <DialogTitle>Nouvelle analyse OCR</DialogTitle>
            <DialogDescription>Comparaison</DialogDescription>
            <button type="button" onClick={() => setOcrPreview(true)}>
              Voir la facture analysée
            </button>
            <DocumentPreviewPanel
              items={ocrPreview ? DOCS : []}
              zIndex={110}
              onClose={() => closer("volet du dialogue", setOcrPreview)(false)}
            />
          </DialogContent>
        </Dialog>
      </DrawerContent>
    </Drawer>
  );
}

async function renderDrawer() {
  const log = [];
  render(<PurchaseInvoiceDrawer log={log} />);
  await flush();
  return log;
}

describe("DocumentPreviewPanel - Échap", () => {
  it("volet seul : Échap le ferme", async () => {
    const onClose = vi.fn();
    render(<DocumentPreviewPanel items={DOCS} onClose={onClose} />);
    await flush();
    await pressEscape(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("tiroir avec aperçu : Échap ferme le volet, puis le tiroir", async () => {
    const log = await renderDrawer();
    await pressEscape();
    expect(log).toEqual(["volet du tiroir"]);
    await pressEscape();
    expect(log).toEqual(["volet du tiroir", "tiroir"]);
  });

  it("aperçu du tiroir puis relance OCR avec aperçu : un Échap par couche", async () => {
    const log = await renderDrawer();
    fireEvent.click(screen.getByText("Relancer l'OCR"));
    await flush();
    fireEvent.click(screen.getByText("Voir la facture analysée"));
    await flush();

    await pressEscape();
    expect(log).toEqual(["volet du dialogue"]);
    // Le volet du tiroir, caché sous le dialogue, reste ouvert
    await pressEscape();
    expect(log).toEqual(["volet du dialogue", "dialogue"]);
    await pressEscape();
    await pressEscape();
    expect(log).toEqual([
      "volet du dialogue",
      "dialogue",
      "volet du tiroir",
      "tiroir",
    ]);
  });

  it("volet du dialogue fermé d'un clic (focus perdu) : Échap ferme le dialogue", async () => {
    const log = await renderDrawer();
    fireEvent.click(screen.getByText("Relancer l'OCR"));
    await flush();
    fireEvent.click(screen.getByText("Voir la facture analysée"));
    await flush();
    // Un clic sur le fond sombre ne laisse le focus à aucun élément
    document.activeElement?.blur();
    fireEvent.click(backdrops().at(-1));
    await flush();
    expect(log).toEqual(["volet du dialogue"]);

    await pressEscape(document.body);
    expect(log).toEqual(["volet du dialogue", "dialogue"]);
  });

  it("confirmation ouverte par-dessus le volet : Échap la ferme d'abord", async () => {
    const log = await renderDrawer();
    fireEvent.click(screen.getByText("Supprimer"));
    await flush();
    expect(
      document.activeElement?.closest('[role="alertdialog"]'),
    ).toBeTruthy();

    await pressEscape();
    expect(log).toEqual(["confirmation"]);
    await pressEscape();
    await pressEscape();
    expect(log).toEqual(["confirmation", "volet du tiroir", "tiroir"]);
  });

  it("liste ouverte par-dessus le volet : elle se ferme d'abord", async () => {
    const log = await renderDrawer();
    fireEvent.click(screen.getByText("Catégorie"));
    await flush();
    expect(
      document.activeElement?.closest("[data-radix-popper-content-wrapper]"),
    ).toBeTruthy();

    await pressEscape();
    expect(log).toEqual(["liste"]);
    await pressEscape();
    expect(log).toEqual(["liste", "volet du tiroir"]);
  });
});

describe("DocumentPreviewPanel - défilement au doigt", () => {
  const touchMove = (el) => {
    const touch = { clientX: 10, clientY: 10, target: el };
    const event = new TouchEvent("touchmove", {
      bubbles: true,
      cancelable: true,
      touches: [touch],
      changedTouches: [touch],
    });
    el.dispatchEvent(event);
    return event;
  };

  it("le verrou de défilement d'un dialogue n'annule pas le geste dans le volet", async () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>
          <DialogTitle>Nouvelle analyse OCR</DialogTitle>
          <DialogDescription>Comparaison</DialogDescription>
          <DocumentPreviewPanel items={DOCS} onClose={() => {}} />
        </DialogContent>
      </Dialog>,
    );
    await flush();
    const page = document.querySelector("[data-document-preview-panel] img");
    expect(touchMove(page).defaultPrevented).toBe(false);
    // Témoin : hors de la page qui défile, le verrou joue toujours
    expect(touchMove(backdrops()[0]).defaultPrevented).toBe(true);
  });
});
