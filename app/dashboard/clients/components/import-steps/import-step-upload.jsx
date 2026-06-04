"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Upload, X, FileCheck2, ArrowRight } from "lucide-react";
import { validateImportFile } from "@/src/utils/client-import";

function CsvIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="28" height="28" rx="4" fill="#0D9373" />
      <path
        d="M9.5 20.5V11.5H11.5V13H12C12.2 12.5 12.5 12.1 12.9 11.8C13.3 11.5 13.8 11.4 14.4 11.4C14.7 11.4 14.9 11.4 15 11.5L14.8 13.3C14.7 13.3 14.5 13.2 14.1 13.2C13.5 13.2 13 13.4 12.6 13.8C12.2 14.2 12 14.7 12 15.3V20.5H9.5Z"
        fill="white"
      />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fill="white"
        fontSize="9"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        CSV
      </text>
    </svg>
  );
}

function ExcelIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="28" height="28" rx="4" fill="#107C41" />
      <path
        d="M10 10L16 10L16 14L20 14L20 10L22 10L22 22L10 22L10 10Z"
        fill="#21A366"
      />
      <path
        d="M12.5 13L15 17L12.3 21H14.8L16 18.7L17.2 21H19.7L17 17L19.5 13H17.1L16 15.2L14.9 13H12.5Z"
        fill="white"
      />
    </svg>
  );
}

function FileTypeCard({ icon: Icon, label, extensions, color }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/50 bg-muted/20">
      <Icon className="h-7 w-7 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{extensions}</p>
      </div>
    </div>
  );
}

export default function ImportStepUpload({
  file,
  onFileSelected,
  onFileRemoved,
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = useCallback(
    (f) => {
      setError(null);
      const validation = validateImportFile(f);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      onFileSelected(f);
    },
    [onFileSelected],
  );

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile],
  );

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
    e.target.value = "";
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return CsvIcon;
    const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
    if (ext === ".csv") return CsvIcon;
    return ExcelIcon;
  };

  return (
    <div className="flex flex-col h-full">
      {!file ? (
        <div className="flex flex-col gap-5 h-full">
          {/* Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border border-dashed rounded-xl p-8 transition-all cursor-pointer flex-1 min-h-[180px] flex items-center justify-center ${
              dragActive
                ? "border-[#5A50FF] bg-[#5A50FF]/5 scale-[0.99]"
                : "border-muted-foreground/20 hover:border-[#5A50FF]/40 hover:bg-muted/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                  dragActive ? "bg-[#5A50FF]/10" : "bg-muted"
                }`}
              >
                <Upload
                  className={`h-5 w-5 transition-colors ${
                    dragActive ? "text-[#5A50FF]" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium">Glissez votre fichier ici</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ou{" "}
                  <span className="text-foreground underline underline-offset-2">
                    parcourir vos fichiers
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="space-y-4">
            {/* Supported formats */}
            <div>
              <p className="text-xs text-muted-foreground mb-2.5">
                Formats acceptés
              </p>
              <div className="grid grid-cols-2 gap-2">
                <FileTypeCard
                  icon={CsvIcon}
                  label="Fichier CSV"
                  extensions=".csv"
                />
                <FileTypeCard
                  icon={ExcelIcon}
                  label="Microsoft Excel"
                  extensions=".xls, .xlsx"
                />
              </div>
            </div>

            {/* Info row */}
            <div className="flex items-center">
              <p className="text-[11px] text-muted-foreground">
                Taille max : 5 Mo — La 1re ligne doit contenir les en-têtes de
                colonnes
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5 h-full">
          {/* Selected file */}
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-muted/20">
            {(() => {
              const FileIcon = getFileIcon(file.name);
              return <FileIcon className="h-9 w-9 flex-shrink-0" />;
            })()}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatSize(file.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onFileRemoved();
                setError(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Ready state */}
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-6">
            <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <FileCheck2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Fichier prêt</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cliquez sur Suivant pour mapper les colonnes à vos champs
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
