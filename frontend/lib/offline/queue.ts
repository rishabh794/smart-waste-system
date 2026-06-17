import { getOfflineDb } from "@/lib/offline/db";
import { notifyOfflineStoreChanged } from "@/lib/offline/events";
import type {
  BinStatusOptions,
  OutboxItem,
  PendingCitizenReport,
  RouteSnapshot,
} from "@/lib/offline/types";
import type { CreateReportPayload } from "@/types/CitizenTypes";
import type { DriverBinStatus } from "@/types/DriverTypes";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const listPendingOutboxItems = async () => {
  const db = await getOfflineDb();
  const items = await db.getAll("outbox");
  return items
    .filter((item) => item.status === "pending")
    .sort((a, b) => a.createdAt - b.createdAt);
};

export const listAllOutboxItems = async () => {
  const db = await getOfflineDb();
  const items = await db.getAll("outbox");
  return items.sort((a, b) => a.createdAt - b.createdAt);
};

export const getPendingCount = async () => {
  const items = await listPendingOutboxItems();
  return items.length;
};

export const enqueueCitizenReport = async (input: {
  userId: string;
  payload: Omit<CreateReportPayload, "imageUrl">;
  imageBlob: Blob;
}) => {
  const id = createId();
  const createdAt = Date.now();

  const outboxItem: OutboxItem = {
    id,
    userId: input.userId,
    type: "citizen_report",
    createdAt,
    status: "pending",
    payload: input.payload,
    imageBlob: input.imageBlob,
  };

  const pendingReport: PendingCitizenReport = {
    id,
    title: input.payload.title,
    description: input.payload.description,
    category: input.payload.category,
    latitude: input.payload.latitude,
    longitude: input.payload.longitude,
    address: input.payload.address,
    binId: input.payload.binId,
    createdAt: new Date(createdAt).toISOString(),
  };

  const db = await getOfflineDb();
  const tx = db.transaction(["outbox", "pendingReports"], "readwrite");
  await tx.objectStore("outbox").put(outboxItem);
  await tx.objectStore("pendingReports").put(pendingReport);
  await tx.done;

  notifyOfflineStoreChanged();
  return id;
};

export const enqueueBinStatus = async (input: {
  userId: string;
  routeId: string;
  binId: string;
  status: DriverBinStatus;
  driverLatitude: number;
  driverLongitude: number;
  options?: BinStatusOptions;
}) => {
  const outboxItem: OutboxItem = {
    id: createId(),
    userId: input.userId,
    type: "bin_status",
    createdAt: Date.now(),
    status: "pending",
    routeId: input.routeId,
    binId: input.binId,
    binStatus: input.status,
    driverLatitude: input.driverLatitude,
    driverLongitude: input.driverLongitude,
    options: input.options,
  };

  const db = await getOfflineDb();
  await db.put("outbox", outboxItem);
  notifyOfflineStoreChanged();
  return outboxItem.id;
};

export const enqueueRouteComplete = async (userId: string, routeId: string) => {
  const outboxItem: OutboxItem = {
    id: createId(),
    userId,
    type: "route_complete",
    createdAt: Date.now(),
    status: "pending",
    routeId,
  };

  const db = await getOfflineDb();
  await db.put("outbox", outboxItem);
  notifyOfflineStoreChanged();
  return outboxItem.id;
};

export const markOutboxItemSynced = async (id: string) => {
  const db = await getOfflineDb();
  await db.delete("outbox", id);
  notifyOfflineStoreChanged();
};

export const markOutboxItemFailed = async (id: string, failureReason: string) => {
  const db = await getOfflineDb();
  const item = await db.get("outbox", id);
  if (!item) return;

  await db.put("outbox", {
    ...item,
    status: "failed",
    failureReason,
  });
  notifyOfflineStoreChanged();
};

export const removePendingReport = async (id: string) => {
  const db = await getOfflineDb();
  await db.delete("pendingReports", id);
  notifyOfflineStoreChanged();
};

export const listPendingReports = async () => {
  const db = await getOfflineDb();
  const reports = await db.getAll("pendingReports");
  return reports.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const getOutboxItem = async (id: string) => {
  const db = await getOfflineDb();
  return db.get("outbox", id);
};

export const saveRouteSnapshot = async (snapshot: RouteSnapshot) => {
  const db = await getOfflineDb();
  await db.put("routeSnapshots", snapshot);
};

export const getRouteSnapshot = async (userId: string) => {
  const db = await getOfflineDb();
  return db.get("routeSnapshots", userId);
};

export const getRouteGeometrySnapshot = async (routeId: string) => {
  const db = await getOfflineDb();
  const snapshots = await db.getAll("routeSnapshots");
  return snapshots.find((snapshot) => snapshot.route?.routeId === routeId)?.geometry ?? null;
};
