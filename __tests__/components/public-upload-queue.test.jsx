/**
 * File des dépôts d'un client (lien client des documents partagés) :
 * contrôle avant l'envoi, trois envois à la fois, progression, refus de
 * l'API, relecture de la page après chaque dépôt.
 */
import { describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import {
  UploadPanel,
  useUploadQueue,
} from "@/app/public/documents/[token]/components/upload-queue";

// Envoi simulé : chaque appel attend que le test le termine
function fakeSend() {
  const calls = [];
  const send = vi.fn(
    (url, file, onProgress) =>
      new Promise((resolve, reject) => {
        calls.push({ url, file, onProgress, resolve, reject });
      }),
  );
  return { send, calls };
}

let queue;
function Harness({ send, onUploaded }) {
  queue = useUploadQueue({
    uploadUrl: (folderId) => `/depot/${folderId}`,
    onUploaded,
    send,
  });
  return (
    <UploadPanel items={queue.items} busy={queue.busy} onClose={queue.clear} />
  );
}

const file = (name, size = 10) => ({ name, size });
const folder = { id: "racine", name: "Client Dupont" };

describe("useUploadQueue", () => {
  it("contrôle les fichiers avant l'envoi", () => {
    const { send } = fakeSend();
    render(<Harness send={send} />);
    act(() => queue.add([file("outil.exe"), file("vide.pdf", 0)], folder));
    expect(send).not.toHaveBeenCalled();
    expect(screen.getByText(/Format non accepté/)).toBeTruthy();
    expect(screen.getByText("Le fichier est vide.")).toBeTruthy();
    expect(screen.getByText("0 déposé, 2 refusés")).toBeTruthy();
  });

  it("envoie trois fichiers à la fois dans le dossier choisi", async () => {
    const { send, calls } = fakeSend();
    const onUploaded = vi.fn();
    render(<Harness send={send} onUploaded={onUploaded} />);
    act(() =>
      queue.add(
        ["a.pdf", "b.pdf", "c.pdf", "d.pdf"].map((name) => file(name)),
        folder,
      ),
    );
    expect(send).toHaveBeenCalledTimes(3);
    expect(calls[0].url).toBe("/depot/racine");
    expect(screen.getByText("Dépôt en cours (0 sur 4)")).toBeTruthy();

    // Progression affichée, puis le premier arrive : le quatrième part
    act(() => calls[0].onProgress(0.5));
    await act(async () => calls[0].resolve({ id: "n1" }));
    expect(onUploaded).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(4);
    expect(screen.getByText("Dépôt en cours (1 sur 4)")).toBeTruthy();

    await act(async () => {
      calls[1].resolve({});
      calls[2].resolve({});
      calls[3].resolve({});
    });
    expect(screen.getByText("4 documents déposés")).toBeTruthy();
    expect(onUploaded).toHaveBeenCalledTimes(4);
  });

  it("affiche le refus de l'API et laisse fermer l'encart à la fin", async () => {
    const { send, calls } = fakeSend();
    render(<Harness send={send} />);
    act(() => queue.add([file("a.pdf")], folder));
    expect(
      screen.getByRole("button", { name: "Fermer" }).hasAttribute("disabled"),
    ).toBe(true);
    await act(async () =>
      calls[0].reject(
        new Error("L'espace de stockage de votre interlocuteur est plein."),
      ),
    );
    expect(screen.getByText(/stockage de votre interlocuteur/)).toBeTruthy();
    const close = screen.getByRole("button", { name: "Fermer" });
    expect(close.hasAttribute("disabled")).toBe(false);
    act(() => close.click());
    expect(screen.queryByRole("region", { name: "Dépôts" })).toBeNull();
  });
});
