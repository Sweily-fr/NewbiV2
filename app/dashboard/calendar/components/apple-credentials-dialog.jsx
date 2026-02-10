"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useConnectAppleCalendar } from "@/src/hooks/useCalendarConnections";

export function AppleCredentialsDialog({ isOpen, onClose, onSuccess }) {
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [error, setError] = useState(null);
  const { connectApple, loading } = useConnectAppleCalendar();

  const handleSubmit = async () => {
    setError(null);

    if (!username || !appPassword) {
      setError("L'identifiant et le mot de passe d'application sont requis");
      return;
    }

    const result = await connectApple({
      username,
      appPassword,
    });

    if (result) {
      setUsername("");
      setAppPassword("");
      onSuccess?.();
      onClose();
    }
  };

  const handleClose = () => {
    setUsername("");
    setAppPassword("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connecter Apple Calendar</DialogTitle>
          <DialogDescription>
            Utilisez votre Apple ID et un mot de passe d'application pour connecter votre calendrier iCloud.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apple-username">Apple ID (email)</Label>
            <Input
              id="apple-username"
              type="email"
              placeholder="votre@email.com"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apple-password">Mot de passe d'application</Label>
            <Input
              id="apple-password"
              type="password"
              placeholder="xxxx-xxxx-xxxx-xxxx"
              value={appPassword}
              onChange={(e) => {
                setAppPassword(e.target.value);
                setError(null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Créez un mot de passe d'application sur{" "}
              <a
                href="https://appleid.apple.com/account/manage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                appleid.apple.com
              </a>{" "}
              &rarr; Connexion et sécurité &rarr; Mots de passe d'application.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Connexion..." : "Connecter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
