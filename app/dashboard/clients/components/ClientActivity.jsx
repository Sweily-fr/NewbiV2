"use client";

import { useState, useMemo, useEffect } from "react";
import * as React from "react";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Send, Edit2, Trash2, ChevronDown, ChevronUp, FileText, ExternalLink, Bell } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useSession } from "@/src/lib/auth-client";
import { useAddClientNote, useUpdateClientNote, useDeleteClientNote, useAddClientActivity } from "@/src/graphql/clientQueries";
import { useCreateEvent } from "@/src/hooks/useEvents";
import { EventDialog } from "@/app/dashboard/calendar/components/event-dialog";
import { toast } from "@/src/components/ui/sonner";
import { useLazyQuery } from "@apollo/client";
import { GET_EVENT } from "@/src/graphql/queries/event";
import InvoiceSidebar from "@/app/dashboard/outils/factures/components/invoice-sidebar";
import InvoiceMobileFullscreen from "@/app/dashboard/outils/factures/components/invoice-mobile-fullscreen";
import QuoteSidebar from "@/app/dashboard/outils/devis/components/quote-sidebar";
import QuoteMobileFullscreen from "@/app/dashboard/outils/devis/components/quote-mobile-fullscreen";

const ClientActivity = ({
  client,
  workspaceId,
  onClientUpdate,
  pendingNotes = [],
  onAddPendingNote,
  onUpdatePendingNote,
  onRemovePendingNote,
  isCreating = false,
  isReminderDialogOpen = false,
  onReminderDialogClose,
  defaultTab = "all",
}) => {
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isInvoiceSidebarOpen, setIsInvoiceSidebarOpen] = useState(false);
  const [isQuoteSidebarOpen, setIsQuoteSidebarOpen] = useState(false);
  const [isInvoiceMobileFullscreenOpen, setIsInvoiceMobileFullscreenOpen] = useState(false);
  const [isQuoteMobileFullscreenOpen, setIsQuoteMobileFullscreenOpen] = useState(false);
  const { data: session } = useSession();

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleViewDocument = (docType, docId) => {
    if (docType === 'invoice') {
      setSelectedInvoice({ id: docId });
      if (isMobile) {
        setIsInvoiceMobileFullscreenOpen(true);
      } else {
        setIsInvoiceSidebarOpen(true);
      }
    } else if (docType === 'quote') {
      setSelectedQuote({ id: docId });
      if (isMobile) {
        setIsQuoteMobileFullscreenOpen(true);
      } else {
        setIsQuoteSidebarOpen(true);
      }
    }
  };

  const { addNote, loading: addingNote } = useAddClientNote(workspaceId);
  const { updateNote, loading: updatingNote } = useUpdateClientNote(workspaceId);
  const { deleteNote, loading: deletingNote } = useDeleteClientNote(workspaceId);
  const { createEvent } = useCreateEvent();
  const { addActivity } = useAddClientActivity(workspaceId);
  const [selectedReminderEvent, setSelectedReminderEvent] = useState(null);
  const [isViewReminderOpen, setIsViewReminderOpen] = useState(false);
  const [fetchEvent] = useLazyQuery(GET_EVENT);

  const handleViewReminder = async (eventId) => {
    try {
      const { data } = await fetchEvent({ variables: { id: eventId, workspaceId } });
      if (data?.getEvent?.event) {
        const evt = data.getEvent.event;
        setSelectedReminderEvent({
          id: evt.id,
          title: evt.title,
          description: evt.description || "",
          start: new Date(evt.start),
          end: new Date(evt.end),
          allDay: evt.allDay || false,
          color: evt.color || "sky",
          location: evt.location || "",
        });
        setIsViewReminderOpen(true);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    // En mode création, ajouter à la liste des notes en attente
    if (isCreating) {
      if (onAddPendingNote) {
        onAddPendingNote(newNote);
        setNewNote("");
      }
      return;
    }

    // En mode édition, sauvegarder directement
    if (!client?.id) return;

    try {
      const updatedClient = await addNote(client.id, newNote);
      setNewNote("");
      if (onClientUpdate) {
        onClientUpdate(updatedClient);
      }
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleUpdateNote = async (noteId, isPending = false) => {
    if (!editingContent.trim()) return;

    // En mode création ou si c'est une note en attente, mettre à jour localement
    if (isPending || isCreating) {
      if (onUpdatePendingNote) {
        onUpdatePendingNote(noteId, editingContent);
        setEditingNoteId(null);
        setEditingContent("");
      }
      return;
    }

    // En mode édition, sauvegarder sur le serveur
    if (!client?.id) return;

    try {
      const updatedClient = await updateNote(client.id, noteId, editingContent);
      setEditingNoteId(null);
      setEditingContent("");
      if (onClientUpdate) {
        onClientUpdate(updatedClient);
      }
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (noteId, isPending = false) => {
    // En mode création ou si c'est une note en attente, supprimer localement
    if (isPending || isCreating) {
      if (onRemovePendingNote) {
        onRemovePendingNote(noteId);
      }
      return;
    }

    // En mode édition, supprimer sur le serveur
    if (!client?.id) return;

    try {
      const updatedClient = await deleteNote(client.id, noteId);
      if (onClientUpdate) {
        onClientUpdate(updatedClient);
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleCreateReminder = async (eventData) => {
    if (!client?.id) return;

    try {
      const input = {
        title: eventData.title,
        description: eventData.description,
        start: eventData.start.toISOString(),
        end: eventData.end.toISOString(),
        allDay: eventData.allDay || false,
        color: eventData.color || "sky",
        location: eventData.location,
        type: "REMINDER",
        emailReminder: eventData.emailReminder?.enabled ? eventData.emailReminder : undefined,
      };

      const createdEvent = await createEvent(input);
      if (!createdEvent) return;

      const activityInput = {
        type: "reminder_created",
        description: `a créé un rappel : ${eventData.title}`,
        metadata: {
          eventId: createdEvent.id,
          eventTitle: eventData.title,
          eventDate: eventData.start.toISOString(),
        },
      };

      const updatedClient = await addActivity(client.id, activityInput);
      if (onClientUpdate && updatedClient) {
        onClientUpdate(updatedClient);
      }

      toast.success("Rappel créé avec succès");
      onReminderDialogClose?.();
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast.error("Erreur lors de la création du rappel");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return "";
    }
    const date = new Date(dateString);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return "";
    }
    
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, "'Aujourd''hui à' HH:mm", { locale: fr });
    } else if (diffInHours < 48) {
      return format(date, "'Hier à' HH:mm", { locale: fr });
    } else {
      return format(date, "d MMM 'à' HH:mm", { locale: fr });
    }
  };

  const getActivityDisplay = (activity) => {
    const icons = {
      created: "✨",
      updated: "📝",
      invoice_created: "📄",
      invoice_status_changed: "📄",
      quote_created: "📋",
      quote_status_changed: "📋",
      credit_note_created: "📄",
      note_added: "💬",
      note_updated: "✏️",
      note_deleted: "🗑️",
      document_email_sent: "📧",
      invoice_reminder_sent: "🔔",
      reminder_created: "🔔",
    };

    let text = activity.description || "a effectué une action";
    let icon = icons[activity.type] || "📝";

    return { icon, text, metadata: activity.metadata };
  };

  const notes = useMemo(() => {
    const clientNotes = [...(client?.notes || [])];
    const pending = pendingNotes.map(note => ({
      ...note,
      isPending: true,
      userId: session?.user?.id,
      userName: session?.user?.name || session?.user?.email,
      userImage: session?.user?.image,
    }));
    return [...clientNotes, ...pending].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [client?.notes, pendingNotes, session]);

  const activities = useMemo(() => {
    return [...(client?.activity || [])]
      .filter((a) => a.type !== "note_added")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [client?.activity]);

  const allActivity = useMemo(() => {
    return [
      ...notes.map((n) => ({ ...n, type: "note" })),
      ...activities.map((a) => ({ ...a, type: "activity" })),
    ]
      .filter((item) => item.createdAt) // Filtrer les éléments sans date
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        // Vérifier que les dates sont valides
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        return dateA - dateB; // Du plus ancien au plus récent
      });
  }, [notes, activities]);

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue={defaultTab} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pl-2 px-4 py-4">
          <TabsContent value="all" className="space-y-3 mt-0">
            {allActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune activité
              </p>
            ) : (
              <>
                {allActivity.length > 3 && !showAllActivities && (
                  <button
                    onClick={() => setShowAllActivities(true)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-start gap-1 py-2 transition-colors"
                  >
                    <ChevronDown className="h-3 w-3" />
                    Voir plus ({allActivity.length - 3} activités)
                  </button>
                )}
                {allActivity.length > 3 && showAllActivities && (
                  <button
                    onClick={() => setShowAllActivities(false)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-start gap-1 py-2 transition-colors"
                  >
                    <ChevronUp className="h-3 w-3" />
                    Voir moins
                  </button>
                )}
                {(showAllActivities ? allActivity : allActivity.slice(-3)).map(
                  (item, index) => {
                    const display =
                      item.type === "activity" ? getActivityDisplay(item) : null;
                    return (
                      <div key={`${item.type}-${item.id || index}`} className="flex gap-3 w-full">
                        {item.type === "note" ? (
                          <div className="bg-background rounded-lg p-3 flex-1 border border-border min-w-0">
                            <div className="flex gap-3 w-full">
                              <UserAvatar
                                src={item.userImage}
                                name={item.userName}
                                size="sm"
                                className="flex-shrink-0"
                              />
                              <div className="flex-1 space-y-2 min-w-0 overflow-hidden">
                                {editingNoteId === item.id ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium">
                                        {item.userName}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(item.createdAt)}
                                      </span>
                                    </div>
                                    <div className="space-y-2">
                                      <Textarea
                                        value={editingContent}
                                        onChange={(e) => setEditingContent(e.target.value)}
                                        className="text-sm"
                                        rows={3}
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleUpdateNote(item.id, item.isPending)}
                                          disabled={updatingNote}
                                          className="text-white hover:opacity-90"
                                          style={{ backgroundColor: "#5b50FF" }}
                                        >
                                          Enregistrer
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingNoteId(null);
                                            setEditingContent("");
                                          }}
                                        >
                                          Annuler
                                        </Button>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium">
                                          {item.userName}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDate(item.createdAt)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {item.userId === session?.user?.id && (
                                          <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-muted-foreground"
                                            style={{ "--hover-color": "#5b50FF" }}
                                            onMouseEnter={(e) =>
                                              (e.currentTarget.style.color = "#5b50FF")
                                            }
                                            onMouseLeave={(e) =>
                                              (e.currentTarget.style.color = "")
                                            }
                                            onClick={() => {
                                              setEditingNoteId(item.id);
                                              setEditingContent(item.content);
                                            }}
                                          >
                                            <Edit2 className="h-3.5 w-3.5" />
                                          </Button>
                                          <AlertDialog
                                            open={noteToDelete === item.id}
                                            onOpenChange={(open) =>
                                              !open && setNoteToDelete(null)
                                            }
                                          >
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => setNoteToDelete(item.id)}
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogTitle>
                                                Supprimer la note
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Êtes-vous sûr de vouloir supprimer cette note ?
                                                Cette action ne peut pas être annulée.
                                              </AlertDialogDescription>
                                              <div className="flex gap-2 justify-end">
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() => {
                                                    handleDeleteNote(item.id, item.isPending);
                                                    setNoteToDelete(null);
                                                  }}
                                                  disabled={deletingNote}
                                                  className="bg-destructive text-white hover:bg-destructive/90"
                                                >
                                                  Supprimer
                                                </AlertDialogAction>
                                              </div>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                      {item.content}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-8 flex items-start justify-center flex-shrink-0 pt-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                            </div>
                            <div className="flex-1 space-y-2">
                              {display ? (
                                <>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap flex-1">
                                      <span className="text-xs font-normal">
                                        {item.userName}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {display.text}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {formatDate(item.createdAt)}
                                    </span>
                                  </div>
                                  {display.metadata && display.metadata.eventId && (
                                    <div
                                      className="mt-2 p-2 bg-muted/50 rounded-md border border-border max-w-md cursor-pointer hover:bg-muted/80 transition-colors"
                                      onClick={() => handleViewReminder(display.metadata.eventId)}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <Bell className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                          <div className="flex flex-col">
                                            <span className="text-xs font-medium">
                                              {display.metadata.eventTitle}
                                            </span>
                                            {display.metadata.eventDate && (
                                              <span className="text-xs text-muted-foreground">
                                                {format(new Date(display.metadata.eventDate), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                      </div>
                                    </div>
                                  )}
                                  {display.metadata && (display.metadata.documentType === 'invoice' || display.metadata.documentType === 'quote' || display.metadata.documentType === 'creditNote') && (
                                    <div className="mt-2 p-2 bg-muted/50 rounded-md border border-border max-w-md">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                          <div className="flex flex-col">
                                            <span className="text-xs font-medium">
                                              {display.metadata.documentType === 'invoice' && `Facture ${display.metadata.documentNumber}`}
                                              {display.metadata.documentType === 'quote' && `Devis ${display.metadata.documentNumber}`}
                                              {display.metadata.documentType === 'creditNote' && `Avoir ${display.metadata.documentNumber}`}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              {display.metadata.documentType === 'creditNote' && display.metadata.originalInvoiceNumber && (
                                                `En référence à la facture ${display.metadata.originalInvoiceNumber}`
                                              )}
                                              {display.metadata.documentType !== 'creditNote' && (
                                                <>
                                                  {display.metadata.status === 'DRAFT' && 'Brouillon'}
                                                  {display.metadata.status === 'PENDING' && (display.metadata.documentType === 'invoice' ? 'En attente' : 'En attente')}
                                                  {display.metadata.status === 'COMPLETED' && (display.metadata.documentType === 'invoice' ? 'Payée' : 'Accepté')}
                                                  {display.metadata.status === 'CANCELED' && (display.metadata.documentType === 'invoice' ? 'Annulée' : 'Refusé')}
                                                </>
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                        {/* Bouton "Voir" uniquement pour les factures et devis, pas pour les avoirs */}
                                        {display.metadata.documentType !== 'creditNote' && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2 text-xs hover:bg-transparent flex-shrink-0"
                                            style={{ color: '#5b50FF' }}
                                            onClick={() => {
                                              const docType = display.metadata.documentType;
                                              const docId = display.metadata.documentId;
                                              handleViewDocument(docType, docId);
                                            }}
                                          >
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            {display.metadata.documentType === 'invoice' ? 'Voir la facture' : 'Voir le devis'}
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : null}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  }
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-3 mt-4">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune note
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-background rounded-lg p-3 border border-border"
                >
                  <div className="flex gap-3">
                    <UserAvatar
                      src={note.userImage}
                      name={note.userName}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 space-y-2">
                      {editingNoteId === note.id ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{note.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <Textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="text-sm"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateNote(note.id, note.isPending)}
                                disabled={updatingNote}
                                className="text-white hover:opacity-90"
                                style={{ backgroundColor: "#5b50FF" }}
                              >
                                Enregistrer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setEditingContent("");
                                }}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium">{note.userName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(note.createdAt)}
                              </span>
                              {note.userId === session?.user?.id && (
                                <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-muted-foreground"
                                  style={{ "--hover-color": "#5b50FF" }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.color = "#5b50FF")
                                  }
                                  onMouseLeave={(e) => (e.currentTarget.style.color = "")}
                                  onClick={() => {
                                    setEditingNoteId(note.id);
                                    setEditingContent(note.content);
                                  }}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <AlertDialog
                                  open={noteToDelete === note.id}
                                  onOpenChange={(open) => !open && setNoteToDelete(null)}
                                >
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => setNoteToDelete(note.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogTitle>Supprimer la note</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir supprimer cette note ? Cette
                                      action ne peut pas être annulée.
                                    </AlertDialogDescription>
                                    <div className="flex gap-2 justify-end">
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          handleDeleteNote(note.id, note.isPending);
                                          setNoteToDelete(null);
                                        }}
                                        disabled={deletingNote}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Supprimer
                                      </AlertDialogAction>
                                    </div>
                                  </AlertDialogContent>
                                </AlertDialog>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-3 mt-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune activité
              </p>
            ) : (
              <>
                {activities.length > 3 && !showAllActivities && (
                  <button
                    onClick={() => setShowAllActivities(true)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-start gap-1 py-2 transition-colors"
                  >
                    <ChevronDown className="h-3 w-3" />
                    Voir plus ({activities.length - 3} activités)
                  </button>
                )}
                {activities.length > 3 && showAllActivities && (
                  <button
                    onClick={() => setShowAllActivities(false)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-start gap-1 py-2 transition-colors"
                  >
                    <ChevronUp className="h-3 w-3" />
                    Voir moins
                  </button>
                )}
                {(showAllActivities ? activities : activities.slice(-3)).map(
                  (activity, index) => {
                    const display = getActivityDisplay(activity);
                    return (
                      <div key={activity.id || index} className="flex gap-3">
                        <div className="w-8 flex items-start justify-center flex-shrink-0 pt-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap flex-1">
                              <span className="text-xs font-normal">
                                {activity.userName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {display.text}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(activity.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </>
            )}
          </TabsContent>
        </div>

        {/* Tabs juste au-dessus du textarea */}
        <TabsList className="grid w-full grid-cols-3 bg-transparent rounded-none h-auto px-6 pt-3 pb-0 border-t border-border">
          <TabsTrigger
            value="all"
            className="text-xs rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent cursor-pointer"
          >
            Tout ({allActivity.length})
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="text-xs rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent cursor-pointer"
          >
            Notes ({notes.length})
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="text-xs rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent cursor-pointer"
          >
            Activité ({activities.length})
          </TabsTrigger>
        </TabsList>

        {/* Zone de saisie de note - Sticky en bas */}
        <div className="pb-3 pl-3 pr-3 pt-1 space-y-2 flex-shrink-0">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Ajouter une note..."
            className="min-h-[80px] text-sm bg-background border-border"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleAddNote();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Cmd/Ctrl + Entrée pour envoyer
            </span>
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!newNote.trim() || addingNote}
            >
              <Send className="h-3 w-3 mr-2" />
              Envoyer
            </Button>
          </div>
        </div>
      </Tabs>

      {/* Sidebar pour desktop - Facture */}
      <InvoiceSidebar
        invoice={selectedInvoice}
        isOpen={isInvoiceSidebarOpen}
        onClose={() => {
          setIsInvoiceSidebarOpen(false);
          setSelectedInvoice(null);
        }}
      />

      {/* Fullscreen pour mobile - Facture */}
      {isInvoiceMobileFullscreenOpen && selectedInvoice && (
        <InvoiceMobileFullscreen
          invoice={selectedInvoice}
          isOpen={isInvoiceMobileFullscreenOpen}
          onClose={() => {
            setIsInvoiceMobileFullscreenOpen(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {/* Sidebar pour desktop - Devis */}
      <QuoteSidebar
        quote={selectedQuote}
        isOpen={isQuoteSidebarOpen}
        onClose={() => {
          setIsQuoteSidebarOpen(false);
          setSelectedQuote(null);
        }}
      />

      {/* Fullscreen pour mobile - Devis */}
      {isQuoteMobileFullscreenOpen && selectedQuote && (
        <QuoteMobileFullscreen
          quote={selectedQuote}
          isOpen={isQuoteMobileFullscreenOpen}
          onClose={() => {
            setIsQuoteMobileFullscreenOpen(false);
            setSelectedQuote(null);
          }}
        />
      )}

      {/* Dialog de création de rappel */}
      <EventDialog
        event={null}
        isOpen={isReminderDialogOpen}
        onClose={() => onReminderDialogClose?.()}
        onSave={handleCreateReminder}
        onDelete={() => {}}
      />

      {/* Dialog de visualisation d'un rappel existant */}
      <EventDialog
        event={selectedReminderEvent}
        isOpen={isViewReminderOpen}
        onClose={() => {
          setIsViewReminderOpen(false);
          setSelectedReminderEvent(null);
        }}
        onSave={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
};

export default ClientActivity;
