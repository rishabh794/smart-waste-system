import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { OutboxItem, PendingCitizenReport, RouteSnapshot } from "@/lib/offline/types";

interface OfflineDBSchema extends DBSchema {
  outbox: {
    key: string;
    value: OutboxItem;
    indexes: { "by-createdAt": number; "by-status": OutboxItem["status"] };
  };
  pendingReports: {
    key: string;
    value: PendingCitizenReport;
  };
  routeSnapshots: {
    key: string;
    value: RouteSnapshot;
  };
}

const DB_NAME = "smart-waste-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OfflineDBSchema>> | null = null;

export const getOfflineDb = () => {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        const outbox = database.createObjectStore("outbox", { keyPath: "id" });
        outbox.createIndex("by-createdAt", "createdAt");
        outbox.createIndex("by-status", "status");
        database.createObjectStore("pendingReports", { keyPath: "id" });
        database.createObjectStore("routeSnapshots", { keyPath: "userId" });
      },
    });
  }

  return dbPromise;
};
