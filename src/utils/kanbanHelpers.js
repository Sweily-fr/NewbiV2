import { Flag } from 'lucide-react';

/**
 * Formate une date en chaîne relative (ex: "il y a 2j")
 * @param {Date} date - La date à formater
 * @returns {string} La date formatée en texte relatif
 */
export const formatDateRelative = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  // Moins d'une minute
  if (diffInSeconds < 60) {
    return 'à l\'instant';
  }
  
  // Moins d'une heure
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `il y a ${diffInMinutes}m`;
  }
  
  // Moins d'un jour
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `il y a ${diffInHours}h`;
  }
  
  // Moins d'un mois
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `il y a ${diffInDays}j`;
  }
  
  // Moins d'un an
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `il y a ${diffInMonths} mois`;
  }
  
  // Plus d'un an
  const diffInYears = Math.floor(diffInMonths / 12);
  return `il y a ${diffInYears} an${diffInYears > 1 ? 's' : ''}`;
};

/**
 * Retourne les classes CSS pour la couleur de priorité d'une tâche
 */
export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'HIGH': 
      return 'bg-destructive/10 dark:bg-destructive/20 text-destructive-foreground border-destructive/20 dark:border-destructive/30';
    case 'MEDIUM': 
      return 'bg-warning/10 dark:bg-warning/20 text-warning-foreground border-warning/20 dark:border-warning/30';
    case 'LOW': 
      return 'bg-success/10 dark:bg-success/20 text-success-foreground border-success/20 dark:border-success/30';
    default: 
      return 'bg-muted/50 dark:bg-muted/20 text-muted-foreground border-border';
  }
};

/**
 * Retourne l'icône pour la priorité d'une tâche
 */
export const getPriorityIcon = (priority) => {
  switch (priority) {
    case 'HIGH': return <Flag className="h-3 w-3" />;
    case 'MEDIUM': return <Flag className="h-3 w-3" />;
    case 'LOW': return <Flag className="h-3 w-3" />;
    default: return null;
  }
};

/**
 * Organise les tâches par colonne et les trie par position
 */
export const getTasksByColumn = (tasks, columnId) => {
  if (!tasks) return [];
  return tasks
    .filter(task => task.columnId === columnId)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
};
