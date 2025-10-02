"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/src/lib/auth-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";

export default function TestBillingPage() {
  const { data: session } = useSession();
  const [billingInfo, setBillingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const organizationId = session?.session?.activeOrganizationId;

  const fetchBillingInfo = async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/billing/sync-seats?organizationId=${organizationId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur récupération");
      }

      const data = await response.json();
      setBillingInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const syncSeats = async () => {
    if (!organizationId) return;

    setSyncing(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/sync-seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur synchronisation");
      }

      const result = await response.json();
      
      // Rafraîchir les infos
      await fetchBillingInfo();
      
      alert(result.message || "Synchronisation réussie !");
    } catch (err) {
      setError(err.message);
      alert(`Erreur: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchBillingInfo();
    }
  }, [organizationId]);

  if (!organizationId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Aucune organisation active
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Test Facturation Par Siège</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organisation: {organizationId}
          </p>
        </div>
        <Button
          onClick={syncSeats}
          disabled={syncing || loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          Synchroniser
        </Button>
      </div>

      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <p className="font-medium">Erreur: {error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : billingInfo ? (
        <>
          {/* Statut */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {billingInfo.hasSubscription ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Abonnement actif
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Aucun abonnement
                  </>
                )}
              </CardTitle>
            </CardHeader>
          </Card>

          {billingInfo.hasSubscription && (
            <>
              {/* Détails de facturation */}
              <Card>
                <CardHeader>
                  <CardTitle>Détails de facturation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Plan de base */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Plan Pro Base</p>
                        <p className="text-sm text-muted-foreground">
                          Inclut le propriétaire
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {billingInfo.baseCost.toFixed(2)} €
                        </p>
                        <p className="text-xs text-muted-foreground">/mois</p>
                      </div>
                    </div>

                    {/* Sièges additionnels */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Sièges additionnels</p>
                        <p className="text-sm text-muted-foreground">
                          {billingInfo.additionalSeats} collaborateur(s) × 7.49 €
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {billingInfo.seatCost.toFixed(2)} €
                        </p>
                        <p className="text-xs text-muted-foreground">/mois</p>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold">Total mensuel</p>
                          <p className="text-sm text-muted-foreground">
                            Prochaine facturation
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-bold text-primary">
                            {billingInfo.totalCost.toFixed(2)} €
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Détail du calcul</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between">
                      <span>Plan de base:</span>
                      <span>{billingInfo.baseCost.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sièges ({billingInfo.additionalSeats} × 7.49 €):</span>
                      <span>+ {billingInfo.seatCost.toFixed(2)} €</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total:</span>
                      <span>{billingInfo.totalCost.toFixed(2)} €</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informations */}
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Comment ça marche ?
                      </p>
                      <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                        <li>• Le plan de base (29€) inclut le propriétaire</li>
                        <li>• Chaque collaborateur additionnel coûte 7.49€/mois</li>
                        <li>• La facturation est ajustée automatiquement</li>
                        <li>• La proration est appliquée immédiatement</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Aucune donnée de facturation disponible
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
