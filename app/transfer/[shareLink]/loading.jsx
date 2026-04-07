import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <LoaderCircle className="w-8 h-8 text-gray-400 animate-spin" />
        <p className="text-sm text-gray-400">Chargement…</p>
      </div>
    </div>
  );
}
