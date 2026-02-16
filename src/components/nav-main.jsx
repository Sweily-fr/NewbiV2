"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { useQuery } from "@apollo/client";
import { GET_BOARDS } from "@/src/graphql/kanbanQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  IconReceipt,
  IconFileText,
  IconLayoutKanban,
  IconMail,
  IconFileUpload,
  IconCreditCard,
} from "@tabler/icons-react";
import {
  Crown,
  ChevronRight,
  ShoppingCart,
  FolderKanban,
  FileText,
  MessageSquare,
  Plus,
  Search,
  LayoutGrid,
} from "lucide-react";
import { Input } from "@/src/components/ui/input";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/src/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import Link from "next/link";
import { cn } from "@/src/lib/utils";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/src/hooks/usePermissions";

export function NavMain({
  items,
  navVentes = [],
  navAfterVentes = [],
  navProjets = [],
  navDocuments = [],
  navCommunication = [],
  onOpenNotifications,
  notificationCount = 0,
}) {
  const pathname = usePathname();
  const { isActive, loading, subscription } = useSubscription();
  const { setOpenMobile, isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { getUserRole } = usePermissions();
  const userRole = getUserRole();
  const { workspaceId } = useWorkspace();

  // ✅ DÉSACTIVÉ: Tous les utilisateurs connectés ont accès à toutes les fonctionnalités
  // La restriction Pro est gérée au niveau de l'abonnement, pas de la navigation
  const hasProAccess = true;

  // État pour la recherche des tableaux Kanban
  const [kanbanSearchTerm, setKanbanSearchTerm] = useState("");
  const debouncedKanbanSearch = useDebouncedValue(kanbanSearchTerm, 300);

  // Récupérer les tableaux Kanban
  const { data: kanbanData } = useQuery(GET_BOARDS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  // Filtrer et trier les tableaux Kanban (tous les dossiers, filtrés par recherche)
  const filteredKanbanBoards = useMemo(() => {
    const boards = kanbanData?.boards || [];
    // Trier par date de création (plus récent en premier)
    const sortedBoards = [...boards].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    // Filtrer par terme de recherche si présent, sinon afficher tous
    const filtered = debouncedKanbanSearch
      ? sortedBoards.filter((board) =>
          board.title.toLowerCase().includes(debouncedKanbanSearch.toLowerCase())
        )
      : sortedBoards; // Afficher tous les dossiers
    return filtered;
  }, [kanbanData?.boards, debouncedKanbanSearch]);

  // ✅ DÉSACTIVÉ: Plus de restriction Pro sur les onglets principaux
  // Tous les utilisateurs abonnés (y compris trialing) ont accès
  const proTabs = [];

  // Vérifier si un sous-lien est actif pour chaque menu
  const isVentesSubActive = navVentes.some(
    (item) => pathname === item.url || pathname?.startsWith(item.url + "/")
  );
  const isProjetsSubActive = navProjets.some(
    (item) => pathname === item.url || pathname?.startsWith(item.url + "/")
  );
  const isDocumentsSubActive = navDocuments.some(
    (item) => pathname === item.url || pathname?.startsWith(item.url + "/")
  );
  const isCommunicationSubActive = navCommunication.some(
    (item) => pathname === item.url || pathname?.startsWith(item.url + "/")
  );

  // États pour les menus collapsibles
  const [isVentesOpen, setIsVentesOpen] = useState(isVentesSubActive);
  const [isProjetsOpen, setIsProjetsOpen] = useState(true); // Toujours ouvert par défaut pour voir les tableaux
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(isDocumentsSubActive);
  const [isCommunicationOpen, setIsCommunicationOpen] = useState(
    isCommunicationSubActive
  );

  // États pour les menus comptables (items avec sous-liens)
  const [accountingMenuStates, setAccountingMenuStates] = useState({});

  // Initialiser les états des menus comptables
  useEffect(() => {
    const initialStates = {};
    items.forEach((item) => {
      if (item.items && item.items.length > 0) {
        const isSubActive = item.items.some(
          (subItem) =>
            pathname === subItem.url || pathname?.startsWith(subItem.url + "/")
        );
        initialStates[item.title] = isSubActive;
      }
    });
    setAccountingMenuStates(initialStates);
  }, [items, pathname]);

  // Garder les menus ouverts si un sous-lien est actif
  useEffect(() => {
    if (isVentesSubActive) setIsVentesOpen(true);
  }, [isVentesSubActive]);

  useEffect(() => {
    if (isProjetsSubActive) setIsProjetsOpen(true);
  }, [isProjetsSubActive]);

  useEffect(() => {
    if (isDocumentsSubActive) setIsDocumentsOpen(true);
  }, [isDocumentsSubActive]);

  useEffect(() => {
    if (isCommunicationSubActive) setIsCommunicationOpen(true);
  }, [isCommunicationSubActive]);

  // Fonction pour fermer la sidebar sur mobile lors du clic
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Fonction spéciale pour le menu Ventes avec actions rapides
  const renderVentesMenu = (ventesItems = navVentes) => {
    // Sur mobile, toujours utiliser le pattern Collapsible pour rester dans le viewport
    if (isCollapsed && !isMobile) {
      return (
        <DropdownMenu key="ventes">
          <SidebarMenuItem>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                tooltip="Ventes"
                className={cn(
                  "bg-transparent w-full cursor-pointer",
                  isVentesSubActive &&
                    "bg-[#F0F0F0] dark:bg-sidebar-accent text-sidebar-foreground"
                )}
              >
                <ShoppingCart />
                <span>Ventes</span>
                <ChevronRight className="ml-auto h-4 w-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={isMobile ? "bottom" : "right"}
              align="start"
              className="min-w-[180px]"
            >
              {/* Actions rapides (masquées pour le comptable) */}
              {userRole !== "accountant" && (
                <>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/outils/factures/new"
                      onClick={handleLinkClick}
                      className="cursor-pointer flex justify-between w-full"
                    >
                      <span>Nouvelle facture</span>
                      <Plus className="h-4 w-4" />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/outils/devis/new"
                      onClick={handleLinkClick}
                      className="cursor-pointer flex justify-between w-full"
                    >
                      <span>Nouveau devis</span>
                      <Plus className="h-4 w-4" />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {/* Sous-menus */}
              {ventesItems.map((subItem) => {
                const isSubItemActive =
                  pathname === subItem.url ||
                  pathname?.startsWith(subItem.url + "/");
                const hasSubAccess = !subItem.isPro || hasProAccess;
                return (
                  <DropdownMenuItem
                    key={subItem.title}
                    asChild={hasSubAccess}
                    disabled={!hasSubAccess}
                    className={cn(
                      !hasSubAccess && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    {hasSubAccess ? (
                      <Link
                        href={subItem.url}
                        onClick={handleLinkClick}
                        className={cn(
                          "cursor-pointer",
                          isSubItemActive && "bg-accent font-medium"
                        )}
                      >
                        {subItem.title}
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span>{subItem.title}</span>
                        <Crown className="w-3 h-3 text-[#5b4fff]" />
                      </div>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </SidebarMenuItem>
        </DropdownMenu>
      );
    }

    return (
      <Collapsible
        key="ventes"
        open={isVentesOpen}
        onOpenChange={setIsVentesOpen}
      >
        <SidebarMenuItem>
          <div
            data-tutorial="nav-ventes"
            className={cn(
              "flex items-center w-full rounded-md transition-colors",
              isVentesSubActive && "bg-[#F0F0F0] dark:bg-sidebar-accent"
            )}
          >
            <SidebarMenuButton
              tooltip="Ventes"
              className={cn(
                "bg-transparent w-full cursor-pointer hover:bg-transparent",
                isVentesSubActive && "text-sidebar-foreground"
              )}
              onClick={() => setIsVentesOpen(!isVentesOpen)}
            >
              <ShoppingCart />
              <span>Ventes</span>
            </SidebarMenuButton>
            <CollapsibleTrigger asChild>
              <button
                className="p-2 hover:bg-transparent transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isVentesOpen && "rotate-90"
                  )}
                />
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <SidebarMenuSub>
              {ventesItems.map((subItem) => {
                const isSubItemActive =
                  pathname === subItem.url ||
                  pathname?.startsWith(subItem.url + "/");
                const hasSubAccess = !subItem.isPro || hasProAccess;
                return (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      asChild={hasSubAccess}
                      isActive={isSubItemActive && hasSubAccess}
                      className={cn(
                        !hasSubAccess && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      {hasSubAccess ? (
                        <Link
                          href={subItem.url}
                          onClick={handleLinkClick}
                          className={cn(
                            isSubItemActive &&
                              "bg-[#F0F0F0] dark:bg-sidebar-accent text-sidebar-foreground font-medium"
                          )}
                        >
                          <span className="text-sm">{subItem.title}</span>
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm">{subItem.title}</span>
                          <Crown className="w-3 h-3 text-[#5b4fff]" />
                        </div>
                      )}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  // Fonction pour rendre le menu Projets avec barre de recherche et tableaux Kanban
  const renderProjetsMenu = () => {
    const isKanbanActive = pathname?.startsWith("/dashboard/outils/kanban");

    if (isCollapsed) {
      return (
        <DropdownMenu key="projets">
          <SidebarMenuItem>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                tooltip="Tâches"
                className={cn(
                  "bg-transparent w-full cursor-pointer",
                  isKanbanActive &&
                    "bg-[#F0F0F0] dark:bg-sidebar-accent text-sidebar-foreground"
                )}
              >
                <FolderKanban />
                <span>Tâches</span>
                <ChevronRight className="ml-auto h-4 w-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-80 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="start"
              sideOffset={8}
            >
              {/* Barre de recherche */}
              <div className="flex items-center px-4 mb-1 border-b">
                <Search className="h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder="Rechercher un dossier..."
                  value={kanbanSearchTerm}
                  onChange={(e) => setKanbanSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-9 w-full rounded-md shadow-none bg-transparent py-3 text-sm outline-none placeholder:text-xs border-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              {/* Liste des dossiers avec scroll */}
              <div className="max-h-[200px] overflow-y-auto">
                {filteredKanbanBoards.length > 0 ? (
                  filteredKanbanBoards.map((board) => {
                    const isBoardActive =
                      pathname === `/dashboard/outils/kanban/${board.id}`;
                    return (
                      <DropdownMenuItem
                        key={board.id}
                        asChild
                        className="flex items-center gap-2 px-2 py-2 cursor-pointer"
                      >
                        <Link
                          href={`/dashboard/outils/kanban/${board.id}`}
                          onClick={handleLinkClick}
                        >
                          <span className="flex-1 text-xs truncate">
                            {board.title}
                          </span>
                          {isBoardActive && (
                            <ChevronRight className="h-4 w-4 text-[#5b4fff]" />
                          )}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {kanbanSearchTerm ? "Aucun résultat" : "Aucun dossier"}
                  </div>
                )}
              </div>

              <DropdownMenuSeparator className="my-1" />

              {/* Lien vers tous les dossiers */}
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/outils/kanban"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2 px-2 py-2 cursor-pointer text-muted-foreground"
                >
                  <span className="text-xs">Toutes les listes</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              {/* Créer une nouvelle liste */}
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/outils/kanban?new=true"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2 px-2 py-2 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">Nouvelle liste</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </SidebarMenuItem>
        </DropdownMenu>
      );
    }

    return (
      <DropdownMenu key="projets-expanded">
        <SidebarMenuItem>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip="Tâches"
              className={cn(
                "bg-transparent w-full cursor-pointer",
                isKanbanActive &&
                  "bg-[#F0F0F0] dark:bg-sidebar-accent text-sidebar-foreground"
              )}
            >
              <FolderKanban />
              <span>Tâches</span>
              <ChevronRight className="ml-auto h-4 w-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="start"
            className="w-64 rounded-lg"
            sideOffset={8}
          >
            {/* Lien vers tous les dossiers - Style comme organization switcher */}
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/outils/kanban"
                onClick={handleLinkClick}
                className="cursor-pointer flex items-center gap-2 font-medium"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="text-sm">Toutes les listes</span>
              </Link>
            </DropdownMenuItem>

            {/* Barre de recherche - Style comme organization switcher */}
            <div className="flex items-center px-2 py-2 border-b border-t mt-1">
              <Search className="h-4 w-4 shrink-0 opacity-50" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={kanbanSearchTerm}
                onChange={(e) => setKanbanSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="flex h-8 w-full rounded-md shadow-none bg-transparent py-2 text-sm outline-none placeholder:text-xs border-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {/* Liste des dossiers Kanban avec scroll */}
            <div className="max-h-[200px] overflow-y-auto">
              {filteredKanbanBoards.length > 0 ? (
                filteredKanbanBoards.map((board) => {
                  const isBoardActive =
                    pathname === `/dashboard/outils/kanban/${board.id}`;
                  return (
                    <DropdownMenuItem key={board.id} asChild>
                      <Link
                        href={`/dashboard/outils/kanban/${board.id}`}
                        onClick={handleLinkClick}
                        className={cn(
                          "cursor-pointer flex items-center gap-2 px-2 py-2",
                          isBoardActive && "bg-accent font-medium"
                        )}
                      >
                        <span className="text-xs truncate flex-1">
                          {board.title}
                        </span>
                        {isBoardActive && (
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Link>
                    </DropdownMenuItem>
                  );
                })
              ) : (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  {kanbanSearchTerm ? "Aucun résultat" : "Aucun dossier"}
                </div>
              )}
            </div>

            <DropdownMenuSeparator className="my-1" />

            {/* Lien vers tous les dossiers en bas - Style comme organization switcher */}
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/outils/kanban"
                onClick={handleLinkClick}
                className="cursor-pointer flex items-center gap-2 px-2 py-2 text-muted-foreground"
              >
                <span className="text-xs">Toutes les listes</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </SidebarMenuItem>
      </DropdownMenu>
    );
  };

  // Fonction pour rendre un menu collapsible
  const renderCollapsibleMenu = (
    title,
    icon,
    subItems,
    isOpen,
    setIsOpen,
    isSubActive
  ) => {
    const IconComponent = icon;

    // Sur mobile, toujours utiliser le pattern Collapsible pour rester dans le viewport
    if (isCollapsed && !isMobile) {
      return (
        <DropdownMenu key={title}>
          <SidebarMenuItem>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                tooltip={title}
                className={cn(
                  "bg-transparent w-full cursor-pointer",
                  isSubActive &&
                    "bg-[#F0F0F0] dark:bg-sidebar-accent text-sidebar-foreground"
                )}
              >
                <IconComponent />
                <span>{title}</span>
                <ChevronRight className="ml-auto h-4 w-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={isMobile ? "bottom" : "right"}
              align="start"
              className="min-w-[180px]"
            >
              {subItems.map((subItem, index) => {
                // Si l'item a une section, c'est un groupe
                if (subItem.section) {
                  return (
                    <div key={`section-${index}`}>
                      {/* Séparateur avant la section (sauf pour la première) */}
                      {index > 0 && <DropdownMenuSeparator />}
                      {/* Titre de la section */}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {subItem.section}
                      </div>
                      {/* Items de la section */}
                      {subItem.items?.map((item) => {
                        const isSubItemActive =
                          pathname === item.url ||
                          pathname?.startsWith(item.url + "/");
                        const hasSubAccess = !item.isPro || hasProAccess;
                        return (
                          <DropdownMenuItem
                            key={item.title}
                            asChild={hasSubAccess}
                            disabled={!hasSubAccess}
                            className={cn(
                              !hasSubAccess && "opacity-60 cursor-not-allowed"
                            )}
                          >
                            {hasSubAccess ? (
                              <Link
                                href={item.url}
                                onClick={handleLinkClick}
                                className={cn(
                                  "cursor-pointer",
                                  isSubItemActive && "bg-accent font-medium"
                                )}
                              >
                                {item.title}
                              </Link>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span>{item.title}</span>
                                <Crown className="w-3 h-3 text-[#5b4fff]" />
                              </div>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  );
                }

                // Sinon, c'est un item simple (ancien format)
                const isSubItemActive =
                  pathname === subItem.url ||
                  pathname?.startsWith(subItem.url + "/");
                const hasSubAccess = !subItem.isPro || hasProAccess;
                return (
                  <DropdownMenuItem
                    key={subItem.title || `item-${index}`}
                    asChild={hasSubAccess}
                    disabled={!hasSubAccess}
                    className={cn(
                      !hasSubAccess && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    {hasSubAccess ? (
                      <Link
                        href={subItem.url}
                        onClick={handleLinkClick}
                        className={cn(
                          "cursor-pointer",
                          isSubItemActive && "bg-accent font-medium"
                        )}
                      >
                        {subItem.title}
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span>{subItem.title}</span>
                        <Crown className="w-3 h-3 text-[#5b4fff]" />
                      </div>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </SidebarMenuItem>
        </DropdownMenu>
      );
    }

    return (
      <Collapsible key={title} open={isOpen} onOpenChange={setIsOpen}>
        <SidebarMenuItem>
          <div
            className={cn(
              "flex items-center w-full rounded-md transition-colors",
              isSubActive && "bg-[#F0F0F0] dark:bg-sidebar-accent"
            )}
          >
            <SidebarMenuButton
              tooltip={title}
              className={cn(
                "bg-transparent w-full cursor-pointer hover:bg-transparent",
                isSubActive && "text-sidebar-foreground"
              )}
              onClick={() => setIsOpen(!isOpen)}
            >
              <IconComponent />
              <span>{title}</span>
            </SidebarMenuButton>
            <CollapsibleTrigger asChild>
              <button
                className="p-2 hover:bg-transparent transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isOpen && "rotate-90"
                  )}
                />
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <SidebarMenuSub>
              {subItems.map((subItem, index) => {
                // Si l'item a une section, c'est un groupe
                if (subItem.section) {
                  return (
                    <div key={`section-${index}`}>
                      {/* Séparateur avant la section (sauf pour la première) */}
                      {index > 0 && (
                        <div className="my-2 border-t border-sidebar-border" />
                      )}
                      {/* Titre de la section */}
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {subItem.section}
                      </div>
                      {/* Items de la section */}
                      {subItem.items?.map((item) => {
                        const isSubItemActive =
                          pathname === item.url ||
                          pathname?.startsWith(item.url + "/");
                        const hasSubAccess = !item.isPro || hasProAccess;
                        return (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild={hasSubAccess}
                              isActive={isSubItemActive && hasSubAccess}
                              className={cn(
                                !hasSubAccess && "opacity-60 cursor-not-allowed"
                              )}
                            >
                              {hasSubAccess ? (
                                <Link
                                  href={item.url}
                                  onClick={handleLinkClick}
                                  className={cn(
                                    isSubItemActive &&
                                      "bg-[#F0F0F0] dark:bg-sidebar-accent text-sidebar-foreground font-medium"
                                  )}
                                >
                                  <span className="text-sm">{item.title}</span>
                                </Link>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-sm">{item.title}</span>
                                  <Crown className="w-3 h-3 text-[#5b4fff]" />
                                </div>
                              )}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </div>
                  );
                }

                // Sinon, c'est un item simple (ancien format)
                const isSubItemActive =
                  pathname === subItem.url ||
                  pathname?.startsWith(subItem.url + "/");
                const hasSubAccess = !subItem.isPro || hasProAccess;
                return (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      asChild={hasSubAccess}
                      isActive={isSubItemActive && hasSubAccess}
                      className={cn(
                        !hasSubAccess && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      {hasSubAccess ? (
                        <Link
                          href={subItem.url}
                          onClick={handleLinkClick}
                          className={cn(
                            isSubItemActive &&
                              "bg-[#F0F0F0] dark:bg-sidebar-accent text-sidebar-foreground font-medium"
                          )}
                        >
                          <span className="text-sm">{subItem.title}</span>
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm">{subItem.title}</span>
                          <Crown className="w-3 h-3 text-[#5b4fff]" />
                        </div>
                      )}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  // Fonction pour rendre un item avec sous-liens (pour la navigation comptable)
  const renderItemWithSubItems = (item) => {
    const isSubActive = item.items?.some(
      (subItem) =>
        pathname === subItem.url || pathname?.startsWith(subItem.url + "/")
    );

    const isOpen = accountingMenuStates[item.title] || false;
    const setIsOpen = (value) => {
      setAccountingMenuStates((prev) => ({
        ...prev,
        [item.title]: value,
      }));
    };

    return renderCollapsibleMenu(
      item.title,
      item.icon,
      item.items,
      isOpen,
      setIsOpen,
      isSubActive
    );
  };

  // Fonction pour rendre un item simple
  const renderSimpleItem = (item) => {
    // Si l'item a des sous-items, utiliser le rendu avec sous-menus
    if (item.items && item.items.length > 0) {
      return renderItemWithSubItems(item);
    }

    const isProTab = proTabs.includes(item.title);
    const hasAccess = !isProTab || hasProAccess;
    const isItemActive =
      pathname === item.url ||
      (item.url !== "/dashboard" && pathname?.startsWith(item.url + "/"));

    // Gérer l'action spéciale pour ouvrir les notifications
    if (item.action === "openNotifications") {
      return (
        <SidebarMenuItem key={item.title} className="relative">
          <SidebarMenuButton
            className="bg-transparent w-full cursor-pointer"
            tooltip={item.title}
            onClick={() => {
              if (onOpenNotifications) onOpenNotifications();
              handleLinkClick();
            }}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {!isCollapsed && notificationCount > 0 && (
              <kbd className="ml-auto inline-flex items-center justify-center rounded border-y border-b-[#5b4eff]/30 border-t-[#5b4eff]/10 bg-[#5b4eff]/20 px-1 font-sans text-[10px] text-[#5b4eff] ring-1 ring-[#5b4eff]/20 h-4 min-w-4">
                {notificationCount}
              </kbd>
            )}
          </SidebarMenuButton>
          {isCollapsed && notificationCount > 0 && (
            <kbd className="absolute top-0 right-0 inline-flex items-center justify-center rounded border-y border-b-[#5b4eff]/30 border-t-[#5b4eff]/10 bg-[#5b4eff]/20 px-1 font-sans text-[10px] text-[#5b4eff] ring-1 ring-[#5b4eff]/20 h-4 min-w-4">
              {notificationCount > 9 ? "9+" : notificationCount}
            </kbd>
          )}
        </SidebarMenuItem>
      );
    }

    // Déterminer l'attribut data-tutorial selon le titre
    const getTutorialAttribute = () => {
      if (item.title === "Dashboard") return "nav-dashboard";
      if (item.title === "Transactions") return "nav-transactions";
      return undefined;
    };

    return (
      <SidebarMenuItem key={item.title}>
        <Link
          href={hasAccess ? item.url : "#"}
          className="w-full"
          onClick={hasAccess ? handleLinkClick : undefined}
        >
          <SidebarMenuButton
            data-tutorial={getTutorialAttribute()}
            className={cn(
              "bg-transparent w-full cursor-pointer relative",
              !hasAccess && "opacity-60 cursor-not-allowed",
              isItemActive &&
                "bg-[#F0F0F0] dark:bg-sidebar-accent text-sidebar-foreground"
            )}
            tooltip={
              isProTab && !hasAccess
                ? `${item.title} - Fonctionnalité Pro`
                : item.title
            }
            disabled={!hasAccess}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {isProTab && !hasAccess && (
              <Crown className="w-3 h-3 ml-auto text-[#5b4fff]" />
            )}
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    );
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1 pt-2">
        <SidebarMenu>
          {/* Dashboard et Transactions */}
          {items.map((item) => renderSimpleItem(item))}

          {/* Menu Ventes avec sous-menus et actions rapides */}
          {navVentes.length > 0 && (() => {
            // Filtrer les items pour le comptable (pas de Catalogues)
            const accountantAllowedVentes = ["Factures clients", "Devis", "Liste client (CRM)"];
            const filteredNavVentes = userRole === "accountant"
              ? navVentes.filter(item => accountantAllowedVentes.includes(item.title))
              : navVentes;
            return filteredNavVentes.length > 0 && renderVentesMenu(filteredNavVentes);
          })()}

          {/* Catalogue, Boîte de réception, Calendrier */}
          {navAfterVentes.map((item) => renderSimpleItem(item))}
        </SidebarMenu>

        {/* Séparateur visuel */}
        <div className="my-2" />

        <SidebarMenu>
          {/* Menu Projets avec tableaux Kanban */}
          {userRole !== "accountant" && renderProjetsMenu()}

          {/* Menu Documents avec sous-menus */}
          {navDocuments.length > 0 && (() => {
            // Filtrer les items pour le comptable (uniquement Documents partagés)
            const filteredNavDocuments = userRole === "accountant"
              ? navDocuments.filter(item => item.title === "Documents partagés")
              : navDocuments;
            return filteredNavDocuments.length > 0 && (
              <div data-tutorial="nav-documents">
                {renderCollapsibleMenu(
                  "Documents",
                  FileText,
                  filteredNavDocuments,
                  isDocumentsOpen,
                  setIsDocumentsOpen,
                  isDocumentsSubActive
                )}
              </div>
            );
          })()}

          {/* Menu Communication avec sous-menus */}
          {userRole !== "accountant" &&
            navCommunication.length > 0 &&
            renderCollapsibleMenu(
              "Communication",
              MessageSquare,
              navCommunication,
              isCommunicationOpen,
              setIsCommunicationOpen,
              isCommunicationSubActive
            )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
