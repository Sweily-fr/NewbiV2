"use client";

import { useState, useEffect, useRef } from "react";
import {
  XIcon,
  Euro,
  Calendar,
  Building,
  Tag,
  CreditCard,
  FileText,
  Upload,
  ExternalLink,
  Trash2,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/src/components/ui/drawer";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { useDocumentUpload } from "@/src/hooks/useDocumentUpload";

export function AddTransactionDrawer({ open, onOpenChange, onSubmit, transaction = null, organizationMembers = [] }) {
  const [formData, setFormData] = useState({
    type: "EXPENSE", // Défaut à EXPENSE pour les dépenses
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    paymentMethod: "CARD",
    vendor: "",
    expenseType: "ORGANIZATION", // Défaut à dépense de l'organisation
    assignedMember: null, // Membre assigné pour les notes de frais
    receiptImage: null, // URL de l'image du reçu
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const fileInputRef = useRef(null);
  
  // Hook pour l'upload vers Cloudflare
  const {
    isUploading: isUploadingReceipt,
    uploadError: uploadReceiptError,
    uploadResult: uploadReceiptResult,
    uploadDocument: uploadReceiptDocument,
    resetUpload: resetReceiptUpload,
  } = useDocumentUpload();

  // Fonction pour mapper les catégories de l'API vers le formulaire
  const mapApiCategoryToForm = (apiCategory) => {
    const categoryMap = {
      OFFICE_SUPPLIES: "bureau",
      TRAVEL: "transport",
      MEALS: "repas",
      EQUIPMENT: "materiel",
      MARKETING: "marketing",
      TRAINING: "formation",
      OTHER: "autre",
      SERVICES: "autre",
      RENT: "autre",
      SALARIES: "autre",
    };
    return categoryMap[apiCategory] || "autre";
  };

  // Fonction pour mapper les méthodes de paiement de l'API vers le formulaire
  const mapApiPaymentMethodToForm = (apiPaymentMethod) => {
    const paymentMethodMap = {
      CREDIT_CARD: "CARD",
      BANK_TRANSFER: "TRANSFER",
      CASH: "CASH",
      CHECK: "CHECK",
      PAYPAL: "TRANSFER",
      OTHER: "TRANSFER",
    };
    return paymentMethodMap[apiPaymentMethod] || "CARD";
  };

  // Pré-remplir le formulaire si une transaction est fournie (mode édition)
  useEffect(() => {
    if (transaction && open) {
      console.log("🔄 [DRAWER EDIT] Transaction reçue:", transaction);
      console.log("🔄 [DRAWER EDIT] expenseType:", transaction.expenseType);
      console.log("🔄 [DRAWER EDIT] assignedMember:", transaction.assignedMember);
      
      // Formater la date pour l'input date (format YYYY-MM-DD)
      let formattedDate = new Date().toISOString().split("T")[0]; // Défaut
      if (transaction.date) {
        
        if (typeof transaction.date === "string") {
          // Si c'est déjà une string, vérifier le format
          if (transaction.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = transaction.date;
          } else {
            // Essayer de parser la date
            const parsedDate = new Date(transaction.date);
            if (!isNaN(parsedDate.getTime())) {
              formattedDate = parsedDate.toISOString().split("T")[0];
            }
          }
        } else {
          // Si c'est un objet Date
          const dateObj = new Date(transaction.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toISOString().split("T")[0];
          }
        }
      }
      
      const newFormData = {
        type: transaction.type || "EXPENSE",
        amount: transaction.amount?.toString() || "",
        category: mapApiCategoryToForm(transaction.category) || "",
        date: formattedDate,
        description: transaction.description || "",
        paymentMethod: mapApiPaymentMethodToForm(transaction.paymentMethod) || "CARD",
        vendor: transaction.vendor || "",
        expenseType: transaction.expenseType || "ORGANIZATION",
        assignedMember: transaction.assignedMember || null,
        receiptImage: transaction.receiptImage || transaction.attachment || null,
      };
      
      // Charger la preview si une image existe (priorité: receiptImage, puis attachment pour les OCR)
      const imageToPreview = transaction.receiptImage || transaction.attachment;
      if (imageToPreview) {
        setPreviewUrl(imageToPreview);
      } else {
        setPreviewUrl(null);
      }
      
      setFormData(newFormData);
    }
  }, [transaction, open]);

  // Réinitialiser le formulaire quand le drawer se ferme
  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      // Réinitialiser le formulaire
      setFormData({
        type: "EXPENSE", // Cohérence avec le défaut
        amount: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        paymentMethod: "CARD",
        vendor: "",
        expenseType: "ORGANIZATION",
        assignedMember: null,
        receiptImage: null,
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadedFileUrl(null);
      resetReceiptUpload();
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit(formData);
  };

  const handleChange = (field) => (value) => {
    console.log(`🔄 [DRAWER] Changement de ${field}:`, value);
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      console.log(`📝 [DRAWER] FormData mis à jour:`, newData);
      return newData;
    });
  };

  const isIncome = formData.type === "INCOME";
  
  // Gestion de l'upload d'image
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validation du fichier
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!allowedTypes.includes(file.type)) {
        alert("Type de fichier non supporté. Veuillez uploader une image (JPEG, PNG, WEBP) ou un PDF.");
        return;
      }
      
      if (file.size > maxSize) {
        alert("Fichier trop volumineux. Taille maximale : 10MB");
        return;
      }
      
      setSelectedFile(file);
      
      // Créer une preview locale
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Upload vers Cloudflare (bucket OCR pour les uploads temporaires)
      try {
        await uploadReceiptDocument(file, "temp");
      } catch (error) {
        console.error("❌ Erreur upload reçu:", error);
        alert("Erreur lors de l'upload du reçu");
      }
    }
  };
  
  // Mettre à jour formData quand l'upload est terminé
  useEffect(() => {
    if (uploadReceiptResult?.url) {
      setUploadedFileUrl(uploadReceiptResult.url);
      setFormData(prev => ({ ...prev, receiptImage: uploadReceiptResult.url }));
    }
  }, [uploadReceiptResult]);
  
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedFileUrl(null);
    setFormData(prev => ({ ...prev, receiptImage: null }));
    resetReceiptUpload();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent
        className="w-full h-full md:w-[620px] md:max-w-[620px] md:min-w-[620px] md:h-auto"
        style={{ width: '100vw', height: '100svh' }}
      >
        <DrawerHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DrawerTitle>
              {transaction ? "Modifier la transaction" : "Ajouter une transaction"}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <XIcon className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 space-y-4 pb-2 md:pb-4">
            {/* Type de document */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-normal">Type de transaction</span>
              </div>
              <Badge className="bg-[#5b4fff]/30 border-[#5b4fff]/10 text-[#5b4fff] text-[10px] font-normal rounded-sm">
                Transaction manuelle
              </Badge>
            </div>
            <Separator />

            {/* Informations financières */}
            <Card className="shadow-none border-none py-2">
              <CardContent className="px-2 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Euro className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-normal">
                    Informations financières
                  </span>
                </div>
                <div className="space-y-4">
                  {/* Type de dépense */}
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      Type de dépense
                    </Label>
                    <Select
                      value={formData.expenseType}
                      onValueChange={handleChange("expenseType")}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ORGANIZATION">Dépense de l'organisation</SelectItem>
                        <SelectItem value="EXPENSE_REPORT">Note de frais</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sélecteur de membre (uniquement pour les notes de frais) */}
                  {formData.expenseType === "EXPENSE_REPORT" && (
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                        Assigné à
                      </Label>
                      <Select
                        value={formData.assignedMember?.userId || ""}
                        onValueChange={(userId) => {
                          const member = organizationMembers.find(m => m.userId === userId);
                          handleChange("assignedMember")(member || null);
                        }}
                      >
                        <SelectTrigger className="w-48">
                          {formData.assignedMember ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={formData.assignedMember.image} alt={formData.assignedMember.name} />
                                <AvatarFallback className="text-xs">
                                  {formData.assignedMember.name?.charAt(0)?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{formData.assignedMember.name}</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Sélectionner un membre" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {organizationMembers.map((member) => (
                            <SelectItem key={member.userId} value={member.userId}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={member.image} alt={member.name} />
                                  <AvatarFallback className="text-xs">
                                    {member.name?.charAt(0)?.toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{member.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Montant */}
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      Montant
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleChange("amount")(e.target.value)}
                        className="w-24"
                        placeholder="0.00"
                      />
                      <Select value="EUR" disabled>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Separator />

            {/* Date */}
            <Card className="shadow-none border-none py-2">
              <CardContent className="px-2 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-normal">Date</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                    Date de transaction
                  </Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      handleChange("date")(e.target.value);
                    }}
                    className="w-40"
                    lang="fr-FR"
                  />
                </div>
              </CardContent>
            </Card>
            <Separator />

            {/* Fournisseur */}
            <Card className="shadow-none border-none py-2">
              <CardContent className="px-2 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-normal">Fournisseur</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                    Nom du fournisseur
                  </Label>
                  <Input
                    value={formData.vendor || ""}
                    onChange={(e) => handleChange("vendor")(e.target.value)}
                    placeholder="Nom du fournisseur"
                    className="w-48"
                  />
                </div>
              </CardContent>
            </Card>
            <Separator />

            {/* Classification */}
            <Card className="shadow-none border-none py-2">
              <CardContent className="px-2 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Classification</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      Catégorie
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={handleChange("category")}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bureau">Bureau</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="repas">Repas</SelectItem>
                        <SelectItem value="materiel">Matériel</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="formation">Formation</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      Moyen de paiement
                    </Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={handleChange("paymentMethod")}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CARD">Carte</SelectItem>
                        <SelectItem value="TRANSFER">Virement</SelectItem>
                        <SelectItem value="CASH">Espèces</SelectItem>
                        <SelectItem value="CHECK">Chèque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="shadow-none border-none py-2">
              <CardContent className="px-2 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-medium">Description</span>
                </div>
                <div className="flex items-start justify-between">
                  <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mt-1">
                    Description
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleChange("description")(e.target.value)
                    }
                    placeholder="Description de la transaction"
                    rows={3}
                    className="flex-1 ml-4"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Upload d'image de reçu */}
            <Card className="shadow-none border-none py-2">
              <CardContent className="px-2 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Reçu (optionnel)</span>
                </div>
                
                {previewUrl ? (
                  <div className="space-y-3">
                    {/* Grande preview cliquable */}
                    <div 
                      className="border-input relative flex h-48 w-full items-center justify-center overflow-hidden rounded-md border bg-gray-50 dark:bg-gray-900 cursor-pointer hover:border-blue-500 transition-colors group"
                      onClick={() => window.open(uploadedFileUrl || previewUrl, '_blank')}
                      role="button"
                      tabIndex={0}
                    >
                      {previewUrl.toLowerCase().includes('pdf') || selectedFile?.type === 'application/pdf' ? (
                        <iframe
                          src={uploadedFileUrl || previewUrl}
                          className="h-full w-full pointer-events-none"
                          title="Preview du reçu"
                        />
                      ) : (
                        <img
                          className="h-full w-full object-contain"
                          src={uploadedFileUrl || previewUrl}
                          alt="Preview du reçu"
                        />
                      )}
                      {/* Overlay avec icône */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
                          <ExternalLink className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Boutons d'action */}
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileSelect}
                        className="sr-only"
                        id="receipt-upload"
                        aria-label="Upload receipt file"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 cursor-pointer"
                        disabled={isUploadingReceipt}
                      >
                        {isUploadingReceipt ? (
                          <>
                            <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                            Upload...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Changer
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveImage}
                        className="cursor-pointer text-red-600 hover:text-red-700"
                        disabled={isUploadingReceipt}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <p className="text-muted-foreground text-xs text-center">
                      Cliquez pour ouvrir en plein écran
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileSelect}
                      className="sr-only"
                      id="receipt-upload"
                      aria-label="Upload receipt file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full cursor-pointer"
                      disabled={isUploadingReceipt}
                    >
                      {isUploadingReceipt ? (
                        <>
                          <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                          Upload en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Ajouter un reçu
                        </>
                      )}
                    </Button>
                    {uploadReceiptError && (
                      <p className="text-xs text-red-600 text-center">
                        Erreur: {uploadReceiptError}
                      </p>
                    )}
                    {!uploadReceiptError && (
                      <p className="text-xs text-gray-500 text-center">
                        Image ou PDF • Max 10MB
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fixed footer with buttons */}
        <div className="flex-shrink-0 border-t bg-white p-4">
          <form onSubmit={handleSubmit}>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer font-normal"
                onClick={() => handleOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 cursor-pointer font-normal"
              >
                {transaction ? "Modifier la transaction" : "Ajouter la transaction"}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
