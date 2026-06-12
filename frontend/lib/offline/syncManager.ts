import { toast } from "sonner";
import { OFFLINE_SYNC_COMPLETE_EVENT, notifyOfflineStoreChanged } from "@/lib/offline/events";
import { isAuthError, isEffectivelyOnline, isNetworkError } from "@/lib/offline/network";
import {
  listPendingOutboxItems,
  markOutboxItemFailed,
  markOutboxItemSynced,
  removePendingReport,
} from "@/lib/offline/queue";
import { uploadReportImage } from "@/lib/offline/uploadReportImage";
import { getApiErrorMessage } from "@/lib/services/apiService";
import { completeDriverRoute, updateDriverBinStatus } from "@/lib/services/driverService";
import { createReport } from "@/lib/services/reportService";
import type { OutboxItem } from "@/lib/offline/types";

let flushing = false;

const hasPendingBinUpdatesForRoute = (items: OutboxItem[], routeId: string) =>
  items.some(
    (item) => item.type === "bin_status" && item.status === "pending" && item.routeId === routeId
  );

const syncCitizenReport = async (item: Extract<OutboxItem, { type: "citizen_report" }>) => {
  let imageUrl = item.payload.imageUrl;

  if (!imageUrl) {
    if (!item.imageBlob) {
      throw new Error("Missing image data for offline report.");
    }
    imageUrl = await uploadReportImage(item.imageBlob);
  }

  const res = await createReport({
    ...item.payload,
    imageUrl,
  });

  if (!res.ok) {
    if (isAuthError(res)) {
      throw new Error("AUTH_ERROR");
    }
    throw new Error(await getApiErrorMessage(res, "Unable to submit report."));
  }

  await markOutboxItemSynced(item.id);
  await removePendingReport(item.id);
  toast.success("Report synced successfully.");
};

const syncBinStatus = async (item: Extract<OutboxItem, { type: "bin_status" }>) => {
  const res = await updateDriverBinStatus(item.routeId, item.binId, item.binStatus, item.options);

  if (!res.ok) {
    if (isAuthError(res)) {
      throw new Error("AUTH_ERROR");
    }
    throw new Error(await getApiErrorMessage(res, "Unable to update bin status."));
  }

  await markOutboxItemSynced(item.id);
};

const syncRouteComplete = async (item: Extract<OutboxItem, { type: "route_complete" }>) => {
  const res = await completeDriverRoute(item.routeId);

  if (!res.ok) {
    if (isAuthError(res)) {
      throw new Error("AUTH_ERROR");
    }
    throw new Error(await getApiErrorMessage(res, "Unable to complete route."));
  }

  await markOutboxItemSynced(item.id);
  toast.success("Route completion synced.");
};

export const flushOutbox = async () => {
  if (flushing || !(await isEffectivelyOnline())) {
    return { synced: 0, stopped: true };
  }

  flushing = true;
  let synced = 0;

  try {
    let pendingItems = await listPendingOutboxItems();

    while (pendingItems.length > 0) {
      let progressed = false;

      for (const item of pendingItems) {
        if (item.type === "route_complete" && hasPendingBinUpdatesForRoute(pendingItems, item.routeId)) {
          continue;
        }

        try {
          if (item.type === "citizen_report") {
            await syncCitizenReport(item);
          } else if (item.type === "bin_status") {
            await syncBinStatus(item);
          } else if (item.type === "route_complete") {
            await syncRouteComplete(item);
          }

          synced += 1;
          progressed = true;
        } catch (error) {
          if (error instanceof Error && error.message === "AUTH_ERROR") {
            toast.error("Session expired — sign in to sync pending changes.");
            return { synced, stopped: true };
          }

          if (!(await isEffectivelyOnline()) || isNetworkError(error)) {
            return { synced, stopped: true };
          }

          const message =
            error instanceof Error ? error.message : "Unable to sync pending change.";
          await markOutboxItemFailed(item.id, message);
          toast.error(message);
          progressed = true;
        }
      }

      if (!progressed) {
        break;
      }

      pendingItems = await listPendingOutboxItems();
    }

    if (synced > 0) {
      window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_COMPLETE_EVENT));
    }

    notifyOfflineStoreChanged();
    return { synced, stopped: false };
  } finally {
    flushing = false;
  }
};
