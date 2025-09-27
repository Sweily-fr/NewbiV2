"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import HeroHeader from "@/src/components/blocks/hero-header";
import Footer7 from "@/src/components/footer7";
import SEOHead from "@/src/components/seo/seo-head";
import { JsonLd } from "@/src/components/seo/seo-metadata";
import { useSEO } from "@/src/hooks/use-seo";
import { Mail, MessageCircle } from "lucide-react";

const faqData = [
  {
    category: "Questions générales",
    badge: "Essentiel",
    questions: [
      {
        q: "Qu'est-ce que Newbi ?",
        a: "Newbi est une plateforme tout-en-un pour gérer simplement et efficacement votre activité: devis, factures, signature de mail, gestion de tâches en Kanban et transfert de fichiers sécurisé. Notre objectif ? Vous faire gagner du temps du premier contact client jusqu'à l'encaissement."
      },
      {
        q: "À qui s'adresse Newbi ?",
        a: "Newbi est une plateforme pensée pour les indépendants, TPE/PME, agences et associations qui veulent centraliser leurs outils commerciaux et administratifs, sans complexité. Newbi convient aussi aux équipes qui collaborent sur des ventes et des projets."
      },
      {
        q: "Comment créer un compte Newbi et vérifier mon adresse e-mail ?",
        a: "C'est très simple, 3 étapes :\n\n• Cliquez sur 'Inscription' depuis la page d'accueil\n• Renseignez votre mail et un mot de passe robuste\n• Ouvrez l'e-mail de confirmation et cliquez sur 'Vérifier mon adresse'"
      },
      {
        q: "Quelles sont les premières étapes après l'inscription pour être opérationnel rapidement ?",
        a: "Après votre inscription, plusieurs choses sont à réaliser si vous souhaitez être opérationnel.\n\n• Complétez votre catalogue produits:\nCréez vos produits avec leurs tarifs HT/TTC, taux de TVA, unités, remises éventuelles\n\n• Complétez votre annuaire clients:\nAjoutez vos clients (raison sociale, SIREN/SIRET, n°TVA, contacts, adresse de facturation/livraison)\n\nAvec ces données en place, vous pouvez générer vos premiers devis puis les convertir en factures en quelques clics."
      }
    ]
  },
  {
    category: "Tarifs et abonnements",
    badge: "Pricing",
    questions: [
      {
        q: "Quelles formules et quels prix propose Newbi ? Y a-t-il un essai gratuit ?",
        a: "À l'inscription vous bénéficiez de 14 jours gratuits, durant lesquels vous pouvez résilier votre abonnement à tout moment.\n\nEnsuite, les prix sont :\n• Abonnement mensuel: 12,49 € HT / mois\n• Abonnement annuel: 134,89 € HT / an (soit 10% de réduction)\n\nVous pouvez à tout moment changer votre abonnement ou le résilier sans conditions."
      },
      {
        q: "Quels moyens de paiement sont acceptés pour l'abonnement Newbi ?",
        a: "Actuellement, l'abonnement Newbi se règle uniquement par carte bancaire. Il suffit d'enregistrer une carte valide dans votre espace client pour démarrer après les 14 jours d'essai gratuit."
      }
    ]
  },
  {
    category: "Factures",
    badge: "Facturation",
    questions: [
      {
        q: "Comment créer ma première facture avec Newbi ?",
        a: "Avec Newbi, deux façons s'offrent à vous pour créer et éditer vos factures :\n\n• Cliquez sur le bouton créer la facture → l'éditeur de facture s'ouvre. Presque toutes les informations sont déjà préremplies\n• Modifiez au besoin vos conditions de paiement, échéance, remises, notes/mentions légales et numérotation\n• Enregistrez, puis envoyez la facture par e-mail"
      },
      {
        q: "Puis-je personnaliser mes factures ?",
        a: "Oui ! Le logo, les couleurs, les champs affichés, les conditions de vente, les mentions légales, le pied de page (pénalités de retard, indemnité forfaitaire, IBAN). Vous pouvez aussi définir le préfixe de numérotation (ex. FY25-)."
      },
      {
        q: "Est-ce que les factures sont conformes à la législation française ?",
        a: "Newbi vous aide à respecter les exigences clés: numérotation continue et inaltérable, date d'émission, identité vendeur/acheteur, N° TVA quand applicable, détail des lignes, taux et montants de TVA, totaux HT/TVA/TTC, échéance, conditions de paiement, pénalités et indemnité forfaitaire, mentions spécifiques si exonération."
      }
    ]
  },
  {
    category: "Devis",
    badge: "Devis",
    questions: [
      {
        q: "Comment créer un devis avec Newbi ?",
        a: "Pour créer un devis avec Newbi, ouvrez l'outil Devis. Cliquez sur 'créer un devis', si votre client se trouve dans votre annuaire client vous avez juste à le rechercher. Sinon, vous pouvez aussi le rechercher à partir de son numéro de SIREN ou SIRET. Remplissez les conditions, échéances, détails produits…"
      },
      {
        q: "Puis-je personnaliser mes devis ?",
        a: "Oui ! Le logo, les couleurs, les champs affichés, les conditions de vente, les mentions légales, le pied de page (pénalités de retard, indemnité forfaitaire, IBAN). Vous pouvez aussi définir le préfixe de numérotation (ex. FY25-)."
      },
      {
        q: "Comment suivre le statut de votre devis ?",
        a: "Lors de la création de votre devis, vous allez définir une date d'échéance. À partir de ce moment, des rappels automatiques peuvent être envoyés avant l'échéance. Passé la date, le devis passera en 'expiré'. Vous pourrez également mettre à jour le statut de votre devis."
      }
    ]
  },
  {
    category: "Signatures de mail",
    badge: "Email",
    questions: [
      {
        q: "Comment créer une signature de mail avec Newbi ?",
        a: "Ouvrez l'outil signature de mail, créez une nouvelle signature, ajoutez le logo, les couleurs, la typographie de votre choix, les coordonnées, les boutons sociaux et champs dynamiques. Vous n'avez plus qu'à copier-coller votre signature et l'enregistrer."
      },
      {
        q: "Puis-je créer des signatures de mail pour toute mon équipe ?",
        a: "Oui, il est possible de créer des signatures de mail pour toute votre équipe."
      },
      {
        q: "La signature générée est-elle responsive et compatible avec les principaux clients mail ?",
        a: "Oui, optimisée pour Gmail, Outlook, Apple Mail et mobile."
      }
    ]
  },
  {
    category: "Tableau Kanban",
    badge: "Kanban",
    questions: [
      {
        q: "Comment utiliser l'outil tableau Kanban ?",
        a: "Créez un tableau:\n• Outils Kanban > Créer un tableau > nommez-le\n• Ouvrez-le en cliquant sur le tableau créé\n• Structurez vos colonnes: À faire → En cours → Fait\n• Ajoutez des tâches: bouton Nouvelle tâche (titre, description, échéance, responsable, priorité)\n• Mettez à jour: glissez-déposez les tâches entre les colonnes\n• Terminez: déplacez en Fait puis archivez pour garder l'historique propre"
      }
    ]
  },
  {
    category: "Transfert de fichiers",
    badge: "Transfert",
    questions: [
      {
        q: "Comment fonctionne l'outil transfert de fichiers Newbi ?",
        a: "Glissez-déposez vos fichiers, obtenez un lien sécurisé à partager au client. Vous pouvez définir un mot de passe, une date d'expiration et une limite de téléchargements. Notifications à chaque téléchargement."
      },
      {
        q: "Quelle est la taille maximale possible par transfert ?",
        a: "La taille maximale possible par transfert est de 5Go."
      },
      {
        q: "Que se passe-t-il si mon client n'a pas téléchargé les fichiers avant l'expiration du lien ?",
        a: "Le lien devient inaccessible. Il faudra créer un nouveau lien avec une nouvelle date d'expiration."
      }
    ]
  }
];

