"use client";

import { useQuery, useMutation } from "@apollo/client";
import {
  GET_INSTALLED_APPS,
  INSTALL_APP,
  UNINSTALL_APP,
} from "@/src/graphql/installedAppQueries";
import { toast } from "@/src/components/ui/sonner";

export function useInstalledApps(organizationId) {
  const { data, loading, error, refetch } = useQuery(GET_INSTALLED_APPS, {
    variables: { organizationId },
    skip: !organizationId,
    fetchPolicy: "cache-and-network",
  });

  const [installAppMutation, { loading: installLoading }] = useMutation(
    INSTALL_APP,
    {
      onCompleted: () => {
        toast.success("Application installée");
      },
      onError: (error) => {
        toast.error(error.message || "Erreur lors de l'installation");
      },
      refetchQueries: ["GetInstalledApps"],
    }
  );

  const [uninstallAppMutation, { loading: uninstallLoading }] = useMutation(
    UNINSTALL_APP,
    {
      onCompleted: () => {
        toast.success("Application désinstallée");
      },
      onError: (error) => {
        toast.error(error.message || "Erreur lors de la désinstallation");
      },
      refetchQueries: ["GetInstalledApps"],
    }
  );

  const installedAppIds = (data?.getInstalledApps || []).map(
    (app) => app.appId
  );

  const isInstalled = (appId) => installedAppIds.includes(appId);

  const installApp = async (appId) => {
    if (!organizationId) return;
    return installAppMutation({
      variables: { organizationId, appId },
    });
  };

  const uninstallApp = async (appId) => {
    if (!organizationId) return;
    return uninstallAppMutation({
      variables: { organizationId, appId },
    });
  };

  return {
    installedApps: data?.getInstalledApps || [],
    installedAppIds,
    isInstalled,
    loading,
    installLoading,
    uninstallLoading,
    error,
    installApp,
    uninstallApp,
    refetch,
  };
}
