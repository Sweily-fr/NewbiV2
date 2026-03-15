"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import {
  Plus,
  Trash2,
  User,
  Mail,
  Phone,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";

export default function ClientContactsForm({ contacts = [], onChange }) {
  const [expandedContact, setExpandedContact] = useState(null);
  const [newContact, setNewContact] = useState({
    position: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [showNewForm, setShowNewForm] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return true;
    const phoneRegex = /^[\d\s\-+().]{6,20}$/;
    return phoneRegex.test(phone);
  };

  const validateContact = (contact) => {
    const newErrors = {};
    
    if (!contact.firstName && !contact.lastName) {
      newErrors.name = "Le prénom ou le nom est requis";
    }
    
    if (!contact.email && !contact.phone) {
      newErrors.contact = "Un email ou un téléphone est requis";
    }
    
    if (contact.email && !validateEmail(contact.email)) {
      newErrors.email = "Email invalide";
    }
    
    if (contact.phone && !validatePhone(contact.phone)) {
      newErrors.phone = "Téléphone invalide";
    }
    
    return newErrors;
  };

  const handleAddContact = () => {
    const validationErrors = validateContact(newContact);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const contactToAdd = {
      ...newContact,
      id: `temp-${Date.now()}`,
    };

    onChange([...contacts, contactToAdd]);

    // Réinitialiser le formulaire
    setNewContact({
      position: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });
    setShowNewForm(false);
    setErrors({});
  };

  const handleRemoveContact = (contactId) => {
    const updatedContacts = contacts.filter(c => c.id !== contactId);
    onChange(updatedContacts);
  };

  const handleUpdateContact = (contactId, field, value) => {
    const updatedContacts = contacts.map(c => 
      c.id === contactId ? { ...c, [field]: value } : c
    );
    onChange(updatedContacts);
  };

  const getContactDisplayName = (contact) => {
    if (contact.firstName && contact.lastName) {
      return `${contact.firstName} ${contact.lastName}`;
    }
    return contact.firstName || contact.lastName || "Contact sans nom";
  };

  return (
    <div className="space-y-4 mt-6 pt-4 border-t col-span-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Contacts additionnels
          </span>
          {contacts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {contacts.length}
            </Badge>
          )}
        </div>
        {!showNewForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowNewForm(true)}
            className="h-8"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Liste des contacts existants */}
      {contacts.length > 0 && (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="border rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                onClick={() => setExpandedContact(expandedContact === contact.id ? null : contact.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-8 rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium text-sm">
                        {getContactDisplayName(contact)}
                      </span>
                    {contact.position && (
                      <span className="text-xs text-muted-foreground ml-2">
                        — {contact.position}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {contact.email && (
                    <Badge 
                      variant="outline" 
                      className="text-xs cursor-pointer hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(contact.email);
                        toast.success("Email copié");
                      }}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      {contact.email}
                      <Copy className="h-3 w-3 ml-1 opacity-50" />
                    </Badge>
                  )}
                  {expandedContact === contact.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Détails du contact (expandable) */}
              {expandedContact === contact.id && (
                <div className="p-3 pt-0 space-y-3 border-t bg-muted/30">
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-normal text-muted-foreground">Poste</Label>
                      <Input
                        value={contact.position || ""}
                        onChange={(e) => handleUpdateContact(contact.id, "position", e.target.value)}
                        placeholder="Ex: Directeur commercial"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-normal text-muted-foreground">Prénom</Label>
                      <Input
                        value={contact.firstName || ""}
                        onChange={(e) => handleUpdateContact(contact.id, "firstName", e.target.value)}
                        placeholder="Prénom"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-normal text-muted-foreground">Nom</Label>
                      <Input
                        value={contact.lastName || ""}
                        onChange={(e) => handleUpdateContact(contact.id, "lastName", e.target.value)}
                        placeholder="Nom"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-normal text-muted-foreground">Email</Label>
                      <Input
                        type="email"
                        value={contact.email || ""}
                        onChange={(e) => handleUpdateContact(contact.id, "email", e.target.value)}
                        placeholder="email@exemple.com"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-normal text-muted-foreground">Téléphone</Label>
                      <Input
                        type="tel"
                        value={contact.phone || ""}
                        onChange={(e) => handleUpdateContact(contact.id, "phone", e.target.value)}
                        placeholder="06 12 34 56 78"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveContact(contact.id)}
                      className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulaire d'ajout de contact */}
      {showNewForm && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Nouveau contact</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowNewForm(false);
                setErrors({});
                setNewContact({
                  position: "",
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                });
              }}
              className="h-7 w-7 p-0"
            >
              ×
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-normal">Poste</Label>
              <Input
                value={newContact.position}
                onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                placeholder="Ex: Directeur commercial"
                className="h-9"
              />
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-normal">Prénom</Label>
                <Input
                  value={newContact.firstName}
                  onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                  placeholder="Prénom"
                  className={cn("h-9", errors.name && "border-red-500")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-normal">Nom</Label>
                <Input
                  value={newContact.lastName}
                  onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                  placeholder="Nom"
                  className={cn("h-9", errors.name && "border-red-500")}
                />
              </div>
            </div>
            {errors.name && (
              <p className="col-span-2 text-xs text-red-500">{errors.name}</p>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-normal">Email</Label>
              <Input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="email@exemple.com"
                className={cn("h-9", (errors.email || errors.contact) && "border-red-500")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-normal">Téléphone</Label>
              <Input
                type="tel"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="06 12 34 56 78"
                className={cn("h-9", (errors.phone || errors.contact) && "border-red-500")}
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone}</p>
              )}
            </div>
            {errors.contact && (
              <p className="col-span-2 text-xs text-red-500">{errors.contact}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowNewForm(false);
                setErrors({});
                setNewContact({
                  position: "",
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                });
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddContact}
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter le contact
            </Button>
          </div>
        </div>
      )}

      {/* Message si aucun contact */}
      {contacts.length === 0 && !showNewForm && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun contact additionnel. Cliquez sur "Ajouter" pour créer un contact.
        </p>
      )}
    </div>
  );
}
