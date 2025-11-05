import { Upload, Plus, ListFilterIcon, CircleXIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";

export function MobileToolbar({
  inputRef,
  globalFilter,
  setGlobalFilter,
  setIsReceiptUploadDrawerOpen,
  setIsAddTransactionDrawerOpen,
}) {
  return (
    <div className="md:hidden px-4 py-3">
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            className={cn("peer w-full ps-9", Boolean(globalFilter) && "pe-9")}
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
            }}
            placeholder="Rechercher..."
            type="text"
            aria-label="Filter transactions"
          />
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
            <ListFilterIcon size={16} aria-hidden="true" />
          </div>
          {Boolean(globalFilter) && (
            <button
              className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Clear filter"
              onClick={() => {
                setGlobalFilter("");
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
            >
              <CircleXIcon size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Bouton Ajouter un reçu - Icône seulement */}
        <Button
          size="icon"
          variant="default"
          className="bg-[#5A50FF]"
          onClick={() => setIsReceiptUploadDrawerOpen(true)}
          aria-label="Ajouter un reçu"
        >
          <Upload size={16} />
        </Button>

        {/* Bouton Ajouter manuellement - Icône seulement */}
        <Button
          size="icon"
          variant="outline"
          onClick={() => setIsAddTransactionDrawerOpen(true)}
          aria-label="Ajouter manuellement"
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
}
