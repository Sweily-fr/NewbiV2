"use client";

import { useId, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { toast } from "@/src/components/ui/sonner";
import { CheckedInput, FIELD_LABEL, Hint, Section } from "./controls";
import { emailProblem, linkProblem, networkLinkProblem } from "../links";
import {
  APPLY_MEMBER_SIGNATURE_V2,
  REMOVE_SIGNATURE_V2_IMAGE,
  SIGNATURE_MEMBERS_V2,
  UPLOAD_SIGNATURE_V2_IMAGE,
} from "../graphql";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function Field({ label, children, hint, htmlFor }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className={FIELD_LABEL}>
        {label}
      </Label>
      {children}
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  maxLength,
  warning,
}) {
  // Libellé toujours relié au champ (clic, lecteurs d'écran)
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} hint={hint} htmlFor={inputId}>
      <CheckedInput
        id={inputId}
        type={type}
        value={value || ""}
        placeholder={placeholder}
        maxLength={maxLength}
        warning={warning}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

/**
 * Zone d'image : clic ou glisser-déposer, envoi immédiat à l'API qui
 * recadre, optimise et rattache l'image à la signature.
 */
export function ImageField({
  id,
  kind,
  label,
  hint,
  image,
  onChanged,
  aspect = "square",
  fieldId,
  compact = false,
}) {
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

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => send(e.target.files?.[0])}
    />
  );
  // Vignette seule (à côté du nom, de l'entreprise) : un clic ou un dépôt
  // pour ajouter ou changer l'image, « Retirer » dessous
  if (compact) {
    return (
      <div className="flex shrink-0 flex-col items-center gap-1">
        <button
          id={fieldId}
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
          title={`${image?.url ? "Changer" : "Ajouter"} : ${hint || label}`}
          aria-label={`${image?.url ? "Changer" : "Ajouter"} ${label.toLowerCase()}`}
          className={`flex ${aspect === "logo" ? "h-14 w-24" : "h-[72px] w-[72px]"} items-center justify-center overflow-hidden rounded-[9px] border border-dashed text-muted-foreground transition-[border] duration-[80ms] cursor-pointer ${
            dragging
              ? "border-[#5b4fff]"
              : "border-[#D1D3D8] hover:border-[#9FA1A7] dark:border-[#44444A] dark:hover:border-[#5c5c63]"
          }`}
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-[11px]">
              <ImagePlus size={16} />
              {label}
            </span>
          )}
        </button>
        {image?.url && !busy && (
          <button
            type="button"
            onClick={clear}
            className="text-[11px] text-muted-foreground hover:text-red-600 cursor-pointer"
          >
            Retirer
          </button>
        )}
        {input}
      </div>
    );
  }

  // Image large : la zone prend la place restante, les boutons restent visibles
  const box =
    aspect === "wide"
      ? "h-20 min-w-0 flex-1"
      : aspect === "logo"
        ? "h-16 w-32 shrink-0"
        : "h-20 w-20 shrink-0";

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3" id={fieldId}>
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
          className={`relative flex ${box} items-center justify-center overflow-hidden rounded-[9px] border border-dashed bg-[linear-gradient(45deg,#f5f5f5_25%,transparent_25%,transparent_75%,#f5f5f5_75%),linear-gradient(45deg,#f5f5f5_25%,transparent_25%,transparent_75%,#f5f5f5_75%)] bg-[length:12px_12px] bg-[position:0_0,6px_6px] text-muted-foreground transition-[border] duration-[80ms] cursor-pointer dark:bg-none dark:bg-neutral-900 ${
            dragging
              ? "border-[#5b4fff]"
              : "border-[#D1D3D8] hover:border-[#9FA1A7] dark:border-[#44444A] dark:hover:border-[#5c5c63]"
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
        <div className="flex shrink-0 flex-col gap-1.5">
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
        {input}
      </div>
    </Field>
  );
}

export function SocialLinks({ social, networks, update }) {
  const used = new Set(social.map((s) => s.network));
  const available = networks.filter((n) => !used.has(n.id));
  const byId = Object.fromEntries(networks.map((n) => [n.id, n]));

  const setRow = (index, patch) => {
    const next = social.map((s, i) => (i === index ? { ...s, ...patch } : s));
    update({ social: next });
  };
  const removeRow = (index) => update({ social: social.filter((_, i) => i !== index) });
  const addRow = (network) => update({ social: [...social, { network, url: "" }] });
  // L'ordre de la liste est celui des icônes (et de leurs lignes)
  const moveRow = (index, delta) => {
    const next = [...social];
    const [row] = next.splice(index, 1);
    next.splice(index + delta, 0, row);
    update({ social: next });
  };
  const arrow =
    "flex h-4 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground cursor-pointer disabled:cursor-default";

  return (
    <div className="space-y-2">
      {social.map((s, index) => (
        <div key={s.network} className="flex items-start gap-2">
          {social.length > 1 && (
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                className={arrow}
                disabled={index === 0}
                onClick={() => moveRow(index, -1)}
                aria-label={`Monter ${byId[s.network]?.label || s.network}`}
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                className={arrow}
                disabled={index === social.length - 1}
                onClick={() => moveRow(index, 1)}
                aria-label={`Descendre ${byId[s.network]?.label || s.network}`}
              >
                <ChevronDown size={12} />
              </button>
            </div>
          )}
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
            style={{ backgroundColor: byId[s.network]?.brandColor || "#5a50ff" }}
            title={byId[s.network]?.label}
          >
            {(byId[s.network]?.label || s.network).slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CheckedInput
              value={s.url}
              placeholder={`${byId[s.network]?.host || "https://"}/votre-profil`}
              onChange={(e) => setRow(index, { url: e.target.value })}
              aria-label={`Lien ${byId[s.network]?.label || s.network}`}
              warning={networkLinkProblem(
                s.url,
                s.network,
                byId[s.network]?.label || s.network,
              )}
            />
          </div>
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
          <SelectTrigger className="w-full">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Plus size={14} />
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

const initials = (name) =>
  String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

function MemberOption({ member }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar className="h-5 w-5">
        {member.image && <AvatarImage src={member.image} alt="" />}
        <AvatarFallback className="text-[9px]">{initials(member.name)}</AvatarFallback>
      </Avatar>
      <span className="truncate">
        {member.name}
        {member.isMe && <span className="text-muted-foreground"> (vous)</span>}
      </span>
    </span>
  );
}

/**
 * Personne de la signature : un membre de l'espace, soi-même par défaut.
 * Le choisir reprend son nom, son e-mail, son portable et sa photo ; la
 * société, le standard, le site et l'adresse ne complètent que les champs
 * vides. Le poste et le reste de la signature sont conservés.
 */
function PersonField({ id, sig, replace, flush }) {
  const [busy, setBusy] = useState(false);
  const { data } = useQuery(SIGNATURE_MEMBERS_V2, { fetchPolicy: "cache-and-network" });
  const [apply] = useMutation(APPLY_MEMBER_SIGNATURE_V2);
  const members = data?.signatureMembersV2 || [];
  const me = members.find((m) => m.isMe);
  const value = sig.memberUserId || me?.userId || "";

  const choose = async (memberUserId) => {
    if (!memberUserId || memberUserId === value) return;
    setBusy(true);
    try {
      // Enregistre d'abord une saisie en cours, sinon elle écraserait le résultat
      await flush();
      const { data: result } = await apply({ variables: { id, memberUserId } });
      replace(result?.applyMemberToEmailSignatureV2, { resetHistory: true });
      const member = members.find((m) => m.userId === memberUserId);
      toast.success(`Informations de ${member?.name || "la personne"} reprises`);
    } catch (err) {
      toast.error(err?.graphQLErrors?.[0]?.message || "Changement impossible");
    } finally {
      setBusy(false);
    }
  };

  // Seul dans l'espace : rien à choisir, rien à afficher
  if (members.length <= 1) return null;

  return (
    <Field
      label="Signature de"
      hint="Son nom, son e-mail, son portable et sa photo sont repris de son profil."
    >
      <Select value={value} onValueChange={choose} disabled={busy}>
        <SelectTrigger id="sig-field-member" className="w-full">
          {busy ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              Mise à jour…
            </span>
          ) : (
            <SelectValue placeholder="Choisir une personne" />
          )}
        </SelectTrigger>
        <SelectContent>
          {members.map((m) => (
            <SelectItem key={m.userId} value={m.userId}>
              <MemberOption member={m} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/**
 * Champs facultatifs vides, proposés en petits boutons « + Service »… : le
 * panneau s'ouvre sur l'essentiel, le reste vient à la demande.
 */
function AddFields({ fields, onAdd }) {
  if (fields.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {fields.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onAdd(f.key)}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-[#D1D3D8] px-2 py-1 text-xs text-muted-foreground hover:border-[#9FA1A7] hover:text-foreground cursor-pointer dark:border-[#44444A]"
        >
          <Plus size={12} />
          {f.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Panneau « Contenu » : l'essentiel d'abord (prénom, nom, poste,
 * entreprise, e-mail), photo à côté du nom, logo à côté de l'entreprise ;
 * les champs facultatifs vides attendent un clic sur « + … ».
 */
export default function ContentPanel({ id, sig, update, replace, flush, catalog, template }) {
  const { identity, contact, social, images } = sig;
  // Champ facultatif affiché : rempli, ajouté à la demande, ou déjà vu
  // rempli (il ne disparaît pas quand on l'efface pour le retaper)
  const [opened, setOpened] = useState(() => new Set());
  const seen = useRef(new Set());
  const shows = (key, value) => {
    if (value) seen.current.add(key);
    return Boolean(value) || opened.has(key) || seen.current.has(key);
  };
  const add = (key) => {
    setOpened((current) => new Set(current).add(key));
    setTimeout(() => document.getElementById(`sig-field-${key}`)?.focus(), 30);
  };
  const missing = (defs) => defs.filter((d) => !shows(d.key, d.value));
  const setIdentity = (key) => (v) => update({ identity: { [key]: v } });
  const setContact = (key) => (v) => update({ contact: { [key]: v } });
  const photoOk = template?.supports?.photo !== false;
  const logoOk = template?.supports?.logo !== false;
  const showPhone = shows("phone", contact.phone);
  const showMobile = shows("mobile", contact.mobile);

  return (
    <div className="space-y-8">
      <PersonField id={id} sig={sig} replace={replace} flush={flush} />

      <Section title="Vous">
        <div className="flex items-start gap-4">
          {photoOk && (
            <ImageField
              compact
              id={id}
              kind="PHOTO"
              fieldId="sig-field-photo"
              label="Photo"
              hint="recadrée automatiquement en carré"
              image={images.photo}
              onChanged={replace}
            />
          )}
          <div className="min-w-0 flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                id="sig-field-firstName"
                label="Prénom"
                value={identity.firstName}
                onChange={setIdentity("firstName")}
                maxLength={80}
              />
              <TextField
                id="sig-field-lastName"
                label="Nom"
                value={identity.lastName}
                onChange={setIdentity("lastName")}
                maxLength={80}
              />
            </div>
            <TextField
              id="sig-field-jobTitle"
              label="Poste"
              value={identity.jobTitle}
              placeholder="Directrice artistique"
              onChange={setIdentity("jobTitle")}
              maxLength={120}
            />
          </div>
        </div>
        {shows("department", identity.department) && (
          <TextField
            id="sig-field-department"
            label="Service"
            value={identity.department}
            placeholder="Studio"
            onChange={setIdentity("department")}
            maxLength={120}
          />
        )}
        {shows("tagline", identity.tagline) && (
          <TextField
            id="sig-field-tagline"
            label="Accroche"
            value={identity.tagline}
            placeholder="Une phrase, en italique sous le nom"
            onChange={setIdentity("tagline")}
            maxLength={200}
          />
        )}
        <AddFields
          fields={missing([
            { key: "department", label: "Service", value: identity.department },
            { key: "tagline", label: "Accroche", value: identity.tagline },
          ])}
          onAdd={add}
        />
      </Section>

      <Section title="Entreprise">
        <div className="flex items-start gap-4">
          {logoOk && (
            <ImageField
              compact
              id={id}
              kind="LOGO"
              fieldId="sig-field-logo"
              label="Logo"
              hint="un PNG à fond transparent s'adapte au mode sombre"
              image={images.logo}
              onChanged={replace}
              aspect="logo"
            />
          )}
          <div className="min-w-0 flex-1">
            <TextField
              id="sig-field-company"
              label="Nom de l'entreprise"
              value={identity.company}
              onChange={setIdentity("company")}
              maxLength={120}
            />
          </div>
        </div>
        {shows("website", contact.website) && (
          <TextField
            id="sig-field-website"
            label="Site web"
            value={contact.website}
            placeholder="votre-site.fr"
            onChange={setContact("website")}
            maxLength={300}
            warning={linkProblem(contact.website)}
          />
        )}
        {shows("address", contact.address) && (
          <TextField
            id="sig-field-address"
            label="Adresse"
            value={contact.address}
            placeholder="12 rue des Lilas, 75011 Paris"
            onChange={setContact("address")}
            maxLength={300}
          />
        )}
        <AddFields
          fields={missing([
            { key: "website", label: "Site web", value: contact.website },
            { key: "address", label: "Adresse", value: contact.address },
          ])}
          onAdd={add}
        />
      </Section>

      <Section title="Coordonnées">
        <TextField
          id="sig-field-email"
          label="E-mail"
          type="email"
          value={contact.email}
          onChange={setContact("email")}
          maxLength={200}
          warning={emailProblem(contact.email)}
        />
        {(showPhone || showMobile) && (
          <div className="grid grid-cols-2 gap-4">
            {showPhone && (
              <TextField
                id="sig-field-phone"
                label="Téléphone"
                type="tel"
                value={contact.phone}
                placeholder="01 23 45 67 89"
                onChange={setContact("phone")}
                maxLength={40}
              />
            )}
            {showMobile && (
              <TextField
                id="sig-field-mobile"
                label="Mobile"
                type="tel"
                value={contact.mobile}
                placeholder="06 12 34 56 78"
                onChange={setContact("mobile")}
                maxLength={40}
              />
            )}
          </div>
        )}
        <AddFields
          fields={missing([
            { key: "phone", label: "Téléphone", value: contact.phone },
            { key: "mobile", label: "Mobile", value: contact.mobile },
          ])}
          onAdd={add}
        />
      </Section>

      <Section title="Réseaux sociaux">
        <div id="sig-field-social" tabIndex={-1} className="outline-none" />
        <SocialLinks social={social} networks={catalog?.networks || []} update={update} />
      </Section>
    </div>
  );
}
