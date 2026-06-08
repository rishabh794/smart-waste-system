"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { subscribeOfflineStore } from "@/lib/offline/events";
import { isBrowserOnline, isEffectivelyOnline } from "@/lib/offline/network";
import { getPendingCount } from "@/lib/offline/queue";
import { flushOutbox } from "@/lib/offline/syncManager";

const CONNECTIVITY_POLL_MS = 10_000;

interface NetworkStatusContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  refreshPendingCount: () => Promise<void>;
}

const NetworkStatusContext = createContext<NetworkStatusContextValue>({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  refreshPendingCount: async () => {},
});

export const useNetworkStatus = () => useContext(NetworkStatusContext);

export default function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const isOnlineRef = useRef(true);
  const isSyncingRef = useRef(false);
  const hasMountedRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  const runSync = useCallback(async () => {
    if (isSyncingRef.current) {
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      await flushOutbox();
      await refreshPendingCount();
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [refreshPendingCount]);

  const handleReconnect = useCallback(async () => {
    toast.success("Back online. Syncing pending changes...", {
      id: "network-status",
      duration: 4000,
    });
    await runSync();
  }, [runSync]);

  const applyOnlineStatus = useCallback(
    async (nextOnline: boolean, showToast: boolean) => {
      const previousOnline = isOnlineRef.current;

      if (previousOnline === nextOnline) {
        setIsOnline(nextOnline);
        return;
      }

      isOnlineRef.current = nextOnline;
      setIsOnline(nextOnline);

      if (!showToast || !hasMountedRef.current) {
        return;
      }

      if (!nextOnline) {
        toast.warning("You're offline. Changes will sync when reconnected.", {
          id: "network-status",
          duration: 5000,
        });
        return;
      }

      await handleReconnect();
    },
    [handleReconnect]
  );

  const evaluateConnectivity = useCallback(
    async (showToast: boolean) => {
      const nextOnline = await isEffectivelyOnline();
      await applyOnlineStatus(nextOnline, showToast);
    },
    [applyOnlineStatus]
  );

  useEffect(() => {
    void evaluateConnectivity(false);
    void (async () => {
      await refreshPendingCount();
      const count = await getPendingCount();
      if (count > 0 && (await isEffectivelyOnline())) {
        await runSync();
      }
    })();

    const handleBrowserOffline = () => {
      void applyOnlineStatus(false, true);
    };

    const handleBrowserOnline = () => {
      void evaluateConnectivity(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void evaluateConnectivity(true);
        if (isOnlineRef.current) {
          void runSync();
        }
      }
    };

    const pollId = window.setInterval(() => {
      void evaluateConnectivity(true);
    }, CONNECTIVITY_POLL_MS);

    window.addEventListener("offline", handleBrowserOffline);
    window.addEventListener("online", handleBrowserOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    hasMountedRef.current = true;

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("offline", handleBrowserOffline);
      window.removeEventListener("online", handleBrowserOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [applyOnlineStatus, evaluateConnectivity, refreshPendingCount, runSync]);

  useEffect(() => {
    return subscribeOfflineStore(() => {
      void refreshPendingCount();
    });
  }, [refreshPendingCount]);

  return (
    <NetworkStatusContext.Provider value={{ isOnline, isSyncing, pendingCount, refreshPendingCount }}>
      {children}
    </NetworkStatusContext.Provider>
  );
}
