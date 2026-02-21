import { FilterIcon, SearchIcon, CircleXIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";

const tabs = [
  { id: "all", label: "Toutes" },
  { id: "last_month", label: "Dernier mois" },
  { id: "missing_receipt", label: "Sans justificatif" },
];

export function MobileToolbar({
  inputRef,
  globalFilter,
  setGlobalFilter,
  onFilterPress,
  activeFilterCount,
  activeTab,
  onTabChange,
  isScrolled,
  tabCounts,
}) {
  return (
    <div className={cn("md:hidden flex-shrink-0 transition-shadow", isScrolled && "shadow-xs")}>
      {/* Search + Filter */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2">
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
              <SearchIcon size={16} aria-hidden="true" />
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

          {/* Bouton Filtre */}
          <Button
            size="icon"
            variant="filter"
            onClick={onFilterPress}
            aria-label="Filtrer"
            className="relative"
          >
            <FilterIcon size={16} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-background text-muted-foreground/70 inline-flex h-4 w-4 items-center justify-center rounded border text-[0.5rem] font-medium">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto scrollbar-hide px-4 pb-3">
        <div className="flex gap-2 w-max">
          {tabs.map((tab) => {
            const count = tabCounts?.[tab.id];
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "whitespace-nowrap text-xs h-8 px-3 transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-gray-100 text-foreground dark:bg-gray-800"
                    : "bg-gray-50 text-muted-foreground dark:bg-gray-900"
                )}
              >
                {tab.label}
                {count != null && count > 0 && (
                  <span className={cn(
                    "ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium transition-colors duration-200",
                    activeTab === tab.id
                      ? "bg-foreground/10 text-foreground"
                      : "bg-foreground/5 text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
