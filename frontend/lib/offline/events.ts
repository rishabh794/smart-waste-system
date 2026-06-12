const listeners = new Set<() => void>();

export const subscribeOfflineStore = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

export const notifyOfflineStoreChanged = () => {
  listeners.forEach((callback) => callback());
};

export const OFFLINE_SYNC_COMPLETE_EVENT = "offline-sync-complete";
