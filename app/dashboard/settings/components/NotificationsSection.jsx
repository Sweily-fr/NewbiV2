"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, Clock, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/ui/checkbox";
import { useEmailPreferences } from "@/src/hooks/useEmailPreferences";
import { toast } from "sonner";

export function NotificationsSection() {
  const { preferences, loading, updating, sendingTest, updatePreferences, sendTestEmail } = useEmailPreferences();
  
  const [enabled, setEnabled] = useState(false);
  const [types, setTypes] = useState(['due', 'anticipated']);
  const [doNotDisturb, setDoNotDisturb] = useState({
    weekday: { start: '22:00', end: '08:00' },
    weekend: { start: '22:00', end: '10:00' }
  });

  // Charger les préférences existantes
  useEffect(() => {
    if (preferences) {
      setEnabled(preferences.enabled || false);
      setTypes(preferences.types || ['due', 'anticipated']);
      setDoNotDisturb(preferences.doNotDisturb || {
        weekday: { start: '22:00', end: '08:00' },
        weekend: { start: '22:00', end: '10:00' }
      });
    }
  }, [preferences]);

  // Sauvegarder les préférences
  const handleSave = async () => {
    await updatePreferences({
      enabled,
      types,
      doNotDisturb
    });
  };

  // Gérer le changement de type
  const handleTypeChange = (type, checked) => {
    if (checked) {
      setTypes([...types, type]);
    } else {
      setTypes(types.filter(t => t !== type));
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-blue-600" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-blue-600" />
          Notifications
        </CardTitle>
        <CardDescription>
          Gérez vos préférences de rappels par email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Activation globale */}
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="email-reminders" className="text-sm font-medium">
                Activer les rappels par email
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Recevez un email pour les tâches que vous avez choisies
            </p>
          </div>
          <Switch
            id="email-reminders"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            {/* Types de rappels */}
            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <h4 className="text-sm font-medium mb-3">Types de rappels</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="type-due"
                      checked={types.includes('due')}
                      onCheckedChange={(checked) => handleTypeChange('due', checked)}
                    />
                    <Label
                      htmlFor="type-due"
                      className="text-sm font-normal cursor-pointer"
                    >
                      À l'échéance
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="type-anticipated"
                      checked={types.includes('anticipated')}
                      onCheckedChange={(checked) => handleTypeChange('anticipated', checked)}
                    />
                    <Label
                      htmlFor="type-anticipated"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Rappels anticipés (1h, 3h, 1j, 3j avant)
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Ne pas déranger */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Ne pas déranger</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Les emails seront différés pendant ces périodes
              </p>

              {/* Semaine */}
              <div className="space-y-2">
                <Label className="text-sm">Semaine (lundi-vendredi)</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="weekday-start" className="text-xs text-muted-foreground">
                      De
                    </Label>
                    <Input
                      id="weekday-start"
                      type="time"
                      value={doNotDisturb.weekday.start}
                      onChange={(e) => setDoNotDisturb({
                        ...doNotDisturb,
                        weekday: { ...doNotDisturb.weekday, start: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="weekday-end" className="text-xs text-muted-foreground">
                      À
                    </Label>
                    <Input
                      id="weekday-end"
                      type="time"
                      value={doNotDisturb.weekday.end}
                      onChange={(e) => setDoNotDisturb({
                        ...doNotDisturb,
                        weekday: { ...doNotDisturb.weekday, end: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Week-end */}
              <div className="space-y-2">
                <Label className="text-sm">Week-end (samedi-dimanche)</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="weekend-start" className="text-xs text-muted-foreground">
                      De
                    </Label>
                    <Input
                      id="weekend-start"
                      type="time"
                      value={doNotDisturb.weekend.start}
                      onChange={(e) => setDoNotDisturb({
                        ...doNotDisturb,
                        weekend: { ...doNotDisturb.weekend, start: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="weekend-end" className="text-xs text-muted-foreground">
                      À
                    </Label>
                    <Input
                      id="weekend-end"
                      type="time"
                      value={doNotDisturb.weekend.end}
                      onChange={(e) => setDoNotDisturb({
                        ...doNotDisturb,
                        weekend: { ...doNotDisturb.weekend, end: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Email de test */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Email de test</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Envoyez-vous un exemple d'email de rappel
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendTestEmail}
                  disabled={sendingTest}
                >
                  {sendingTest ? "Envoi..." : "Envoyer"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={updating}
          >
            {updating ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
