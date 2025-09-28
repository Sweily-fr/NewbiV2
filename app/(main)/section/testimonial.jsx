import React from "react";

const TestimonialsSection = () => {
  // Fonction pour extraire les initiales d'un nom
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };
  const testimonials = [
    // Column 1
    [
      {
        text: "Devis-factures en 2 clics, plus de temps pour coder.",
        author: "Pedro Dos Santos",
        role: "Développeur web",
      },
      {
        text: "Transferts rapides et sécurisés, mes livrables restent impeccables.",
        author: "Kaly Mbinda",
        role: "Motion designer",
      },
    ],
    // Column 2
    [
      {
        text: "Factures propres, paiements fluides, zéro prise de tête administrative.",
        author: "Pierre Lefevre",
        role: "Rédacteur",
      },
      {
        text: "Planning simple, facturation rapide, je me concentre sur mes clients.",
        author: "Cathy Lee",
        role: "Coach",
      },
      {
        text: "Tarif doux, interface claire, support qui répond vite.",
        author: "David Pinto",
        role: "Traducteur",
      },
    ],
    // Column 3
    [
      {
        text: "Kanban + deadlines visibles: priorités sous contrôle.",
        author: "George Ludovic",
        role: "Chef de projet",
      },
      {
        text: "Le rapport qualité‑prix est idéal pour une petite agence en lancement.",
        author: "Frank Lawson",
        role: "Architecte",
      },
      {
        text: "Tout est fluide: modèles, envois, devis/factures. Je ne perds plus de temps dans les réglages.",
        author: "Grace Marchand",
        role: "Graphiste",
      },
    ],
    // Column 4
    [
      {
        text: "Pour un tarif aussi abordable, c'est devenu mon outil central.",
        author: "Henry Ducouret",
        role: "Développeur web",
      },
      {
        text: "Devis signés en ligne, suivi facile, plus de créations. Le tout à un prix parfait pour une freelance qui démarre.",
        author: "Ivy Thurin",
        role: "Illustrateur·rice",
      },
    ],
  ];

  const QuoteIcon = () => (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 512 512"
      className="absolute top-2 left-2 text-neutral-300"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M464 256h-80v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8c-88.4 0-160 71.6-160 160v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48zm-288 0H96v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8C71.6 32 0 103.6 0 192v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48z"></path>
    </svg>
  );

  const TestimonialCard = ({ testimonial }) => (
    <div className="p-8 rounded-xl border relative bg-white dark:border-[rgba(255,255,255,0.10)] dark:bg-[rgba(40,40,40,0.30)] shadow-xs group">
      <QuoteIcon />
      <h3 className="text-base font-normal dark:text-white text-black py-2 relative">
        {testimonial.text}
      </h3>
      <div className="flex gap-2 items-center mt-8">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-sm font-medium">
          {getInitials(testimonial.author)}
        </div>
        <div className="flex flex-col">
          <p className="text-xs font-normal dark:text-neutral-400 text-neutral-600 max-w-sm">
            {testimonial.author}
          </p>
          <p className="font-normal dark:text-neutral-400 text-neutral-600 max-w-sm text-[10px]">
            {testimonial.role}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-20 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl font-medium text-gray-900 mb-4">
            Vos retours font notre force
          </h2>
          <p className="text-md text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Découvrez comment nos utilisateurs transforment leur quotidien grâce
            à notre solution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {testimonials.map((column, columnIndex) => (
            <div key={columnIndex} className="grid gap-4 items-start">
              {column.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
