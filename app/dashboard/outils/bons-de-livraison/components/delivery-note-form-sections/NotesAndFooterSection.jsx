"use client";

import { useFormContext } from "react-hook-form";
import { Label } from "@/src/components/ui/label";
import { TextareaNew } from "@/src/components/ui/textarea-new";

/**
 * Notes du bon de livraison : remarques de livraison (sous le tableau),
 * notes d'en-tête et de bas de page (mêmes emplacements que les devis).
 */
export default function NotesAndFooterSection({ canEdit }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Notes</h3>

      <div className="space-y-1">
        <Label htmlFor="dn-notes">Remarques de livraison</Label>
        <TextareaNew
          id="dn-notes"
          {...register("notes", {
            maxLength: {
              value: 2000,
              message: "Les remarques ne doivent pas dépasser 2000 caractères",
            },
          })}
          placeholder="Ex. Livraison sur rendez-vous, colis fragiles, réserves éventuelles..."
          rows={3}
          disabled={!canEdit}
        />
        {errors?.notes && (
          <p className="text-xs text-red-500">{errors.notes.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Apparaît sous la liste des articles, avant la zone de réception.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="dn-header-notes">Notes d'en-tête</Label>
          <TextareaNew
            id="dn-header-notes"
            {...register("headerNotes", {
              maxLength: {
                value: 1000,
                message:
                  "Les notes d'en-tête ne doivent pas dépasser 1000 caractères",
              },
            })}
            placeholder="Texte affiché en haut du bon de livraison"
            rows={3}
            disabled={!canEdit}
          />
          {errors?.headerNotes && (
            <p className="text-xs text-red-500">{errors.headerNotes.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="dn-footer-notes">Notes de bas de page</Label>
          <TextareaNew
            id="dn-footer-notes"
            {...register("footerNotes", {
              maxLength: {
                value: 2000,
                message:
                  "Les notes de bas de page ne doivent pas dépasser 2000 caractères",
              },
            })}
            placeholder="Texte affiché en bas du bon de livraison"
            rows={3}
            disabled={!canEdit}
          />
          {errors?.footerNotes && (
            <p className="text-xs text-red-500">{errors.footerNotes.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
