"use client";

import { useFormContext } from "react-hook-form";
import { Calendar as CalendarIcon, Info, Truck, Hash } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/src/components/ui/calendar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";

const LABEL_CLASS =
  "text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55";

const parseDate = (value) => {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
};

function DateField({
  label,
  value,
  onChange,
  disabled,
  error,
  required = false,
  tooltip,
  clearable = false,
  name,
}) {
  const date = parseDate(value);
  return (
    <div className="space-y-2" data-error-field={name}>
      <div className="flex items-center gap-2">
        <Label className={LABEL_CLASS}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            type="button"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              error && "border-destructive focus-visible:ring-destructive",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: fr }) : "Choisir une date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selected) => {
              if (selected) onChange(format(selected, "yyyy-MM-dd"));
            }}
            initialFocus
            locale={fr}
          />
          {clearable && date && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => onChange("")}
              >
                Effacer la date
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Numéro, dates, transporteur et numéro de suivi.
 * Le numéro définitif est attribué par le serveur à l'émission : en brouillon
 * on affiche le prochain numéro de la séquence à titre indicatif.
 */
export default function DeliveryInfoSection({
  canEdit,
  isDraft = true,
  nextDeliveryNumber,
  validationErrors = {},
}) {
  const { watch, setValue, register } = useFormContext();
  const prefix = watch("prefix");
  const number = watch("number");
  const issueDate = watch("issueDate");
  const deliveryDate = watch("deliveryDate");

  const displayedNumber = isDraft ? nextDeliveryNumber || "…" : number;

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Informations de livraison</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className={LABEL_CLASS}>Préfixe</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                <p>
                  Préfixe de numérotation (ex. BL-202609). La séquence est
                  continue par préfixe : BL-202609-0001, 0002…
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            value={prefix || ""}
            onChange={(e) =>
              setValue("prefix", e.target.value.toUpperCase(), {
                shouldDirty: true,
              })
            }
            placeholder="BL-202609"
            maxLength={10}
            disabled={!canEdit || !isDraft}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className={LABEL_CLASS}>Numéro</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                <p>
                  {isDraft
                    ? "Numéro attribué automatiquement à l'émission du bon de livraison (prochain numéro de la séquence)."
                    : "Le numéro d'un bon de livraison émis est verrouillé."}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={displayedNumber || ""}
              readOnly
              disabled
              className="pl-9 bg-muted/40"
            />
          </div>
        </div>

        <DateField
          name="issueDate"
          label="Date d'émission"
          required
          value={issueDate}
          onChange={(v) =>
            setValue("issueDate", v, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          disabled={!canEdit}
          error={validationErrors?.issueDate}
          tooltip="Date à laquelle le bon de livraison est établi. Par défaut, la date du jour."
        />

        <DateField
          name="deliveryDate"
          label="Date de livraison"
          value={deliveryDate}
          onChange={(v) => setValue("deliveryDate", v, { shouldDirty: true })}
          disabled={!canEdit}
          error={validationErrors?.deliveryDate}
          clearable
          tooltip="Date de livraison prévue ou effective (optionnelle)."
        />

        <div className="space-y-2">
          <Label className={LABEL_CLASS}>Transporteur</Label>
          <div className="relative">
            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              {...register("carrier")}
              placeholder="Ex. Chronopost, DHL, livraison en propre"
              maxLength={100}
              disabled={!canEdit}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className={LABEL_CLASS}>Numéro de suivi</Label>
          <Input
            {...register("trackingNumber")}
            placeholder="Ex. XY123456789FR"
            maxLength={100}
            disabled={!canEdit}
            className="font-mono"
          />
        </div>
      </div>
    </div>
  );
}