export default function FAQPage() {
  const seoData = useSEO("faq");

  return (
    <>
      <SEOHead {...seoData} />
      <JsonLd jsonLd={seoData.jsonLd} />
      <div className="min-h-screen bg-white">
      <HeroHeader />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white pt-20">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Foire aux questions
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Trouvez rapidement les réponses à vos questions sur Newbi. 
              Notre équipe a rassemblé les questions les plus fréquentes pour vous aider.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <div className="space-y-8">
          {faqData.map((section, sectionIndex) => (
            <Card key={sectionIndex} className="overflow-hidden gap-0 shadow-none">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {section.category}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {section.badge}
                  </Badge>
                </div>
                <CardDescription>
                  {section.questions.length} question{section.questions.length > 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((faq, faqIndex) => (
                    <AccordionItem 
                      key={faqIndex} 
                      value={`${sectionIndex}-${faqIndex}`}
                      className={`border-b last:border-b-0`}
                    >
                      <AccordionTrigger className="px-6 py-4 text-left hover:bg-gray-50/50">
                        <span className="font-medium text-gray-900">{faq.q}</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                          {faq.a}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
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
              Notre équipe est là pour vous aider. Rejoignez notre communauté ou contactez-nous directement 
              pour obtenir une réponse personnalisée.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <a href="mailto:contact@newbi.fr" className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Nous contacter
                </a>
              </Button>
              <Button asChild variant="outline" target="_blank" size="lg">
                <a href="https://chat.whatsapp.com/FGLms8EYhpv1o5rkrnIldL?mode=ems_copy_h_t" className="inline-flex items-center gap-2">
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
