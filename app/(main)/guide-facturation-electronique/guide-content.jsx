"use client";

import React, { useState } from "react";
import Link from "next/link";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/src/components/ui/select";
import {
  FileText,
  Clock,
  BookOpen,
  Download,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";

const SOURCES = [
  "Recherche Google",
  "Réseaux sociaux",
  "Bouche à oreille",
  "Blog / Article",
  "Publicité",
  "Événement / Salon",
  "Autre",
];

const SOMMAIRE = [
  "Introduction : pourquoi la facturation électronique ?",
  "Le calendrier de la réforme 2026-2027",
  "Qui est concerné ? Obligations par statut",
  "Les formats acceptés : Factur-X, UBL, CII",
  "Le Portail Public de Facturation (PPF)",
  "Les Plateformes de Dématérialisation Partenaires (PDP)",
  "L'annuaire centralisé et le cycle de vie des factures",
  "E-reporting : les transactions concernées",
  "Se préparer concrètement : checklist entreprise",
  "Les sanctions en cas de non-conformité",
];

export default function GuideFacturationElectroniquePage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    source: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!acceptedTerms) {
      setError("Veuillez accepter les conditions pour continuer.");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}api/leads/guide`;
      console.log("[Guide] Envoi vers:", apiUrl, formData);

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          acceptedTerms: true,
        }),
      });

      console.log("[Guide] Réponse:", res.status, res.statusText);
      const data = await res.json();
      console.log("[Guide] Data:", data);

      if (!res.ok || !data.success) {
        setError(data.error || "Une erreur est survenue. Veuillez réessayer.");
        return;
      }

      setIsSuccess(true);
      const link = document.createElement("a");
      link.href = "/guides/guide-facturation-electronique-2026.pdf";
      link.download = "guide-facturation-electronique-2026.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("[Guide] Erreur fetch:", err);
      setError("Impossible de contacter le serveur. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <NewHeroNavbar solidBackground />

      {/* Hero */}
      <section className="pt-32 pb-12 px-5">
        <div className="max-w-[1200px] mx-auto text-center">
          <span className="inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600 mb-6">
            Guide gratuit 2026
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-black mb-4">
            Tout comprendre sur la{" "}
            <span className="text-indigo-600">facturation électronique</span>
          </h1>
          <p className="text-md text-gray-600 max-w-2xl mx-auto">
            Le guide complet pour préparer votre entreprise à la réforme 2026.
            Obligations, calendrier, formats et checklist pratique.
          </p>
        </div>
      </section>

      {/* Main section : Formulaire + Infos */}
      <section className="px-5 pb-20">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Colonne gauche : Formulaire */}
          <div className="order-2 lg:order-1 flex flex-col justify-end">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col h-full">
              <h2 className="text-xl font-medium text-black mb-1">
                Télécharger le guide gratuit
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Remplissez le formulaire pour recevoir votre guide PDF.
              </p>

              {isSuccess ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-[#5b50FF]/10 animate-ping opacity-40" />
                    <div className="relative w-16 h-16 rounded-full bg-[#5b50FF]/5 border-2 border-[#5b50FF] flex items-center justify-center animate-[scaleIn_0.4s_ease-out]">
                      <CheckCircle2 className="w-8 h-8 text-[#5b50FF] animate-[fadeIn_0.5s_ease-out_0.2s_both]" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-black mb-2 animate-[fadeInUp_0.4s_ease-out_0.3s_both]">
                    Téléchargement lancé !
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 animate-[fadeInUp_0.4s_ease-out_0.45s_both]">
                    Si le téléchargement ne démarre pas automatiquement,{" "}
                    <a
                      href="/guides/guide-facturation-electronique-2026.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 underline"
                    >
                      cliquez ici
                    </a>
                    .
                  </p>
                  <div className="animate-[fadeInUp_0.4s_ease-out_0.6s_both]">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5b50FF]/5 border border-[#5b50FF]/20 px-4 py-1.5 text-sm text-[#5b50FF]">
                      <Download className="w-3.5 h-3.5" />
                      Guide PDF en cours de téléchargement
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        required
                        placeholder="Jean"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        required
                        placeholder="Dupont"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="companyName">Nom d'entreprise *</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      required
                      placeholder="Ma Société SAS"
                      value={formData.companyName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="jean@entreprise.fr"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="06 12 34 56 78"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Comment avez-vous connu Newbi ?</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, source: value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez une option" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCES.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-start gap-2 pt-2">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    />
                    <Label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                      J'accepte les{" "}
                      <Link href="/conditions-generales" className="text-indigo-600 underline" target="_blank">
                        CGU/CGV
                      </Link>{" "}
                      et la{" "}
                      <Link href="/politique-de-confidentialite" className="text-indigo-600 underline" target="_blank">
                        politique de confidentialité
                      </Link>{" "}
                      de Newbi. *
                    </Label>
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl px-8 py-3 text-base font-normal bg-[#202020] text-white hover:bg-[#333] transition duration-150 active:scale-[0.98] h-11 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger le guide gratuit
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Colonne droite : Infos guide */}
          <div className="order-1 lg:order-2">
            {/* Meta infos */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">~25 min de lecture</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Format PDF</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">20 pages</span>
              </div>
            </div>

            {/* Sommaire */}
            <div>
              <h3 className="text-lg font-medium text-black mb-4">
                Sommaire du guide
              </h3>
              <ol className="space-y-3">
                {SOMMAIRE.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Pourquoi ce guide */}
            <div className="mt-8 rounded-xl bg-indigo-50/50 border border-indigo-100 p-5">
              <h4 className="text-sm font-medium text-indigo-900 mb-2">
                Pourquoi télécharger ce guide ?
              </h4>
              <ul className="space-y-2">
                {[
                  "Comprendre vos obligations selon votre statut",
                  "Anticiper les échéances de la réforme",
                  "Choisir entre PPF et PDP en toute connaissance",
                  "Éviter les sanctions avec notre checklist pratique",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-indigo-800">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section CTA Newbi */}
      <section className="px-5 pb-20">
        <div className="max-w-[1200px] mx-auto text-center rounded-2xl bg-[#202020] p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-normal text-white mb-4">
            Prêt à passer à la facturation électronique
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-lg mx-auto">
            Newbi est la plateforme tout-en-un pour gérer votre facturation,
            comptabilité et relation client. Conforme à la réforme 2026, simple
            et made in France.
          </p>
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-base font-normal bg-white text-black hover:bg-gray-100 transition duration-150 active:scale-[0.98]"
          >
            Découvrir nos tarifs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
