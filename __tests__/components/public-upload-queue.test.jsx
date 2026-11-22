/**
 * File des envois d'un client (lien client des documents partagés) :
 * contrôle avant l'envoi, trois envois à la fois, progression, refus de
 * l'API, relecture de la page après chaque dépôt ou nouvelle version, nom
 * choisi pour une nouvelle version, encart refermé seul après succès.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import {
  PANEL_CLOSE_DELAY,
  UploadPanel,
  useUploadQueue,
} from "@/app/public/documents/[token]/components/upload-queue";

// Envoi simulé : chaque appel attend que le test le termine
function fakeSend() {
  const calls = [];
  const send = vi.fn(
    (url, file, onProgress, method, fields) =>
      new Promise((resolve, reject) => {
        calls.push({ url, file, onProgress, method, fields, resolve, reject });
      }),
  );
  return { send, calls };
}

afterEach(() => {
  vi.useRealTimers();
});

let queue;
function Harness({ send, onUploaded }) {
  queue = useUploadQueue({
    uploadUrl: (folderId) => `/depot/${folderId}`,
    replaceUrl: (documentId) => `/version/${documentId}`,
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
    expect(calls[0].method).toBe("POST");
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

  it("envoie une nouvelle version d'un document en PUT", async () => {
    const { send, calls } = fakeSend();
    const onUploaded = vi.fn();
    render(<Harness send={send} onUploaded={onUploaded} />);
    act(() =>
      queue.replace(file("lettre-v2.pdf"), { id: "d3", name: "lettre.pdf" }),
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ url: "/version/d3", method: "PUT" });
    // Sans nom choisi, rien d'autre que le fichier : l'API garde le nom
    expect(calls[0].fields).toBeUndefined();
    expect(screen.getByText("Nouvelle version de « lettre.pdf »")).toBeTruthy();
    await act(async () => calls[0].resolve({ id: "d3" }));
    expect(onUploaded).toHaveBeenCalledTimes(1);
  });

  it("envoie avec la nouvelle version le nom choisi par le visiteur", () => {
    const { send, calls } = fakeSend();
    render(<Harness send={send} />);
    act(() =>
      queue.replace(
        file("Lettre signée.pdf"),
        { id: "d3", name: "lettre.pdf" },
        "Lettre signée.pdf",
      ),
    );
    expect(calls[0]).toMatchObject({
      url: "/version/d3",
      method: "PUT",
      fields: { name: "Lettre signée.pdf" },
    });
  });

  it("refuse d'avance une nouvelle version d'un format non accepté", () => {
    const { send } = fakeSend();
    render(<Harness send={send} />);
    act(() => queue.replace(file("outil.exe"), { id: "d3", name: "a.pdf" }));
    expect(send).not.toHaveBeenCalled();
    expect(screen.getByText(/Format non accepté/)).toBeTruthy();
  });
});

describe("Encart des dépôts", () => {
  const panel = () => screen.queryByRole("region", { name: "Dépôts" });

  it("se referme seul peu après des envois tous réussis", async () => {
    vi.useFakeTimers();
    const { send, calls } = fakeSend();
    render(<Harness send={send} />);
    act(() => queue.add([file("a.pdf")], folder));
    await act(async () => calls[0].resolve({}));
    expect(screen.getByText("1 document déposé")).toBeTruthy();

    act(() => vi.advanceTimersByTime(PANEL_CLOSE_DELAY - 1));
    expect(panel()).toBeTruthy();
    act(() => vi.advanceTimersByTime(1));
    expect(panel()).toBeNull();
  });

  it("un nouvel envoi repousse la fermeture à sa propre fin", async () => {
    vi.useFakeTimers();
    const { send, calls } = fakeSend();
    render(<Harness send={send} />);
    act(() => queue.add([file("a.pdf")], folder));
    await act(async () => calls[0].resolve({}));
    act(() => vi.advanceTimersByTime(PANEL_CLOSE_DELAY - 1000));

    // Encore un envoi en cours au moment prévu : l'encart reste
    act(() => queue.add([file("b.pdf")], folder));
    act(() => vi.advanceTimersByTime(2000));
    expect(panel()).toBeTruthy();

    await act(async () => calls[1].resolve({}));
    expect(screen.getByText("2 documents déposés")).toBeTruthy();
    act(() => vi.advanceTimersByTime(PANEL_CLOSE_DELAY));
    expect(panel()).toBeNull();
  });

  it("un refus reste affiché jusqu'à ce que le visiteur ferme l'encart", async () => {
    vi.useFakeTimers();
    const { send, calls } = fakeSend();
    render(<Harness send={send} />);
    act(() => queue.add([file("a.pdf"), file("b.pdf")], folder));
    await act(async () => {
      calls[0].resolve({});
      calls[1].reject(new Error("Le dépôt a échoué."));
    });
    act(() => vi.advanceTimersByTime(PANEL_CLOSE_DELAY * 3));
    expect(panel()).toBeTruthy();
    expect(screen.getByText("1 déposé, 1 refusé")).toBeTruthy();
  });
});
