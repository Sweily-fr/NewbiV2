"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { UPDATE_TRANSACTION_PCG } from "@/src/graphql/queries/banking";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { getAllPCGAccounts, getPCGForBridgeCategory } from "@/lib/pcg-mapping";
import { Search, Check, Star, LoaderCircle } from "lucide-react";
import { Book2Icon } from "@/src/components/icons";
import { cn } from "@/src/lib/utils";

const pcgAccounts = getAllPCGAccounts();

export function PCGSelectDialog({
  open,
  onOpenChange,
  transaction,
  onRefresh,
}) {
  const { workspaceId } = useRequiredWorkspace();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (open && transaction) {
      setSelected(transaction.pcgAccount?.numero || "");
      setSearch("");
    }
  }, [open, transaction]);

  const [updatePCG, { loading }] = useMutation(UPDATE_TRANSACTION_PCG);

  const suggestion = useMemo(() => {
    const bridgeCategoryId = transaction?.metadata?.bridgeCategoryId;
    if (!bridgeCategoryId) return null;
    return getPCGForBridgeCategory(Number(bridgeCategoryId));
  }, [transaction]);

  const filteredAccounts = useMemo(() => {
    if (!search) return pcgAccounts;
    const s = search.toLowerCase();
    return pcgAccounts.filter(
      (acc) => acc.numero.includes(s) || acc.intitule.toLowerCase().includes(s),
    );
  }, [search]);

  const handleSave = async () => {
    if (!selected || !transaction?.id) {
      toast.error("Données manquantes");
      return;
    }

    try {
      await updatePCG({
        variables: {
          transactionId: transaction.id,
          pcgNumero: selected,
          workspaceId,
        },
      });
      toast.success("Compte PCG mis à jour");
      if (onRefresh) {
        await onRefresh();
      }
      onOpenChange(false);
    } catch (error) {
      console.error("[PCGSelectDialog] Mutation error:", error);
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  const currentPCG = transaction?.pcgAccount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1] flex flex-col max-h-[75vh]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40 flex-shrink-0">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <Book2Icon className="size-4" />
              Affecter un compte PCG
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0 px-5 pt-3 pb-0">
            {/* Transaction info */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg border border-border/50 mb-3">
              <span className="text-xs text-muted-foreground truncate mr-2">
                {transaction?.description || "Transaction"}
              </span>
              <span className="text-xs font-medium whitespace-nowrap">
                {transaction?.amount?.toFixed(2)} €
              </span>
            </div>

            {/* Current PCG */}
            {currentPCG?.numero && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50 mb-3">
                <span className="text-xs text-muted-foreground">Actuel :</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                  {currentPCG.numero}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {currentPCG.intitule}
                </span>
              </div>
            )}

            {/* Suggestion */}
            {suggestion && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                  <Star className="h-3 w-3" />
                  Suggestion
                </div>
                <button
                  className={cn(
                    "flex items-center gap-2 w-full text-left text-sm rounded-lg px-3 py-2 border transition-colors cursor-pointer",
                    selected === suggestion.numero
                      ? "bg-primary/5 border-primary/30"
                      : "border-border/50 hover:bg-muted/50",
                  )}
                  onClick={() => setSelected(suggestion.numero)}
                >
                  <code className="font-mono font-semibold text-xs">
                    {suggestion.numero}
                  </code>
                  <span className="flex-1 truncate text-xs">
                    {suggestion.intitule}
                  </span>
                  {selected === suggestion.numero && (
                    <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  )}
                </button>
              </div>
            )}

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un compte..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
                autoFocus
              />
            </div>

            {/* Account list */}
            <div className="flex-1 overflow-y-auto min-h-0 max-h-[280px] rounded-lg border border-border/50">
              {filteredAccounts.map((acc) => {
                const isSelected = selected === acc.numero;
                return (
                  <button
                    key={acc.numero}
                    className={cn(
                      "flex items-center gap-3 w-full text-left px-3 py-2 text-xs border-b border-border/30 last:border-b-0 transition-colors cursor-pointer",
                      isSelected ? "bg-primary/5" : "hover:bg-muted/50",
                    )}
                    onClick={() => setSelected(acc.numero)}
                  >
                    <code className="font-mono font-semibold min-w-[50px]">
                      {acc.numero}
                    </code>
                    <span className="flex-1 truncate text-muted-foreground">
                      {acc.intitule}
                    </span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
              {filteredAccounts.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  Aucun compte trouvé
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-border/40 px-5 py-3 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!selected || loading}
            >
              {loading ? (
                <>
                  <LoaderCircle className="size-3.5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
