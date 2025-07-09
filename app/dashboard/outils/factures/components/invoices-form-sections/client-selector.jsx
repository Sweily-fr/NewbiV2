"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { Search, User, Plus, Building, Mail, Phone, Loader2, ChevronDown, X, CheckIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";

// Import GraphQL hooks and utilities
import { 
  useClients, 
  useCreateClient, 
  CLIENT_TYPE_LABELS
} from '@/src/graphql/clientQueries';

export default function ClientSelector({ 
  onSelect, 
  selectedClient,
  placeholder = "Rechercher un client...",
  className,
  disabled = false
}) {
  const id = useId();
  const [activeTab, setActiveTab] = useState("existing");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");
  const defaultAddress = {
    street: "",
    postalCode: "",
    city: "",
    country: "France"
  };

  const [newClientForm, setNewClientForm] = useState(() => ({
    type: "INDIVIDUAL",
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    siret: "",
    vatNumber: "",
    hasDifferentShippingAddress: false,
    address: { ...defaultAddress },
    shippingAddress: { ...defaultAddress },
    notes: ""
  }));
  const inputRef = useRef(null);

  // Synchroniser selectedValue avec selectedClient prop
  useEffect(() => {
    if (selectedClient) {
      setSelectedValue(selectedClient.name);
    } else {
      setSelectedValue("");
    }
  }, [selectedClient]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Use GraphQL hooks
  const { clients, loading } = useClients({
    search: debouncedQuery,
    limit: 10
  });
  const { createClient, loading: createLoading } = useCreateClient();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleClientSelect = (client) => {
    onSelect?.(client);
    setSelectedValue(client.name);
    setQuery(""); // Vider la recherche après sélection
  };

  const getClientIcon = (type) => {
    return type === "COMPANY" ? Building : User;
  };

  const handleNewClientSubmit = async (e) => {
    e.preventDefault();
    
    // Validation des champs obligatoires
    const requiredFields = [
      { field: 'name', label: 'Le nom' },
      { field: 'email', label: "L'email" },
      { field: 'address.street', label: "La rue de l'adresse" },
      { field: 'address.postalCode', label: 'Le code postal' },
      { field: 'address.city', label: 'La ville' }
    ];
    
    for (const { field, label } of requiredFields) {
      const value = field.split('.').reduce((obj, key) => obj?.[key], newClientForm);
      if (!value) {
        toast.error(`${label} est obligatoire`);
        return;
      }
    }
    
    try {
      // Préparation des données pour l'API
      const clientData = {
        ...newClientForm,
        // Nettoyage des champs vides
        phone: newClientForm.phone || undefined,
        siret: newClientForm.siret || undefined,
        vatNumber: newClientForm.vatNumber || undefined,
        notes: newClientForm.notes || undefined,
        address: {
          street: newClientForm.address.street,
          postalCode: newClientForm.address.postalCode,
          city: newClientForm.address.city,
          country: newClientForm.address.country || "France"
        },
        // Ne pas inclure l'adresse de livraison si elle n'est pas utilisée
        ...(newClientForm.hasDifferentShippingAddress && {
          shippingAddress: {
            street: newClientForm.shippingAddress.street || undefined,
            postalCode: newClientForm.shippingAddress.postalCode || undefined,
            city: newClientForm.shippingAddress.city || undefined,
            country: newClientForm.shippingAddress.country || "France"
          }
        })
      };

      const result = await createClient({
        variables: { 
          input: clientData 
        }
      });

      if (result.data?.createClient) {
        toast.success("Client créé avec succès");
        onSelect?.(result.data.createClient);
        resetNewClientForm();
        setActiveTab("existing");
      }
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      toast.error(error.message || "Erreur lors de la création du client");
    }
  };

  const resetNewClientForm = () => {
    setNewClientForm({
      type: "INDIVIDUAL",
      name: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      siret: "",
      vatNumber: "",
      hasDifferentShippingAddress: false,
      address: { ...defaultAddress },
      shippingAddress: { ...defaultAddress },
      notes: ""
    });
  };

  const handleSwitchToNewClient = () => {
    setActiveTab("new");
    setNewClientForm(prev => ({
      ...prev,
      name: query
    }));
    setQuery("");
  };

  return (
    <div className={cn("w-full", className)}>
      <Card className="shadow-none border-none bg-transparent">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <CardHeader className="p-0 pb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Client existant</span>
              </TabsTrigger>
              <TabsTrigger value="new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Nouveau client</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent className="space-y-6 p-0">
              <TabsContent value="existing" className="m-0">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id={id}
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between px-3 font-normal h-10 rounded-lg text-sm"
                          disabled={disabled}
                        >
                          <span className={cn("truncate")}>
                            {selectedValue || placeholder}
                          </span>
                          <ChevronDown
                            size={16}
                            className="shrink-0"
                            aria-hidden="true"
                          />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput 
                            placeholder="Rechercher un client..." 
                            value={query}
                            onValueChange={setQuery}
                          />
                          <CommandList>
                            {loading ? (
                              <div className="p-3 text-center">
                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                <span className="text-sm ml-2">Recherche...</span>
                              </div>
                            ) : (
                              <>
                                <CommandEmpty>
                                  <div className="p-3 text-center">
                                    <p className="text-sm mb-2">
                                      Aucun client trouvé{query && ` pour "${query}"`}
                                    </p>
                                    {query && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSwitchToNewClient}
                                        className="text-xs"
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Créer "{query}" comme nouveau client
                                      </Button>
                                    )}
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {clients?.map((client) => {
                                    const IconComponent = getClientIcon(client.type);
                                    return (
                                      <CommandItem
                                        key={client.id}
                                        value={client.name}
                                        onSelect={() => {
                                          handleClientSelect(client);
                                          setOpen(false);
                                        }}
                                        className="flex items-center space-x-3 px-3 py-2"
                                      >
                                        <div className="p-1 bg-muted rounded">
                                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium truncate">
                                            {client.name}
                                          </div>
                                          <div className="text-sm truncate">
                                            {client.email}
                                          </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {CLIENT_TYPE_LABELS[client.type]}
                                        </Badge>
                                        {selectedClient?.id === client.id && (
                                          <CheckIcon size={16} className="ml-auto" />
                                        )}
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    {selectedClient && (
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded">
                              {React.createElement(getClientIcon(selectedClient.type), {
                                className: "h-4 w-4 text-primary"
                              })}
                            </div>
                            <div>
                              <div className="font-medium">{selectedClient.name}</div>
                              <div className="text-sm">{selectedClient.email}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {CLIENT_TYPE_LABELS[selectedClient.type]}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onSelect?.(null);
                              setSelectedValue("");
                              setQuery("");
                            }}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Supprimer la sélection</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="new" className="m-0">
                <div className="space-y-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="client-type" className="text-sm font-medium">
                        Type de client
                      </Label>
                      <div className="w-full">
                        <Select
                          value={newClientForm.type}
                          onValueChange={(value) => setNewClientForm(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger className="w-full h-10 rounded-lg text-sm">
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                          <SelectContent className="w-full">
                            <SelectItem value="INDIVIDUAL">Particulier</SelectItem>
                            <SelectItem value="COMPANY">Entreprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {newClientForm.type === 'COMPANY' ? (
                      <div className="space-y-2">
                        <Label htmlFor="client-name" className="text-sm font-medium">
                          Nom de l'entreprise
                        </Label>
                        <div className="relative">
                          <Input
                            id="client-name"
                            value={newClientForm.name}
                            onChange={(e) => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Nom de l'entreprise"
                            className="h-10 rounded-lg text-sm w-full"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="client-firstname" className="text-sm font-medium">
                            Prénom
                          </Label>
                          <Input
                            id="client-firstname"
                            value={newClientForm.firstName}
                            onChange={(e) => setNewClientForm(prev => ({
                              ...prev,
                              firstName: e.target.value,
                              name: `${e.target.value} ${prev.lastName || ''}`.trim()
                            }))}
                            placeholder="Prénom"
                            className="h-10 rounded-lg text-sm w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="client-lastname" className="text-sm font-medium">
                            Nom
                          </Label>
                          <Input
                            id="client-lastname"
                            value={newClientForm.lastName}
                            onChange={(e) => setNewClientForm(prev => ({
                              ...prev,
                              lastName: e.target.value,
                              name: `${prev.firstName || ''} ${e.target.value}`.trim()
                            }))}
                            placeholder="Nom"
                            className="h-10 rounded-lg text-sm w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-email" className="text-sm font-medium">
                        Email
                      </Label>
                      <div className="relative">
                        <Input
                          id="client-email"
                          type="email"
                          value={newClientForm.email}
                          onChange={(e) => setNewClientForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="contact@exemple.com"
                          className="h-10 rounded-lg text-sm w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="client-phone" className="text-sm font-medium">
                        Téléphone
                      </Label>
                      <div className="relative">
                        <Input
                          id="client-phone"
                          value={newClientForm.phone}
                          onChange={(e) => setNewClientForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="01 23 45 67 89"
                          className="h-10 rounded-lg text-sm w-full"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {newClientForm.type === 'COMPANY' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="client-siret" className="text-sm font-medium">
                          SIRET
                        </Label>
                        <div className="relative">
                          <Input
                            id="client-siret"
                            value={newClientForm.siret}
                            onChange={(e) => setNewClientForm(prev => ({ ...prev, siret: e.target.value }))}
                            placeholder="12345678901234"
                            className="h-10 rounded-lg text-sm w-full"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Numéro SIRET de l'entreprise (14 chiffres)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client-vat" className="text-sm font-medium">
                          N° TVA intracommunautaire (optionnel)
                        </Label>
                        <div className="relative">
                          <Input
                            id="client-vat"
                            value={newClientForm.vatNumber || ''}
                            onChange={(e) => setNewClientForm(prev => ({ ...prev, vatNumber: e.target.value }))}
                            placeholder="FR12345678901"
                            className="h-10 rounded-lg text-sm w-full"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="client-address" className="text-sm font-medium">
                          Adresse de facturation
                        </Label>
                      </div>
                      <div className="relative">
                        <div 
                          className="h-10 rounded-lg text-sm w-full"
                          style={{
                            lineHeight: '1.25rem',
                            minHeight: '2.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            color: newClientForm.address.street ? 'inherit' : '#9CA3AF'
                          }}
                        >
                          {newClientForm.address.street 
                            ? `${newClientForm.address.street}, ${newClientForm.address.postalCode} ${newClientForm.address.city}, ${newClientForm.address.country}`
                            : '123 Rue de la Paix, 75001 Paris, France'}
                        </div>
                        <Textarea
                          id="client-address"
                          value={`${newClientForm.address.street}\n${newClientForm.address.postalCode} ${newClientForm.address.city}\n${newClientForm.address.country}`}
                          onChange={(e) => {
                            const lines = e.target.value.split('\n');
                            const newAddress = {
                              street: lines[0] || '',
                              postalCode: lines[1]?.split(' ')[0] || '',
                              city: lines[1]?.split(' ').slice(1).join(' ').trim() || '',
                              country: (lines[2] || 'France').trim()
                            };
                            
                            setNewClientForm(prev => ({
                              ...prev,
                              address: {
                                ...defaultAddress, // S'assurer que tous les champs sont définis
                                ...prev.address,   // Conserver les valeurs existantes
                                ...newAddress      // Appliquer les nouvelles valeurs
                              }
                            }));
                          }}
                          placeholder="123 Rue de la Paix\n75001 Paris\nFrance"
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          rows={1}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="different-shipping-address"
                          checked={newClientForm.hasDifferentShippingAddress}
                          onChange={(e) => setNewClientForm(prev => ({
                            ...prev,
                            hasDifferentShippingAddress: e.target.checked
                          }))}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="different-shipping-address" className="text-sm font-medium">
                          Utiliser une adresse de livraison différente
                        </Label>
                      </div>

                      {newClientForm.hasDifferentShippingAddress && (
                        <div className="space-y-2 pl-6 pt-2">
                          <Label className="text-sm font-medium">
                            Adresse de livraison
                          </Label>
                          <div className="relative">
                            <div 
                              className="h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm overflow-hidden overflow-ellipsis whitespace-nowrap"
                              style={{
                                lineHeight: '1.25rem',
                                minHeight: '2.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                color: newClientForm.shippingAddress?.street ? 'inherit' : '#9CA3AF'
                              }}
                            >
                              {newClientForm.shippingAddress?.street 
                                ? `${newClientForm.shippingAddress.street}, ${newClientForm.shippingAddress.postalCode} ${newClientForm.shippingAddress.city}, ${newClientForm.shippingAddress.country}`
                                : '123 Rue de la Paix, 75001 Paris, France'}
                            </div>
                            <Textarea
                              value={`${newClientForm.shippingAddress.street}\n${newClientForm.shippingAddress.postalCode} ${newClientForm.shippingAddress.city}\n${newClientForm.shippingAddress.country}`}
                              onChange={(e) => {
                                const lines = e.target.value.split('\n');
                                const newShippingAddress = {
                                  street: lines[0] || '',
                                  postalCode: lines[1]?.split(' ')[0] || '',
                                  city: lines[1]?.split(' ').slice(1).join(' ').trim() || '',
                                  country: (lines[2] || 'France').trim()
                                };
                                
                                setNewClientForm(prev => ({
                                  ...prev,
                                  shippingAddress: {
                                    ...defaultAddress, // S'assurer que tous les champs sont définis
                                    ...prev.shippingAddress, // Conserver les valeurs existantes
                                    ...newShippingAddress    // Appliquer les nouvelles valeurs
                                  }
                                }));
                              }}
                              placeholder="123 Rue de la Paix\n75001 Paris\nFrance"
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                              rows={1}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="client-notes" className="text-sm font-medium">
                      Notes (optionnel)
                    </Label>
                    <Textarea
                      id="client-notes"
                      value={newClientForm.notes}
                      onChange={(e) => setNewClientForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notes internes sur ce client..."
                      rows={2}
                      className="rounded-lg px-3 py-2 text-sm resize-none"
                    />
                    <p className="text-xs">
                      Ces notes ne seront visibles que par vous
                    </p>
                  </div>
                  
                  {/* Form Actions */}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetNewClientForm();
                        setActiveTab("existing");
                      }}
                      disabled={disabled}
                      className="h-10 px-4 text-sm"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={createLoading || !newClientForm.name || !newClientForm.email || disabled}
                      className="h-10 px-4 text-sm"
                    >
                      {createLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : 'Créer le client'}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
    </div>
  );
}
