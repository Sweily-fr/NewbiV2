"use client";

import { useId, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { ChevronDown, ChevronUp, Loader2, Plus, X } from "lucide-react";
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
import { AddChips, CheckedInput, Field, Hint, Section } from "./controls";
import ImageField from "./ImageField";
import ExtrasSection from "./ExtrasPanel";

// Partagés avec les panneaux d'élément
export { Field, ImageField };
import { emailProblem, linkProblem, networkLinkProblem } from "../links";
import { APPLY_MEMBER_SIGNATURE_V2, SIGNATURE_MEMBERS_V2 } from "../graphql";

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
 * Panneau « Contenu » : l'essentiel d'abord (prénom, nom, poste,
 * entreprise, e-mail), photo à côté du nom, logo à côté de l'entreprise ;
 * les champs facultatifs vides attendent un clic sur « + … », comme le
 * bouton d'action, la bannière et la mention (« En plus »).
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
        {/* Conseils toujours visibles (la vignette n'a que son infobulle),
            collés à leur rangée */}
        {photoOk && (
          <div className="-mt-2">
            <Hint>
              Photo : cliquez ou déposez un JPG, PNG, WebP ou HEIC (10 Mo max.),
              recadrée en carré.
            </Hint>
          </div>
        )}
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
        <AddChips
          items={missing([
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
              hint="PNG transparent conseillé, sauf logo noir ou très foncé"
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
        {logoOk && (
          <div className="-mt-2">
            <Hint>
              Logo : JPG, PNG, WebP ou SVG (10 Mo max.). PNG à fond transparent
              conseillé, sauf pour un logo noir ou très foncé.
            </Hint>
          </div>
        )}
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
        <AddChips
          items={missing([
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
        <AddChips
          items={missing([
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

      <ExtrasSection id={id} sig={sig} update={update} replace={replace} />
    </div>
  );
}
