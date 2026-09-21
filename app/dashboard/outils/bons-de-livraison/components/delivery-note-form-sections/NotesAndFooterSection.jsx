"use client";

import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { TextareaNew } from "@/src/components/ui/textarea-new";
import { SuggestionDropdown } from "@/src/components/ui/suggestion-dropdown";
import { documentSuggestions } from "@/src/utils/document-suggestions";

const LABEL_CLASS =
  "text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55";

// Suggestions propres aux remarques de livraison
const DELIVERY_NOTE_SUGGESTIONS = [
  {
    label: "Bon état, sans réserve",
    value: "Marchandises livrées en bon état, sans réserve.",
  },
  {
    label: "Vérification des colis",
    value: "Merci de vérifier le nombre et l'état des colis à la réception.",
  },
  {
    label: "Réserves sous 3 jours",
    value:
      "Toute réserve doit être notifiée sur ce bon de livraison et confirmée par écrit sous 3 jours.",
  },
  {
    label: "Colis fragiles",
    value: "Colis fragiles : manipuler avec précaution.",
  },
];

/**
 * Notes du bon de livraison : même carte « Notes et bas de page » que les
 * devis, factures et bons de commande (libellés, suggestions), avec en plus
 * les remarques de livraison imprimées sous la liste des articles.
 */
export default function NotesAndFooterSection({ canEdit }) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext();
  const data = watch();

  return (
    <Card className="shadow-none border-none bg-transparent mb-0 mt-8 p-0">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 font-medium text-lg">
          Notes et bas de page
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        {/* Notes d'en-tête */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="header-notes" className={LABEL_CLASS}>
              Notes d'en-tête
            </Label>
            <SuggestionDropdown
              suggestions={documentSuggestions.headerNotes}
              onSelect={(value) =>
                setValue("headerNotes", value, { shouldDirty: true })
              }
              label="Suggestions"
            />
          </div>
          <div className="space-y-1">
            <TextareaNew
              id="header-notes"
              className={`mt-2 ${errors?.headerNotes ? "border-red-500" : ""}`}
              {...register("headerNotes", {
                maxLength: {
                  value: 1000,
                  message:
                    "Les notes d'en-tête ne doivent pas dépasser 1000 caractères",
                },
              })}
              defaultValue={data.headerNotes || ""}
              placeholder="Notes qui apparaîtront en haut du bon de livraison..."
              rows={3}
              disabled={!canEdit}
            />
            {errors?.headerNotes && (
              <p className="text-xs text-red-500">
                {errors.headerNotes.message}
              </p>
            )}
          </div>
        </div>

        {/* Remarques de livraison */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="delivery-notes" className={LABEL_CLASS}>
              Remarques de livraison
            </Label>
            <SuggestionDropdown
              suggestions={DELIVERY_NOTE_SUGGESTIONS}
              onSelect={(value) =>
                setValue("notes", value, { shouldDirty: true })
              }
              label="Suggestions"
            />
          </div>
          <div className="space-y-1">
            <TextareaNew
              id="delivery-notes"
              className={`mt-2 ${errors?.notes ? "border-red-500" : ""}`}
              {...register("notes", {
                maxLength: {
                  value: 2000,
                  message:
                    "Les remarques ne doivent pas dépasser 2000 caractères",
                },
              })}
              defaultValue={data.notes || ""}
              placeholder="Remarques imprimées sous la liste des articles (réserves, consignes...)"
              rows={4}
              disabled={!canEdit}
            />
            {errors?.notes && (
              <p className="text-xs text-red-500">{errors.notes.message}</p>
            )}
          </div>
        </div>

        {/* Notes de bas de page */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="footer-notes" className={LABEL_CLASS}>
              Notes de bas de page
            </Label>
            <SuggestionDropdown
              suggestions={documentSuggestions.footerNotes}
              onSelect={(value) =>
                setValue("footerNotes", value, { shouldDirty: true })
              }
              label="Suggestions"
            />
          </div>
          <div className="space-y-1">
            <TextareaNew
              id="footer-notes"
              className={`mt-2 ${errors?.footerNotes ? "border-red-500" : ""}`}
              {...register("footerNotes", {
                maxLength: {
                  value: 2000,
                  message:
                    "Les notes de bas de page ne doivent pas dépasser 2000 caractères",
                },
              })}
              defaultValue={data.footerNotes || ""}
              placeholder="Notes qui apparaîtront en bas du bon de livraison..."
              rows={3}
              disabled={!canEdit}
            />
            {errors?.footerNotes && (
              <p className="text-xs text-red-500">
                {errors.footerNotes.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
