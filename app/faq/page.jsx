"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import PublicFaq from "@/src/components/public-faq";
import { faqData } from "./faq-data";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import SEOHead from "@/src/components/seo/seo-head";
import { useSEO } from "@/src/hooks/use-seo";
import { Mail, MessageCircle } from "lucide-react";



export default function FAQPage() {
  const seoData = useSEO("faq");

  return (
    <>
      <SEOHead {...seoData} />
      {/* Le bloc FAQPage est rendu par `layout.jsx`, côté serveur, à partir
          des 19 questions de `faq-data.js`. Celui de `seoData` n'en déclarait
          que 3 et, injecté depuis un composant client, n'était de toute façon
          pas servi aux robots. */}
      <div className="min-h-screen bg-white">
        <NewHeroNavbar />

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-white pt-20">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Foire aux questions
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Trouvez rapidement les réponses à vos questions sur Newbi. Notre
                équipe a rassemblé les questions les plus fréquentes pour vous
                aider.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
          <div className="space-y-8">
            {faqData.map((section, sectionIndex) => (
              <Card
                key={sectionIndex}
                className="overflow-hidden gap-0 shadow-none"
              >
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {section.category}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      {section.badge}
                    </Badge>
                  </div>
                  <CardDescription>
                    {section.questions.length} question
                    {section.questions.length > 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <PublicFaq
                    className="rounded-none border-0"
                    defaultOpen={-1}
                    items={section.questions.map((faq) => ({
                      question: faq.q,
                      answer: faq.a,
                    }))}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator className="my-16" />

          {/* Contact Section */}
          <Card className="shadow-none">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Vous avez encore des questions ?
              </h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Notre équipe est là pour vous aider. Rejoignez notre communauté
                ou{" "}
                <a
                  href="mailto:contact@newbi.fr"
                  className="underline underline-offset-4 hover:text-gray-900"
                >
                  contactez-nous directement
                </a>{" "}
                pour obtenir une réponse personnalisée.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <a href="/contact" className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Nous contacter
                  </a>
                </Button>
                <Button asChild variant="outline" target="_blank" size="lg">
                  <a
                    href="https://chat.whatsapp.com/FGLms8EYhpv1o5rkrnIldL?mode=ems_copy_h_t"
                    className="inline-flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Rejoindre WhatsApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Footer7 />
      </div>
    </>
  );
}
