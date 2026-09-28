"use client";

import { useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { toast } from "@/src/components/ui/sonner";
import { REMOVE_SIGNATURE_V2_IMAGE, UPLOAD_SIGNATURE_V2_IMAGE } from "../graphql";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, hint, type = "text", maxLength }) {
  return (
    <Field label={label} hint={hint}>
      <Input
        type={type}
        value={value || ""}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

/**
 * Zone d'image : clic ou glisser-déposer, envoi immédiat à l'API qui
 * recadre, optimise et rattache l'image à la signature.
 */
function ImageField({ id, kind, label, hint, image, onChanged, aspect = "square" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [upload] = useMutation(UPLOAD_SIGNATURE_V2_IMAGE);
  const [remove] = useMutation(REMOVE_SIGNATURE_V2_IMAGE);

  const send = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choisissez une image (JPG, PNG ou WebP)");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image trop volumineuse (10 Mo maximum)");
      return;
    }
    setBusy(true);
    try {
      const { data } = await upload({ variables: { id, kind, file } });
      onChanged(data?.uploadEmailSignatureV2Image);
      toast.success("Image ajoutée");
    } catch (err) {
      toast.error(err?.graphQLErrors?.[0]?.message || "Envoi impossible");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const clear = async () => {
    setBusy(true);
    try {
      const { data } = await remove({ variables: { id, kind } });
      onChanged(data?.removeEmailSignatureV2Image);
    } catch {
      toast.error("Suppression impossible");
    } finally {
      setBusy(false);
    }
  };

  const box =
    aspect === "wide" ? "h-20 w-full" : aspect === "logo" ? "h-16 w-32" : "h-20 w-20";

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            send(e.dataTransfer.files?.[0]);
          }}
          className={`relative flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%),linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%)] bg-[length:12px_12px] bg-[position:0_0,6px_6px] text-muted-foreground transition-colors hover:border-[#5a50ff] dark:bg-none dark:bg-neutral-800 ${
            dragging ? "border-[#5a50ff]" : "border-neutral-300 dark:border-neutral-700"
          }`}
          title="Cliquez ou déposez une image"
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus size={18} />
          )}
        </button>
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs cursor-pointer"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {image?.url ? "Changer" : "Choisir une image"}
          </Button>
          {image?.url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-red-600 hover:text-red-700 cursor-pointer"
              disabled={busy}
              onClick={clear}
            >
              <Trash2 size={12} />
              Retirer
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => send(e.target.files?.[0])}
        />
      </div>
    </Field>
  );
}

function SocialLinks({ social, networks, update }) {
  const used = new Set(social.map((s) => s.network));
  const available = networks.filter((n) => !used.has(n.id));
  const byId = Object.fromEntries(networks.map((n) => [n.id, n]));

  const setRow = (index, patch) => {
    const next = social.map((s, i) => (i === index ? { ...s, ...patch } : s));
    update({ social: next });
  };
  const removeRow = (index) => update({ social: social.filter((_, i) => i !== index) });
  const addRow = (network) => update({ social: [...social, { network, url: "" }] });

  return (
    <div className="space-y-2">
      {social.map((s, index) => (
        <div key={s.network} className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
            style={{ backgroundColor: byId[s.network]?.brandColor || "#5a50ff" }}
            title={byId[s.network]?.label}
          >
            {(byId[s.network]?.label || s.network).slice(0, 2).toUpperCase()}
          </span>
          <Input
            value={s.url}
            placeholder={`${byId[s.network]?.host || "https://"}/votre-profil`}
            onChange={(e) => setRow(index, { url: e.target.value })}
            className="h-8 text-sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 cursor-pointer"
            onClick={() => removeRow(index)}
            aria-label={`Retirer ${byId[s.network]?.label || s.network}`}
          >
            <X size={14} />
          </Button>
        </div>
      ))}
      {available.length > 0 && (
        <Select value="" onValueChange={addRow}>
          <SelectTrigger size="sm" className="h-8 w-full text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Plus size={12} />
              Ajouter un réseau
            </span>
            <SelectValue className="hidden" />
          </SelectTrigger>
          <SelectContent>
            {available.map((n) => (
              <SelectItem key={n.id} value={n.id}>
                {n.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

/**
 * Panneau « Contenu » : identité, coordonnées, réseaux, images.
 */
export default function ContentPanel({ id, sig, update, replace, catalog, template }) {
  const { identity, contact, social, images } = sig;

  return (
    <div className="space-y-6">
      <Section title="Identité">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Prénom"
            value={identity.firstName}
            onChange={(v) => update({ identity: { firstName: v } })}
            maxLength={80}
          />
          <TextField
            label="Nom"
            value={identity.lastName}
            onChange={(v) => update({ identity: { lastName: v } })}
            maxLength={80}
          />
        </div>
        <TextField
          label="Poste"
          value={identity.jobTitle}
          placeholder="Directrice artistique"
          onChange={(v) => update({ identity: { jobTitle: v } })}
          maxLength={120}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Service"
            value={identity.department}
            placeholder="Studio"
            onChange={(v) => update({ identity: { department: v } })}
            maxLength={120}
          />
          <TextField
            label="Entreprise"
            value={identity.company}
            onChange={(v) => update({ identity: { company: v } })}
            maxLength={120}
          />
        </div>
        <TextField
          label="Accroche"
          value={identity.tagline}
          placeholder="Une phrase, en italique sous le nom"
          onChange={(v) => update({ identity: { tagline: v } })}
          maxLength={200}
        />
      </Section>

      <Section title="Coordonnées">
        <TextField
          label="E-mail"
          type="email"
          value={contact.email}
          onChange={(v) => update({ contact: { email: v } })}
          maxLength={200}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Téléphone"
            type="tel"
            value={contact.phone}
            placeholder="01 23 45 67 89"
            onChange={(v) => update({ contact: { phone: v } })}
            maxLength={40}
          />
          <TextField
            label="Mobile"
            type="tel"
            value={contact.mobile}
            placeholder="06 12 34 56 78"
            onChange={(v) => update({ contact: { mobile: v } })}
            maxLength={40}
          />
        </div>
        <TextField
          label="Site web"
          value={contact.website}
          placeholder="votre-site.fr"
          onChange={(v) => update({ contact: { website: v } })}
          maxLength={300}
        />
        <TextField
          label="Adresse"
          value={contact.address}
          placeholder="12 rue des Lilas, 75011 Paris"
          onChange={(v) => update({ contact: { address: v } })}
          maxLength={300}
        />
      </Section>

      <Section title="Réseaux sociaux">
        <SocialLinks social={social} networks={catalog?.networks || []} update={update} />
      </Section>

      <Section title="Images">
        {template?.supports?.photo !== false && (
          <ImageField
            id={id}
            kind="PHOTO"
            label="Photo"
            hint="Recadrée automatiquement en carré, nette sur écran retina."
            image={images.photo}
            onChanged={replace}
          />
        )}
        {template?.supports?.logo !== false && (
          <ImageField
            id={id}
            kind="LOGO"
            label="Logo"
            hint="Privilégiez un PNG à fond transparent : il s'adapte à tous les clients mail, y compris en mode sombre."
            image={images.logo}
            onChanged={replace}
            aspect="logo"
          />
        )}
        <ImageField
          id={id}
          kind="BANNER"
          label="Bandeau"
          hint="Image large affichée sous la signature (activez-la dans Extras)."
          image={images.banner}
          onChanged={replace}
          aspect="wide"
        />
      </Section>
    </div>
  );
}
