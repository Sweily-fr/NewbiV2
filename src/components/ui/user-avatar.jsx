"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { cn } from "@/src/lib/utils";

/**
 * Génère une couleur de fond basée sur le nom de l'utilisateur
 * Inspiré de Origin UI - https://originui.com/avatar
 */
function getAvatarColor(name) {
  if (!name) return "bg-gray-500";
  
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];
  
  // Générer un index basé sur le nom
  const charCodeSum = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const colorIndex = charCodeSum % colors.length;
  
  return colors[colorIndex];
}

/**
 * Extrait les initiales d'un nom
 */
function getInitials(name) {
  if (!name) return "?";
  
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Composant Avatar utilisateur avec initiales colorées
 * Inspiré de Origin UI - https://originui.com/avatar
 * 
 * @param {Object} props
 * @param {string} props.src - URL de l'image
 * @param {string} props.name - Nom de l'utilisateur
 * @param {string} props.colorKey - Clé stable pour la couleur (ex: email), utilise name si non fourni
 * @param {string} props.className - Classes CSS additionnelles
 * @param {string} props.size - Taille de l'avatar (sm, md, lg, xl)
 */
export function UserAvatar({ src, name, colorKey, className, fallbackClassName, size = "md" }) {
  const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  const bgColor = getAvatarColor(colorKey || name);
  const initials = getInitials(name);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {src && <AvatarImage src={src} alt={name} className="object-cover" />}
      <AvatarFallback className={fallbackClassName || cn(bgColor, "text-white font-medium")}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * Groupe d'avatars empilés
 * Inspiré de Origin UI - https://originui.com/avatar
 * 
 * @param {Object} props
 * @param {Array} props.users - Liste des utilisateurs [{name, image}]
 * @param {number} props.max - Nombre maximum d'avatars à afficher
 * @param {string} props.size - Taille des avatars
 */
export function AvatarGroup({ users = [], max = 3, size = "sm", className }) {
  const displayUsers = users.slice(0, max);
  const remainingCount = users.length - max;
  
  const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };
  
  return (
    <div className={cn("flex -space-x-2", className)}>
      {displayUsers.map((user, index) => (
        <UserAvatar
          key={user.userId || index}
          src={user.image}
          name={user.name}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {remainingCount > 0 && (
        <Avatar className={cn(sizeClasses[size], "ring-2 ring-background")}>
          <AvatarFallback className="bg-muted text-muted-foreground font-medium">
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
