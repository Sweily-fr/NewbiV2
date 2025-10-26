export interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  author: string;
  authorAvatar: string;
  pubDate: string;
  category: string;
  image: string;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "optimiser-facturation",
    title: "Comment optimiser votre facturation",
    summary:
      "Découvrez les meilleures pratiques pour automatiser et simplifier votre processus de facturation. Gagnez du temps et réduisez les erreurs.",
    author: "Équipe Newbi",
    authorAvatar: "/images/team/avatar.jpg",
    pubDate: "15 Janvier 2025",
    category: "Facturation",
    image:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop",
    content: `
      <p>La facturation est un élément crucial de la gestion d'entreprise. Une facturation optimisée permet non seulement de gagner du temps, mais aussi de réduire les erreurs et d'améliorer la trésorerie.</p>
      
      <h2>Les bases d'une bonne facturation</h2>
      <p>Pour optimiser votre processus de facturation, il est essentiel de mettre en place des bonnes pratiques dès le départ. Voici les éléments clés à considérer :</p>
      
      <h3>1. Automatisation du processus</h3>
      <p>L'automatisation est la clé pour gagner du temps et réduire les erreurs. Utilisez un logiciel de facturation qui vous permet de :</p>
      <ul>
        <li>Créer des modèles de factures personnalisés</li>
        <li>Générer automatiquement les factures récurrentes</li>
        <li>Envoyer des rappels de paiement automatiques</li>
        <li>Suivre l'état des paiements en temps réel</li>
      </ul>
      
      <h3>2. Numérotation cohérente</h3>
      <p>Adoptez un système de numérotation clair et cohérent pour vos factures. Cela facilite le suivi et la comptabilité.</p>
      
      <h3>3. Délais de paiement clairs</h3>
      <p>Définissez des délais de paiement clairs et communiquez-les explicitement sur vos factures. Les délais standards sont généralement de 30 jours.</p>
      
      <h2>Outils recommandés</h2>
      <p>Pour optimiser votre facturation, nous recommandons d'utiliser des outils modernes qui intègrent :</p>
      <ul>
        <li>La génération automatique de factures</li>
        <li>Le suivi des paiements</li>
        <li>Les rappels automatiques</li>
        <li>L'intégration avec votre comptabilité</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>Une facturation optimisée est essentielle pour la santé financière de votre entreprise. En suivant ces conseils et en utilisant les bons outils, vous pourrez gagner un temps précieux et améliorer votre trésorerie.</p>
    `,
  },
  {
    slug: "gerer-tresorerie",
    title: "Gérer sa trésorerie efficacement",
    summary:
      "Les clés pour un suivi financier optimal de votre entreprise. Apprenez à anticiper et gérer vos flux de trésorerie comme un pro.",
    author: "Équipe Newbi",
    authorAvatar: "/images/team/avatar.jpg",
    pubDate: "10 Janvier 2025",
    category: "Finance",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
    content: `
      <p>La gestion de trésorerie est un pilier fondamental de la santé financière de votre entreprise. Une bonne gestion vous permet d'anticiper les difficultés et de saisir les opportunités.</p>
      
      <h2>Comprendre votre trésorerie</h2>
      <p>La trésorerie représente l'argent disponible immédiatement dans votre entreprise. Elle est différente du bénéfice comptable.</p>
      
      <h3>Les indicateurs clés</h3>
      <ul>
        <li><strong>Solde de trésorerie</strong> : L'argent disponible sur vos comptes</li>
        <li><strong>Flux de trésorerie</strong> : Les entrées et sorties d'argent</li>
        <li><strong>Besoin en fonds de roulement</strong> : L'argent nécessaire pour faire tourner l'entreprise</li>
      </ul>
      
      <h2>Stratégies de gestion</h2>
      <p>Voici les meilleures pratiques pour gérer efficacement votre trésorerie :</p>
      
      <h3>1. Prévoir et anticiper</h3>
      <p>Établissez un plan de trésorerie prévisionnel sur 12 mois minimum. Cela vous permet d'anticiper les périodes difficiles.</p>
      
      <h3>2. Optimiser les délais de paiement</h3>
      <p>Négociez des délais de paiement favorables avec vos fournisseurs tout en facturant rapidement vos clients.</p>
      
      <h3>3. Constituer une réserve</h3>
      <p>Gardez toujours une réserve de trésorerie équivalente à 3-6 mois de charges fixes.</p>
      
      <h2>Outils de suivi</h2>
      <p>Utilisez des outils modernes pour suivre votre trésorerie en temps réel et prendre les bonnes décisions au bon moment.</p>
    `,
  },
  {
    slug: "digitalisation-entreprise",
    title: "Digitaliser son entreprise en 2025",
    summary:
      "Guide complet pour réussir votre transformation digitale. Découvrez les outils et stratégies essentiels pour moderniser votre activité.",
    author: "Équipe Newbi",
    authorAvatar: "/images/team/avatar.jpg",
    pubDate: "5 Janvier 2025",
    category: "Digital",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
    content: `
      <p>La transformation digitale n'est plus une option en 2025, c'est une nécessité pour rester compétitif. Découvrez comment réussir votre digitalisation.</p>
      
      <h2>Pourquoi digitaliser ?</h2>
      <p>La digitalisation offre de nombreux avantages :</p>
      <ul>
        <li>Gain de productivité</li>
        <li>Réduction des coûts</li>
        <li>Meilleure expérience client</li>
        <li>Accès aux données en temps réel</li>
      </ul>
      
      <h2>Les étapes clés</h2>
      
      <h3>1. Audit de l'existant</h3>
      <p>Commencez par faire un état des lieux de vos processus actuels et identifiez les points d'amélioration.</p>
      
      <h3>2. Définir une stratégie</h3>
      <p>Établissez une feuille de route claire avec des objectifs mesurables et un calendrier réaliste.</p>
      
      <h3>3. Choisir les bons outils</h3>
      <p>Sélectionnez des outils adaptés à vos besoins et à votre budget. Privilégiez les solutions cloud pour plus de flexibilité.</p>
      
      <h3>4. Former les équipes</h3>
      <p>La réussite de la digitalisation passe par l'adhésion de vos équipes. Investissez dans la formation.</p>
      
      <h2>Les domaines prioritaires</h2>
      <ul>
        <li>Gestion commerciale et CRM</li>
        <li>Facturation et comptabilité</li>
        <li>Communication et collaboration</li>
        <li>Gestion de projet</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>La digitalisation est un processus continu. Commencez par les bases et évoluez progressivement vers des solutions plus avancées.</p>
    `,
  },
];

// Fonction helper pour récupérer un article par slug
export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

// Fonction helper pour récupérer tous les slugs
export function getAllBlogSlugs(): string[] {
  return blogPosts.map((post) => post.slug);
}
