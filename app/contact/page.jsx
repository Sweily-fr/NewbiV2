"use client";
import React, { useState } from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import SEOHead from "@/src/components/seo/seo-head";
import { JsonLd } from "@/src/components/seo/seo-metadata";
import { useSEO } from "@/src/hooks/use-seo";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const REASONS = [
  "Poser une question sur le produit",
  "Signaler un problème ou un comportement inattendu",
  "Faire une suggestion ou un retour",
];

const INITIAL_FORM = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "", // honeypot anti-spam
};

export default function Contact() {
  const seoData = useSEO("contact", {
    title: "Contactez-nous | Newbi",
    description:
      "Une question, un problème ou une suggestion ? Contactez l'équipe Newbi, nous vous répondons rapidement.",
  });

  const [form, setForm] = useState(INITIAL_FORM);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "L'envoi du message a échoué.");
      }
      setSent(true);
      setForm(INITIAL_FORM);
      toast.success("Message envoyé ! Nous vous répondrons rapidement.");
    } catch (err) {
      toast.error(
        err.message || "L'envoi du message a échoué. Réessayez plus tard.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SEOHead {...seoData} />
      <JsonLd jsonLd={seoData.jsonLd} />
      <div className="font-poppins">
        <NewHeroNavbar />
        <div className="min-h-screen bg-[#FDFDFD] pt-42 pb-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-0">
              {/* Colonne gauche — titre + raisons de contact */}
              <div className="lg:pr-16">
                <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mb-10">
                  Contactez-nous
                </h1>

                <ul className="space-y-5 mb-10">
                  {REASONS.map((reason) => (
                    <li key={reason} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-gray-900" />
                      <span className="text-base sm:text-lg text-gray-800">
                        {reason}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="text-sm text-gray-500">
                  Une question sur nos offres ou nos tarifs ?{" "}
                  <a
                    href="mailto:contact@newbi.fr"
                    className="text-gray-900 underline underline-offset-4 hover:text-gray-600"
                  >
                    Écrivez-nous directement
                  </a>
                </p>
              </div>

              {/* Colonne droite — formulaire */}
              <div className="lg:pl-16 lg:border-l lg:border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-6">
                  Dites-nous comment nous pouvons vous aider
                </h2>

                <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
                  {sent ? (
                    <div className="flex flex-col items-center justify-center text-center py-10">
                      <CheckCircle2 className="h-10 w-10 text-[#5B4FFF] mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Message envoyé !
                      </p>
                      <p className="text-sm text-gray-500 mb-6">
                        Merci de nous avoir contactés. Nous vous répondrons dans
                        les plus brefs délais.
                      </p>
                      <Button variant="outline" onClick={() => setSent(false)}>
                        Envoyer un autre message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Honeypot invisible pour les humains */}
                      <input
                        type="text"
                        name="website"
                        value={form.website}
                        onChange={handleChange("website")}
                        className="hidden"
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="contact-name">Nom</Label>
                          <Input
                            id="contact-name"
                            value={form.name}
                            onChange={handleChange("name")}
                            placeholder="Votre nom"
                            maxLength={200}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-email">Email</Label>
                          <Input
                            id="contact-email"
                            type="email"
                            value={form.email}
                            onChange={handleChange("email")}
                            placeholder="vous@entreprise.fr"
                            maxLength={200}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact-subject">Sujet</Label>
                        <Input
                          id="contact-subject"
                          value={form.subject}
                          onChange={handleChange("subject")}
                          placeholder="En quoi pouvons-nous vous aider ?"
                          maxLength={200}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact-message">Message</Label>
                        <Textarea
                          id="contact-message"
                          value={form.message}
                          onChange={handleChange("message")}
                          placeholder="Décrivez votre demande…"
                          rows={6}
                          maxLength={5000}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={sending}
                      >
                        {sending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Envoi en cours…
                          </>
                        ) : (
                          "Envoyer le message"
                        )}
                      </Button>
                    </form>
                  )}
                </div>

                <p className="text-sm text-gray-500 mt-6">
                  Ou écrivez-nous à{" "}
                  <a
                    href="mailto:contact@newbi.fr"
                    className="text-gray-900 underline underline-offset-4 hover:text-gray-600"
                  >
                    contact@newbi.fr
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer7 />
      </div>
    </>
  );
}
