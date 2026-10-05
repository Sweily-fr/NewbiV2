import { Skeleton } from "@/src/components/ui/skeleton";

/** Squelette de la liste des signatures (cartes). */
export function SignatureListV2Skeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Squelette de l'éditeur : panneau gauche + aperçu. */
export function SignatureEditorV2Skeleton() {
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex w-[420px] shrink-0 flex-col border-r border-[#EEEFF1] dark:border-[#232323]">
        <div className="flex items-center gap-3 px-6 pb-4 pt-6">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="flex gap-2 border-b border-[#EEEFF1] px-6 pb-2 dark:border-[#232323]">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <div className="space-y-8 px-6 py-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-32" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-56" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
        <Skeleton className="h-[420px] w-full max-w-3xl mx-auto" />
      </div>
    </div>
  );
}
