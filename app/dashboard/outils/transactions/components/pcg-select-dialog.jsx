"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { UPDATE_TRANSACTION_PCG } from "@/src/graphql/queries/banking";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { getAllPCGAccounts, getPCGForBridgeCategory } from "@/lib/pcg-mapping";
import { Search, BookOpen, Check, Star } from "lucide-react";

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

  // Reset selected quand la transaction change
  useEffect(() => {
    if (open && transaction) {
      setSelected(transaction.pcgAccount?.numero || "");
      setSearch("");
    }
  }, [open, transaction]);

  const [updatePCG, { loading }] = useMutation(UPDATE_TRANSACTION_PCG);

  // Suggestion basee sur la categorie Bridge
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
      toast.error("Donnees manquantes");
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
      toast.success("Compte PCG mis a jour");
      if (onRefresh) {
        await onRefresh();
      }
      onOpenChange(false);
    } catch (error) {
      console.error("[PCGSelectDialog] Mutation error:", error);
      toast.error(error.message || "Erreur lors de la mise a jour");
    }
  };

  const currentPCG = transaction?.pcgAccount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Affecter un compte PCG
          </DialogTitle>
          <DialogDescription>
            {transaction?.description || "Transaction"} -{" "}
            {transaction?.amount?.toFixed(2)} EUR
          </DialogDescription>
        </DialogHeader>

        {/* Current PCG info */}
        {currentPCG?.numero && (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <span className="text-muted-foreground">Compte actuel : </span>
            <code className="font-mono font-semibold">{currentPCG.numero}</code>
            {" - "}
            {currentPCG.intitule}
            {currentPCG.isManual && (
              <span className="text-xs text-blue-500 ml-2">(manuel)</span>
            )}
          </div>
        )}

        {/* Suggestion from Bridge */}
        {suggestion && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
              <Star className="h-4 w-4" />
              Suggestion automatique
            </div>
            <button
              className="flex items-center gap-2 w-full text-left text-sm hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded p-1.5 -m-1.5 transition-colors cursor-pointer"
              onClick={() => setSelected(suggestion.numero)}
            >
              <code className="font-mono font-semibold">
                {suggestion.numero}
              </code>
              <span>{suggestion.intitule}</span>
              {selected === suggestion.numero && (
                <Check className="h-4 w-4 text-green-500 ml-auto" />
              )}
            </button>
            {suggestion.alternatives.length > 0 && (
              <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                <div className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                  Alternatives possibles :
                </div>
                {suggestion.alternatives.map((alt) => (
                  <button
                    key={alt.numero}
                    className="flex items-center gap-2 w-full text-left text-xs hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded p-1 transition-colors cursor-pointer"
                    onClick={() => setSelected(alt.numero)}
                  >
                    <code className="font-mono">{alt.numero}</code>
                    <span className="text-muted-foreground">
                      {alt.intitule}
                    </span>
                    {selected === alt.numero && (
                      <Check className="h-3 w-3 text-green-500 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un compte (numero ou intitule)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Account list */}
        <div className="flex-1 overflow-y-auto max-h-[300px] rounded-lg border">
          {filteredAccounts.map((acc) => {
            const isSelected = selected === acc.numero;
            return (
              <button
                key={acc.numero}
                className={`flex items-center gap-3 w-full text-left px-3 py-2 text-sm border-b last:border-b-0 transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setSelected(acc.numero)}
              >
                <code className="font-mono font-semibold text-xs min-w-[50px]">
                  {acc.numero}
                </code>
                <span className="flex-1 truncate">{acc.intitule}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
          {filteredAccounts.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Aucun compte trouve
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!selected || loading}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
