import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TransferOptionsForm from "@/src/components/transfer-options-form";

const baseOptions = {
  expiration: "7d",
  requirePayment: false,
  paymentAmount: 0,
  currency: "EUR",
  paymentDescription: "",
  recipientEmail: "",
  notifyOnDownload: false,
  passwordProtected: false,
  password: "",
  maxDownloads: "",
  customMessage: "",
};

describe("TransferOptionsForm", () => {
  it("renders all sections", () => {
    render(
      <TransferOptionsForm options={baseOptions} onOptionsChange={vi.fn()} />,
    );
    expect(screen.getByText("Durée de validité")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Sécurité")).toBeInTheDocument();
    expect(screen.getByText("Message personnalisé")).toBeInTheDocument();
  });

  it("calls onOptionsChange with new recipientEmail", () => {
    const onChange = vi.fn();
    render(
      <TransferOptionsForm options={baseOptions} onOptionsChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText(/Email du destinataire/i), {
      target: { value: "alice@x.fr" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...baseOptions,
      recipientEmail: "alice@x.fr",
    });
  });

  it("calls onOptionsChange when notifyOnDownload toggles", () => {
    const onChange = vi.fn();
    render(
      <TransferOptionsForm options={baseOptions} onOptionsChange={onChange} />,
    );
    fireEvent.click(screen.getByLabelText(/Notification de téléchargement/i));
    expect(onChange).toHaveBeenLastCalledWith({
      ...baseOptions,
      notifyOnDownload: true,
    });
  });

  it("toggles passwordProtected and shows password field when on", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TransferOptionsForm options={baseOptions} onOptionsChange={onChange} />,
    );
    expect(screen.queryByLabelText(/^Mot de passe$/i)).not.toBeInTheDocument();

    rerender(
      <TransferOptionsForm
        options={{ ...baseOptions, passwordProtected: true }}
        onOptionsChange={onChange}
      />,
    );
    expect(screen.getByLabelText(/^Mot de passe$/i)).toBeInTheDocument();
  });

  it("updates password value", () => {
    const onChange = vi.fn();
    render(
      <TransferOptionsForm
        options={{ ...baseOptions, passwordProtected: true }}
        onOptionsChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText(/^Mot de passe$/i), {
      target: { value: "secret" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      ...baseOptions,
      passwordProtected: true,
      password: "secret",
    });
  });

  it("updates maxDownloads as integer", () => {
    const onChange = vi.fn();
    render(
      <TransferOptionsForm options={baseOptions} onOptionsChange={onChange} />,
    );
    fireEvent.change(
      screen.getByLabelText(/Nombre maximum de téléchargements/i),
      {
        target: { value: "5" },
      },
    );
    expect(onChange).toHaveBeenLastCalledWith({
      ...baseOptions,
      maxDownloads: 5,
    });
  });

  it("renders the maxDownloads field with current value", () => {
    render(
      <TransferOptionsForm
        options={{ ...baseOptions, maxDownloads: 42 }}
        onOptionsChange={vi.fn()}
      />,
    );
    expect(
      screen.getByLabelText(/Nombre maximum de téléchargements/i),
    ).toHaveValue(42);
  });

  it("updates customMessage", () => {
    const onChange = vi.fn();
    render(
      <TransferOptionsForm options={baseOptions} onOptionsChange={onChange} />,
    );
    fireEvent.change(
      screen.getByPlaceholderText(/Ajoutez un message personnalisé/i),
      { target: { value: "Hello team" } },
    );
    expect(onChange).toHaveBeenLastCalledWith({
      ...baseOptions,
      customMessage: "Hello team",
    });
  });
});
