"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from 'swr'; //Stale-While-Revalidate for data fetching and caching [Polling]
import { toast } from "sonner";
import {
  createBinFormSchema,
  createDriverFormSchema,
  createRouteFormSchema,
  getValidationErrorMessage,
} from '@/lib/validation';
import DataLoadingState from "@/components/ui/DataLoadingState";
import AdminCreateContent from "@/components/admin/sections/AdminCreateContent";
import AdminDashboardContent from "@/components/admin/sections/AdminDashboardContent";
import AdminStatusContent from "@/components/admin/sections/AdminStatusContent";
import { getApiErrorMessage } from "@/lib/services/apiService";
import {
  ADMIN_BINS_KEY,
  ADMIN_DRIVERS_KEY,
  ADMIN_PENDING_ROUTES_KEY,
  createBin,
  createDriver,
  createRoute,
  fetchBins,
  fetchDrivers,
  fetchPendingRoutes,
  updateBinConditionStatus,
} from "@/lib/services/adminService";
import type {
  AdminDashboardSection,
  Bin,
  BinConditionStatus,
  Driver,
  NewBinFormState,
  NewDriverFormState,
  PendingRoute,
} from "@/types/AdminTypes";

export default function AdminDashboard({ section = "dashboard" }: { section?: AdminDashboardSection }) {
  // Important selection state used by route dispatch flow.
  const [selectedBins, setSelectedBins] = useState<string[]>([]);
  // Important selection state used by route dispatch flow.
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [showNewDriverPassword, setShowNewDriverPassword] = useState(false);
  const [isDriverMenuOpen, setIsDriverMenuOpen] = useState(false);
  // Important request states to prevent duplicate submissions.
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [isAddingBin, setIsAddingBin] = useState(false);
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [updatingBinId, setUpdatingBinId] = useState<string | null>(null);
  // useRef: keep dropdown root for outside-click detection.
  const driverMenuRef = useRef<HTMLDivElement | null>(null);

  const [newBin, setNewBin] = useState<NewBinFormState>({
    latitude: "",
    longitude: "",
    zone: "",
    status: "active",
  });
  const [newDriver, setNewDriver] = useState<NewDriverFormState>({ name: "", email: "", password: "" });

  const {
    data: binsData,
    error: binsError,
    isLoading: isBinsLoading,
    mutate: mutateBins,
  } = useSWR<Bin[]>(ADMIN_BINS_KEY, fetchBins, {
    // SWR polling keeps map/status data fresh.
    refreshInterval: 5000,
  });

  const {
    data: driversData,
    error: driversError,
    isLoading: isDriversLoading,
    mutate: mutateDrivers,
  } = useSWR<Driver[]>(ADMIN_DRIVERS_KEY, fetchDrivers);

  const {
    data: pendingRoutesData,
    error: pendingRoutesError,
    isLoading: isPendingRoutesLoading,
    mutate: mutatePendingRoutes,
  } = useSWR<PendingRoute[]>(ADMIN_PENDING_ROUTES_KEY, fetchPendingRoutes, {
    // SWR polling keeps route progress fresh.
    refreshInterval: 5000,
  });

  const bins = binsData ?? [];
  const drivers = driversData ?? [];
  const pendingRoutes = pendingRoutesData ?? [];
  const isDashboardLoading = isBinsLoading || isDriversLoading;

  const selectedDriverName =
    drivers.find((driver) => driver.id === selectedDriver)?.name ?? "-- Choose a Driver --";

  const normalizeConditionStatus = (conditionStatus: Bin["conditionStatus"]): BinConditionStatus => {
    return conditionStatus ?? "active";
  };

  // useEffect: close dropdown when user clicks outside the menu.
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!driverMenuRef.current) return;
      if (driverMenuRef.current.contains(event.target as Node)) return;
      setIsDriverMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const toggleBinSelection = (binId: string) => {
    setSelectedBins((prev) =>
      prev.includes(binId) ? prev.filter(id => id !== binId) : [...prev, binId]
    );
  };

  const handleDriverSelection = (driverId: string) => {
    setSelectedDriver(driverId);
    setIsDriverMenuOpen(false);
  };

  const handleCreateRoute = async () => {
    if (isCreatingRoute) return;

    const parsedPayload = createRouteFormSchema.safeParse({
      driverId: selectedDriver,
      binIds: selectedBins,
    });

    if (!parsedPayload.success) {
      toast.warning(getValidationErrorMessage(parsedPayload.error));
      return;
    }

    setIsCreatingRoute(true);

    try {
      // API call: create and dispatch a route for selected bins/driver.
      const res = await createRoute(parsedPayload.data);

      if (res.ok) {
        toast.success("Route dispatched successfully.");
        setSelectedBins([]);
        await Promise.all([mutateBins(), mutatePendingRoutes()]);
      } else {
        const errorPayload = await res.json().catch(() => null);

        if (Array.isArray(errorPayload?.unavailableBinIds) && errorPayload.unavailableBinIds.length > 0) {
          toast.error("Some selected bins are unavailable (maintenance/retired or already on route). Please refresh selections.");
          setSelectedBins((previousSelection) =>
            previousSelection.filter((binId) => !errorPayload.unavailableBinIds.includes(binId))
          );
          await mutateBins();
        } else if (typeof errorPayload?.error === "string" && errorPayload.error.trim().length > 0) {
          toast.error(errorPayload.error);
        } else {
          toast.error("Unable to create route right now.");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Network issue while creating route. Please try again.");
    } finally {
      setIsCreatingRoute(false);
    }
  };

  const handleAddBin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAddingBin) return;

    const parsedPayload = createBinFormSchema.safeParse(newBin);
    if (!parsedPayload.success) {
      toast.warning(getValidationErrorMessage(parsedPayload.error));
      return;
    }

    setIsAddingBin(true);

    try {
      // API call: register a new bin in the system.
      const res = await createBin(parsedPayload.data);
      if (res.ok) {
        toast.success("Bin registered successfully.");
        setNewBin({ latitude: "", longitude: "", zone: "", status: "active" });
        await mutateBins();
      } else {
        toast.error(await getApiErrorMessage(res, "Unable to register bin right now."));
      }
    } catch (error) {
      console.error(error);
      toast.error("Network issue while registering bin. Please try again.");
    } finally {
      setIsAddingBin(false);
    }
  };

  const handleUpdateBinConditionStatus = async (binId: string, status: BinConditionStatus) => {
    if (updatingBinId) return;

    const targetBin = bins.find((bin) => bin.id === binId);
    if (!targetBin) {
      toast.error("Unable to locate the selected bin.");
      return;
    }

    if (normalizeConditionStatus(targetBin.conditionStatus) === status) {
      return;
    }

    if (targetBin.status === "ASSIGNED_TODAY") {
      toast.warning("Bin condition cannot be changed while it is ON ROUTE.");
      return;
    }

    setUpdatingBinId(binId);

    try {
      const res = await updateBinConditionStatus(binId, { status });

      if (res.ok) {
        toast.success(`Bin status updated to ${status}.`);

        if (status !== "active") {
          setSelectedBins((currentSelection) => currentSelection.filter((selectedBinId) => selectedBinId !== binId));
        }

        await mutateBins();
      } else {
        toast.error(await getApiErrorMessage(res, "Unable to update bin status right now."));
      }
    } catch (error) {
      console.error(error);
      toast.error("Network issue while updating bin status. Please try again.");
    } finally {
      setUpdatingBinId(null);
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAddingDriver) return;

    const parsedPayload = createDriverFormSchema.safeParse(newDriver);
    if (!parsedPayload.success) {
      toast.warning(getValidationErrorMessage(parsedPayload.error));
      return;
    }

    setIsAddingDriver(true);

    try {
      // API call: create a new driver account.
      const res = await createDriver(parsedPayload.data);
      if (res.ok) {
        toast.success("Driver account created successfully.");
        setNewDriver({ name: "", email: "", password: "" });
        await mutateDrivers();
      } else {
        toast.error(await getApiErrorMessage(res, "Unable to create driver account right now."));
      }
    } catch (error) {
      console.error(error);
      toast.error("Network issue while creating driver account. Please try again.");
    } finally {
      setIsAddingDriver(false);
    }
  };

  return (
    <div className="space-y-8">
      {section === "dashboard" && (
        <>
          {isDashboardLoading && (
            <DataLoadingState
              title="Loading dashboard data"
              subtitle="Syncing bins, drivers, and dispatch controls."
            />
          )}

          {!isDashboardLoading && (binsError || driversError) && (
            <div className="rounded-xl border border-[#f1caca] bg-[#fff4f3] p-4 text-sm font-semibold text-[#8d2e2b]">
              Unable to load dashboard data right now. Please try again.
            </div>
          )}

          {!isDashboardLoading && !binsError && !driversError && (
            <AdminDashboardContent
              bins={bins}
              drivers={drivers}
              selectedBins={selectedBins}
              selectedDriver={selectedDriver}
              selectedDriverName={selectedDriverName}
              isDriverMenuOpen={isDriverMenuOpen}
              isCreatingRoute={isCreatingRoute}
              updatingBinId={updatingBinId}
              driverMenuRef={driverMenuRef}
              onToggleDriverMenu={() => setIsDriverMenuOpen((currentState) => !currentState)}
              onToggleBinSelection={toggleBinSelection}
              onSelectDriver={handleDriverSelection}
              onCreateRoute={handleCreateRoute}
              onUpdateBinConditionStatus={handleUpdateBinConditionStatus}
            />
          )}
        </>
      )}

      {section === "status" && (
        <AdminStatusContent
          pendingRoutes={pendingRoutes}
          isPendingRoutesLoading={isPendingRoutesLoading}
          pendingRoutesError={pendingRoutesError}
        />
      )}

      {section === "create" && (
        <AdminCreateContent
          newBin={newBin}
          setNewBin={setNewBin}
          newDriver={newDriver}
          setNewDriver={setNewDriver}
          showNewDriverPassword={showNewDriverPassword}
          setShowNewDriverPassword={setShowNewDriverPassword}
          isAddingBin={isAddingBin}
          isAddingDriver={isAddingDriver}
          onAddBin={handleAddBin}
          onAddDriver={handleAddDriver}
        />
      )}
    </div>
  );
}
