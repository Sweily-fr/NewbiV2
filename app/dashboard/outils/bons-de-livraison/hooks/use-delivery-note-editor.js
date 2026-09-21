"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import {
  useDeliveryNote,
  useCreateDeliveryNote,
  useUpdateDeliveryNote,
  useNextDeliveryNumber,
  useLastDeliveryNotePrefix,
  DELIVERY_NOTE_STATUS,
} from "@/src/graphql/deliveryNoteQueries";
import { useErrorHandler } from "@/src/hooks/useErrorHandler";
import { useArchiveDocumentPdf } from "@/src/hooks/useArchiveDocumentPdf";
import { formatLocalDate } from "@/src/utils/dateFormatter";
import { refreshPrefixDate } from "@/src/utils/invoiceUtils";
import { mapOrganizationToCompanyInfo } from "@/src/utils/organizationCompanyInfo";

const LIST_URL = "/dashboard/outils/bons-de-livraison";

const defaultPrefix = () => {
  const now = new Date();
  return `BL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const emptyAddress = () => ({
  fullName: "",
  street: "",
  city: "",
  postalCode: "",
  country: "France",
});

const stripTypename = (value) => {
  if (Array.isArray(value)) return value.map(stripTypename);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "__typename") continue;
      out[k] = stripTypename(v);
    }
    return out;
  }
  return value;
};

const toInputDate = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const d =
    typeof value === "string" && /^\d+$/.test(value)
      ? new Date(parseInt(value, 10))
      : new Date(value);
  if (isNaN(d.getTime())) return "";
  return formatLocalDate(d);
};

/**
 * Valeurs par défaut d'un nouveau bon de livraison.
 */
function getInitialFormData(organization) {
  return {
    prefix: refreshPrefixDate(organization?.deliveryNotePrefix) || defaultPrefix(),
    number: "",
    issueDate: formatLocalDate(),
    deliveryDate: "",
    status: DELIVERY_NOTE_STATUS.DRAFT,
    client: null,
    companyInfo: mapOrganizationToCompanyInfo(organization),
    items: [],
    // Adresse de livraison : par défaut celle du client (recopiée à la sélection)
    useClientAddress: true,
    deliveryAddress: emptyAddress(),
    carrier: "",
    trackingNumber: "",
    notes: "",
    headerNotes: organization?.documentHeaderNotes || "",
    footerNotes: organization?.documentFooterNotes || "",
    customFields: [],
    appearance: {
      textColor: organization?.documentTextColor || "#000000",
      headerTextColor: organization?.documentHeaderTextColor || "#ffffff",
      headerBgColor: organization?.documentHeaderBgColor || "#5b50FF",
    },
    clientPositionRight: organization?.documentClientPositionRight || false,
    receivedBy: "",
    receivedAt: "",
    signatureDataUrl: null,
    sourceQuote: null,
    sourceInvoice: null,
  };
}

/**
 * Document GraphQL → valeurs du formulaire.
 */
function transformDeliveryNoteToFormData(dn, organization) {
  const doc = stripTypename(dn);
  const clientAddress = doc.client?.hasDifferentShippingAddress
    ? doc.client?.shippingAddress
    : doc.client?.address;
  const deliveryAddress = doc.deliveryAddress || null;
  const sameAsClient =
    !deliveryAddress ||
    (clientAddress &&
      (deliveryAddress.street || "") === (clientAddress.street || "") &&
      (deliveryAddress.postalCode || "") === (clientAddress.postalCode || "") &&
      (deliveryAddress.city || "") === (clientAddress.city || ""));

  return {
    prefix: doc.prefix || defaultPrefix(),
    number: doc.number || "",
    issueDate: toInputDate(doc.issueDate) || formatLocalDate(),
    deliveryDate: toInputDate(doc.deliveryDate),
    status: doc.status || DELIVERY_NOTE_STATUS.DRAFT,
    client: doc.client || null,
    companyInfo:
      doc.status === DELIVERY_NOTE_STATUS.DRAFT
        ? mapOrganizationToCompanyInfo(organization)
        : doc.companyInfo || mapOrganizationToCompanyInfo(organization),
    items: (doc.items || []).map((item) => ({
      description: item.description || "",
      details: item.details || "",
      reference: item.reference || "",
      productId: item.productId || "",
      quantity: item.quantity ?? 1,
      unit: item.unit || "",
    })),
    useClientAddress: !!sameAsClient,
    deliveryAddress: deliveryAddress
      ? { ...emptyAddress(), ...deliveryAddress }
      : emptyAddress(),
    carrier: doc.carrier || "",
    trackingNumber: doc.trackingNumber || "",
    notes: doc.notes || "",
    headerNotes: doc.headerNotes || "",
    footerNotes: doc.footerNotes || "",
    customFields: (doc.customFields || []).map((f) => ({
      name: f.key || f.name || "",
      value: f.value || "",
    })),
    appearance: doc.appearance || {
      textColor: "#000000",
      headerTextColor: "#ffffff",
      headerBgColor: "#5b50FF",
    },
    clientPositionRight: doc.clientPositionRight || false,
    receivedBy: doc.receivedBy || "",
    receivedAt: toInputDate(doc.receivedAt),
    signatureDataUrl: doc.signatureDataUrl || null,
    sourceQuote: doc.sourceQuote || null,
    sourceInvoice: doc.sourceInvoice || null,
  };
}

/**
 * Adresse de livraison effective à partir du client sélectionné.
 */
export function addressFromClient(client) {
  if (!client) return emptyAddress();
  const source = client.hasDifferentShippingAddress
    ? client.shippingAddress
    : client.address;
  return {
    fullName: client.shippingAddress?.fullName || client.name || "",
    street: source?.street || "",
    city: source?.city || "",
    postalCode: source?.postalCode || "",
    country: source?.country || "France",
  };
}

/**
 * Valeurs du formulaire → input GraphQL (Create/UpdateDeliveryNoteInput).
 * Jamais de prix : seules les quantités partent au serveur.
 */
function transformFormDataToInput(formData, { includeStatus = true } = {}) {
  const client = formData.client;
  const cleanClient = client
    ? {
        id: client.id,
        name:
          client.name ||
          `${client.firstName || ""} ${client.lastName || ""}`.trim() ||
          "Client",
        email: client.email || "",
        type: client.type || "INDIVIDUAL",
        firstName: client.firstName,
        lastName: client.lastName,
        siret: client.siret,
        vatNumber: client.vatNumber,
        isInternational: client.isInternational || false,
        hasDifferentShippingAddress: client.hasDifferentShippingAddress,
        address: client.address
          ? {
              street: client.address.street || "",
              city: client.address.city || "",
              postalCode: client.address.postalCode || "",
              country: client.address.country || "France",
            }
          : { street: "", city: "", postalCode: "", country: "France" },
        shippingAddress: client.shippingAddress
          ? {
              fullName: client.shippingAddress.fullName,
              street: client.shippingAddress.street,
              city: client.shippingAddress.city,
              postalCode: client.shippingAddress.postalCode,
              country: client.shippingAddress.country,
            }
          : null,
      }
    : null;

  const deliveryAddress = formData.useClientAddress
    ? addressFromClient(client)
    : formData.deliveryAddress;
  const hasAddress =
    deliveryAddress &&
    Object.values(deliveryAddress).some((v) => v && String(v).trim());

  const input = {
    prefix: formData.prefix || defaultPrefix(),
    issueDate: formData.issueDate || formatLocalDate(),
    deliveryDate: formData.deliveryDate || null,
    client: cleanClient,
    items: (formData.items || []).map((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      return {
        description: item.description || "",
        details: item.details || "",
        reference: item.reference || "",
        productId: item.productId || "",
        quantity,
        orderedQuantity: quantity,
        deliveredQuantity: quantity,
        unit: item.unit || "",
      };
    }),
    deliveryAddress: hasAddress
      ? {
          fullName: deliveryAddress.fullName || "",
          street: deliveryAddress.street || "",
          city: deliveryAddress.city || "",
          postalCode: deliveryAddress.postalCode || "",
          country: deliveryAddress.country || "",
        }
      : null,
    carrier: formData.carrier || "",
    trackingNumber: formData.trackingNumber || "",
    notes: formData.notes || "",
    headerNotes: formData.headerNotes || "",
    footerNotes: formData.footerNotes || "",
    customFields: (formData.customFields || [])
      .filter((f) => (f.name || "").trim() && (f.value || "").trim())
      .map((f) => ({ key: f.name, value: f.value })),
    appearance: {
      textColor: formData.appearance?.textColor || "#000000",
      headerTextColor: formData.appearance?.headerTextColor || "#ffffff",
      headerBgColor: formData.appearance?.headerBgColor || "#5b50FF",
    },
    clientPositionRight: formData.clientPositionRight || false,
    receivedBy: formData.receivedBy || "",
    receivedAt: formData.receivedAt || null,
    signatureDataUrl: formData.signatureDataUrl || null,
  };

  if (includeStatus) input.status = formData.status || "DRAFT";
  return input;
}

/**
 * Validation métier : client, date d'émission, au moins une ligne complète.
 */
function validateFormData(formData) {
  const errors = {};
  if (!formData.client?.id) {
    errors.client = "Veuillez sélectionner un client";
  }
  if (!formData.issueDate) {
    errors.issueDate = "La date d'émission est requise";
  }
  if (formData.deliveryDate && formData.issueDate) {
    if (new Date(formData.deliveryDate) < new Date(formData.issueDate)) {
      errors.deliveryDate =
        "La date de livraison doit être postérieure à la date d'émission";
    }
  }
  const items = formData.items || [];
  if (items.length === 0) {
    errors.items = { message: "Ajoutez au moins un article", details: [] };
  } else {
    const details = [];
    items.forEach((item, index) => {
      const fields = [];
      if (!item.description || !item.description.trim()) {
        fields.push("description");
      }
      if (!(parseFloat(item.quantity) > 0)) fields.push("quantity");
      if (fields.length > 0) details.push({ index, fields });
    });
    if (details.length > 0) {
      errors.items = {
        message: "Certains articles sont incomplets (désignation, quantité)",
        details,
      };
    }
  }
  if (!formData.useClientAddress) {
    const addr = formData.deliveryAddress || {};
    if (
      (addr.street || addr.city || addr.postalCode) &&
      (!addr.street || !addr.city || !addr.postalCode)
    ) {
      errors.deliveryAddress =
        "L'adresse de livraison doit comporter rue, code postal et ville";
    }
  }
  return errors;
}

export function useDeliveryNoteEditor({
  mode = "create",
  deliveryNoteId = null,
  organization = null,
}) {
  const router = useRouter();
  const { handleMutationError } = useErrorHandler();

  const {
    deliveryNote,
    loading: loadingDeliveryNote,
    error: deliveryNoteError,
  } = useDeliveryNote(mode !== "create" ? deliveryNoteId : null);
  const { createDeliveryNote, loading: creating } = useCreateDeliveryNote();
  const { updateDeliveryNote, loading: updating } = useUpdateDeliveryNote();
  const { archiveDocument } = useArchiveDocumentPdf("deliveryNote");
  const { prefix: lastPrefix } = useLastDeliveryNotePrefix();

  const [validationErrors, setValidationErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const form = useForm({
    defaultValues: getInitialFormData(organization),
    mode: "onChange",
  });
  const { watch, reset, getValues, setValue } = form;
  const formData = watch();

  // Organisation chargée après le premier render : rafraîchir companyInfo /
  // défauts, sans écraser une saisie en cours.
  const orgAppliedRef = useRef(false);
  useEffect(() => {
    if (!organization || mode !== "create" || orgAppliedRef.current) return;
    orgAppliedRef.current = true;
    const current = getValues();
    reset({
      ...getInitialFormData(organization),
      client: current.client,
      items: current.items,
      prefix:
        current.prefix && current.prefix !== defaultPrefix()
          ? current.prefix
          : refreshPrefixDate(lastPrefix) || defaultPrefix(),
    });
  }, [organization, mode, reset, getValues, lastPrefix]);

  // Préfixe du dernier BL en création (même convention que devis / BC)
  const prefixInitRef = useRef(false);
  useEffect(() => {
    if (mode !== "create" || prefixInitRef.current || !lastPrefix) return;
    prefixInitRef.current = true;
    setValue("prefix", refreshPrefixDate(lastPrefix) || defaultPrefix());
  }, [lastPrefix, mode, setValue]);

  // Chargement d'un BL existant (une seule fois par document : ne pas
  // écraser la saisie quand l'organisation ou le cache Apollo se rafraîchit)
  const loadedRef = useRef(null);
  useEffect(() => {
    if (mode === "create" || !deliveryNote) return;
    if (loadedRef.current === deliveryNote.id) return;
    loadedRef.current = deliveryNote.id;
    reset(transformDeliveryNoteToFormData(deliveryNote, organization));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryNote, mode, reset]);

  // companyInfo à jour pour l'aperçu d'un brouillon quand l'organisation arrive
  useEffect(() => {
    if (!organization) return;
    const status = getValues("status");
    if (mode === "create" || status === DELIVERY_NOTE_STATUS.DRAFT) {
      setValue("companyInfo", mapOrganizationToCompanyInfo(organization));
    }
  }, [organization, mode, getValues, setValue]);

  // Prochain numéro (aperçu uniquement : le serveur attribue le numéro définitif)
  const isDraft = formData.status === DELIVERY_NOTE_STATUS.DRAFT;
  const { nextNumber } = useNextDeliveryNumber(formData.prefix, {
    skip: !isDraft && mode !== "create",
  });

  const previewData = useMemo(() => {
    const client = formData.client;
    const deliveryAddress = formData.useClientAddress
      ? addressFromClient(client)
      : formData.deliveryAddress;
    return {
      ...formData,
      id: deliveryNoteId,
      number:
        isDraft || mode === "create"
          ? nextNumber || "0001"
          : formData.number,
      // L'aperçu affiche le numéro « à venir » d'un brouillon
      status: isDraft || mode === "create" ? "PENDING" : formData.status,
      deliveryAddress,
      customFields: (formData.customFields || []).map((f) => ({
        key: f.name,
        value: f.value,
      })),
      items: (formData.items || []).map((item) => ({
        ...item,
        quantity: parseFloat(item.quantity) || 0,
      })),
    };
  }, [formData, nextNumber, isDraft, mode, deliveryNoteId]);

  const runValidation = useCallback(
    (data) => {
      const errors = validateFormData(data);
      setValidationErrors(errors);
      return errors;
    },
    [setValidationErrors],
  );

  const goToList = useCallback(() => router.push(LIST_URL), [router]);

  /**
   * Enregistrer en brouillon (création ou mise à jour). Un BL déjà émis
   * est simplement mis à jour (son statut est inchangé).
   */
  const onSave = useCallback(async () => {
    const data = getValues();
    if (!data.client?.id) {
      toast.error("Sélectionnez un client avant d'enregistrer");
      setValidationErrors({ client: "Veuillez sélectionner un client" });
      return false;
    }
    if (!data.items || data.items.length === 0) {
      toast.error("Ajoutez au moins un article avant d'enregistrer");
      setValidationErrors({
        items: { message: "Ajoutez au moins un article", details: [] },
      });
      return false;
    }
    setSaving(true);
    try {
      if (mode === "create") {
        await createDeliveryNote({
          ...transformFormDataToInput(data, { includeStatus: false }),
          status: "DRAFT",
        });
        toast.success("Brouillon enregistré");
        goToList();
      } else {
        const wasDraft = deliveryNote?.status === DELIVERY_NOTE_STATUS.DRAFT;
        const updated = await updateDeliveryNote(deliveryNoteId, {
          ...transformFormDataToInput(data, { includeStatus: false }),
          ...(wasDraft ? {} : {}),
        });
        toast.success(
          wasDraft ? "Brouillon enregistré" : "Bon de livraison mis à jour",
        );
        if (!wasDraft && updated) archiveDocument(updated);
        goToList();
      }
      return true;
    } catch (error) {
      handleMutationError(
        error,
        mode === "create" ? "create" : "update",
        "deliveryNote",
        { description: error?.graphQLErrors?.[0]?.message || error?.message },
      );
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    getValues,
    mode,
    createDeliveryNote,
    updateDeliveryNote,
    deliveryNoteId,
    deliveryNote,
    goToList,
    handleMutationError,
    archiveDocument,
  ]);

  /**
   * Émettre le bon de livraison (DRAFT → PENDING) ou modifier un BL émis.
   * Renvoie { success, deliveryNote } pour la suite (toast, envoi email).
   */
  const onSubmit = useCallback(async () => {
    const data = getValues();
    const errors = runValidation(data);
    if (Object.keys(errors).length > 0) {
      const first = Object.values(errors)[0];
      toast.error(typeof first === "string" ? first : first?.message);
      return { success: false };
    }
    setSaving(true);
    try {
      let result;
      if (mode === "create") {
        result = await createDeliveryNote({
          ...transformFormDataToInput(data, { includeStatus: false }),
          status: "PENDING",
        });
      } else {
        const wasDraft = deliveryNote?.status === DELIVERY_NOTE_STATUS.DRAFT;
        result = await updateDeliveryNote(deliveryNoteId, {
          ...transformFormDataToInput(data, { includeStatus: false }),
          ...(wasDraft ? { status: "PENDING" } : {}),
        });
      }
      if (!result) throw new Error("Le bon de livraison n'a pas été enregistré");
      // Archivage PDF non bloquant (comme devis / BC)
      archiveDocument(result);
      return { success: true, deliveryNote: result };
    } catch (error) {
      handleMutationError(
        error,
        mode === "create" ? "create" : "update",
        "deliveryNote",
        { description: error?.graphQLErrors?.[0]?.message || error?.message },
      );
      return { success: false };
    } finally {
      setSaving(false);
    }
  }, [
    getValues,
    runValidation,
    mode,
    createDeliveryNote,
    updateDeliveryNote,
    deliveryNoteId,
    deliveryNote,
    archiveDocument,
    handleMutationError,
  ]);

  const setFormData = useCallback(
    (updater) => {
      const current = getValues();
      const next = typeof updater === "function" ? updater(current) : updater;
      Object.entries(next).forEach(([key, value]) => {
        if (current[key] !== value) {
          setValue(key, value, { shouldDirty: true });
        }
      });
    },
    [getValues, setValue],
  );

  return {
    form,
    formData,
    previewData,
    setFormData,
    loading: mode !== "create" && loadingDeliveryNote,
    saving: saving || creating || updating,
    onSave,
    onSubmit,
    deliveryNote,
    error: deliveryNoteError,
    validationErrors,
    setValidationErrors,
    nextDeliveryNumber: nextNumber,
    isDraft,
  };
}
