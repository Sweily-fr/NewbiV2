"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/src/components/ui/tabs";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/src/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { GET_PCG_MAPPING_TABLE } from "@/src/graphql/queries/banking";
import {
  Search,
  ArrowUpDown,
  Info,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { CONFIDENCE_CONFIG } from "@/lib/pcg-mapping";

const PARENT_CATEGORIES = [
  "Tous",
  "Incomes",
  "Taxes",
  "Misc.",
  "Home",
  "Shopping",
  "Health",
  "Bank",
  "Transport",
  "Business",
  "Education",
  "Food",
  "Entertainment",
  "Bills",
  "Transfers",
  "Personal care",
];

function ConfidenceBadge({ confidence }) {
  const config = CONFIDENCE_CONFIG[confidence];
  if (!config) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      {config.label}
    </span>
  );
}

function PCGMappingTable() {
  const { data, loading, error } = useQuery(GET_PCG_MAPPING_TABLE);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Tous");
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [sortField, setSortField] = useState("bridgeCategoryId");
  const [sortDir, setSortDir] = useState("asc");
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filteredData = useMemo(() => {
    if (!data?.pcgMappingTable) return [];
    let items = [...data.pcgMappingTable];

    // Filter by search
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.bridgeLabel.toLowerCase().includes(s) ||
          item.pcgNumero.includes(s) ||
          item.pcgIntitule.toLowerCase().includes(s) ||
          item.parentCategory.toLowerCase().includes(s),
      );
    }

    // Filter by parent category
    if (categoryFilter !== "Tous") {
      items = items.filter((item) => item.parentCategory === categoryFilter);
    }

    // Filter by confidence
    if (confidenceFilter !== "all") {
      items = items.filter((item) => item.confidence === confidenceFilter);
    }

    // Sort
    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === "bridgeCategoryId") {
        cmp = a.bridgeCategoryId - b.bridgeCategoryId;
      } else if (sortField === "parentCategory") {
        cmp = a.parentCategory.localeCompare(b.parentCategory);
      } else if (sortField === "pcgNumero") {
        cmp = a.pcgNumero.localeCompare(b.pcgNumero);
      } else if (sortField === "confidence") {
        const order = { high: 0, medium: 1, low: 2 };
        cmp = (order[a.confidence] || 3) - (order[b.confidence] || 3);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [data, search, categoryFilter, confidenceFilter, sortField, sortDir]);

  // Stats
  const stats = useMemo(() => {
    if (!data?.pcgMappingTable) return { total: 0, high: 0, medium: 0, low: 0 };
    const items = data.pcgMappingTable;
    return {
      total: items.length,
      high: items.filter((i) => i.confidence === "high").length,
      medium: items.filter((i) => i.confidence === "medium").length,
      low: items.filter((i) => i.confidence === "low").length,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Erreur lors du chargement de la table de correspondance.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border p-3">
          <div className="text-sm text-muted-foreground">Total catégories</div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div
          className="rounded-lg border p-3"
          style={{ borderColor: "#22c55e33" }}
        >
          <div className="text-sm" style={{ color: "#22c55e" }}>
            Fiable
          </div>
          <div className="text-2xl font-semibold">{stats.high}</div>
          <div className="text-xs text-muted-foreground">
            {stats.total > 0 ? Math.round((stats.high / stats.total) * 100) : 0}
            %
          </div>
        </div>
        <div
          className="rounded-lg border p-3"
          style={{ borderColor: "#f59e0b33" }}
        >
          <div className="text-sm" style={{ color: "#f59e0b" }}>
            Probable
          </div>
          <div className="text-2xl font-semibold">{stats.medium}</div>
          <div className="text-xs text-muted-foreground">
            {stats.total > 0
              ? Math.round((stats.medium / stats.total) * 100)
              : 0}
            %
          </div>
        </div>
        <div
          className="rounded-lg border p-3"
          style={{ borderColor: "#ef444433" }}
        >
          <div className="text-sm" style={{ color: "#ef4444" }}>
            Incertain
          </div>
          <div className="text-2xl font-semibold">{stats.low}</div>
          <div className="text-xs text-muted-foreground">
            {stats.total > 0 ? Math.round((stats.low / stats.total) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par catégorie, compte PCG..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            {PARENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Confiance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous niveaux</SelectItem>
            <SelectItem value="high">Fiable</SelectItem>
            <SelectItem value="medium">Probable</SelectItem>
            <SelectItem value="low">Incertain</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10" />
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("parentCategory")}
                >
                  <div className="flex items-center gap-1">
                    Catégorie Bridge
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("pcgNumero")}
                >
                  <div className="flex items-center gap-1">
                    Compte PCG
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("confidence")}
                >
                  <div className="flex items-center gap-1">
                    Confiance
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Alternatives</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Aucun résultat trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => {
                  const isExpanded = expandedRows.has(item.bridgeCategoryId);
                  return (
                    <>
                      <TableRow
                        key={item.bridgeCategoryId}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() =>
                          item.rules && toggleRow(item.bridgeCategoryId)
                        }
                      >
                        <TableCell className="w-10 px-2">
                          {item.rules ? (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {item.bridgeLabel}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.parentCategory} (ID: {item.bridgeCategoryId}
                              )
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono font-semibold">
                              {item.pcgNumero}
                            </code>
                            <span className="text-sm">{item.pcgIntitule}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ConfidenceBadge confidence={item.confidence} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.alternatives.map((alt) => (
                              <TooltipProvider key={alt.numero}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <code className="rounded bg-muted/60 px-1.5 py-0.5 text-xs font-mono text-muted-foreground cursor-help">
                                      {alt.numero}
                                    </code>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {alt.intitule}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                            {item.alternatives.length === 0 && (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && item.rules && (
                        <TableRow key={`${item.bridgeCategoryId}-rules`}>
                          <TableCell />
                          <TableCell colSpan={4}>
                            <div className="flex items-start gap-2 py-1 px-2 rounded bg-blue-50 dark:bg-blue-950/30 text-sm">
                              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="text-blue-700 dark:text-blue-300">
                                {item.rules}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-right">
        {filteredData.length} correspondance{filteredData.length > 1 ? "s" : ""}{" "}
        affichée{filteredData.length > 1 ? "s" : ""}
      </div>
    </div>
  );
}

export default function Analytics() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytique</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyse comptable et correspondances PCG
          </p>
        </div>
      </div>

      <Tabs defaultValue="pcg-mapping">
        <TabsList>
          <TabsTrigger value="pcg-mapping" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Plan Comptable (PCG)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pcg-mapping" className="mt-4">
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">
                    Correspondance Bridge API → Plan Comptable Général 2026
                  </p>
                  <p>
                    Cette table associe chaque catégorie Bridge (utilisée pour
                    la classification automatique des transactions bancaires) au
                    compte PCG le plus pertinent. Le niveau de confiance indique
                    la fiabilité de l'attribution automatique. Cliquez sur une
                    ligne avec des regles pour voir les cas ambigus et les
                    regles de decision.
                  </p>
                </div>
              </div>
            </div>
            <PCGMappingTable />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
