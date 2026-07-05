"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from 'swr'; //Stale-While-Revalidate for data fetching and caching [Polling]
import { toast } from "sonner";
import {
  createBinFormSchema,
  createCityFormSchema,
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
  ADMIN_CITIES_KEY,
  ADMIN_DRIVERS_KEY,
  getAdminPendingRoutesKey,
  createBin,
  createCity,
  createDriver,
  createRoute,
  deleteCity,
  fetchBins,
  fetchCities,
  fetchDrivers,
  fetchPendingRoutes,
  updateBinConditionStatus,
} from "@/lib/services/adminService";
import type {
  AdminDashboardSection,
  Bin,
  BinConditionStatus,
  City,
  Driver,
  NewBinFormState,
  NewCityFormState,
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
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [isDeletingCity, setIsDeletingCity] = useState(false);
  const [isUpdatingBins, setIsUpdatingBins] = useState(false);
  // City filter state for the status page.
  const [selectedStatusCity, setSelectedStatusCity] = useState<string>("");
  // useRef: keep dropdown root for outside-click detection.
  const driverMenuRef = useRef<HTMLDivElement | null>(null);

  const [newBin, setNewBin] = useState<NewBinFormState>({
    latitude: "",
    longitude: "",
    cityId: "",
    status: "active",
  });
  const [newDriver, setNewDriver] = useState<NewDriverFormState>({ name: "", email: "", password: "", cityId: "" });
  const [newCity, setNewCity] = useState<NewCityFormState>({ name: "", depotLat: "", depotLng: "" });

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

  const pendingRoutesKey = getAdminPendingRoutesKey(selectedStatusCity || undefined);

  const {
    data: pendingRoutesData,
    error: pendingRoutesError,
    isLoading: isPendingRoutesLoading,
    mutate: mutatePendingRoutes,
  } = useSWR<PendingRoute[]>(pendingRoutesKey, fetchPendingRoutes, {
    // SWR polling keeps route progress fresh.
    refreshInterval: 5000,
  });

  const {
    data: citiesData,
    error: citiesError,
    isLoading: isCitiesLoading,
    mutate: mutateCities,
  } = useSWR<City[]>(ADMIN_CITIES_KEY, fetchCities);

  const bins = binsData ?? [];
  const drivers = driversData ?? [];
  const pendingRoutes = pendingRoutesData ?? [];
  const cities = citiesData ?? [];
  const isDashboardLoading = isBinsLoading || isDriversLoading || isCitiesLoading;

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

        if (Array.isArray(errorPayload?.mismatchedBinIds) && errorPayload.mismatchedBinIds.length > 0) {
          toast.error("Some selected bins belong to a different city than the driver.");
          setSelectedBins((previousSelection) =>
            previousSelection.filter((binId) => !errorPayload.mismatchedBinIds.includes(binId))
          );
          await mutateBins();
        } else if (Array.isArray(errorPayload?.unavailableBinIds) && errorPayload.unavailableBinIds.length > 0) {
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
        setNewBin({ latitude: "", longitude: "", cityId: "", status: "active" });
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


  const handleUpdateSelectedBinsConditionStatus = async (status: BinConditionStatus) => {
    if (isUpdatingBins || selectedBins.length === 0) return;

    setIsUpdatingBins(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      await Promise.all(
        selectedBins.map(async (binId) => {
          const targetBin = bins.find((bin) => bin.id === binId);
          if (!targetBin || targetBin.status === "ASSIGNED_TODAY" || normalizeConditionStatus(targetBin.conditionStatus) === status) {
            return; // Skip invalid or already correct bins
          }
          const res = await updateBinConditionStatus(binId, { status });
          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        })
      );

      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} bin(s) to ${status}.`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} bin(s).`);
      }

      setSelectedBins([]); // Clear selection after bulk update
      await mutateBins();
    } catch (error) {
      console.error(error);
      toast.error("Network issue while updating bin statuses. Please try again.");
    } finally {
      setIsUpdatingBins(false);
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
        setNewDriver({ name: "", email: "", password: "", cityId: "" });
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

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAddingCity) return;

    const parsedPayload = createCityFormSchema.safeParse(newCity);
    if (!parsedPayload.success) {
      toast.warning(getValidationErrorMessage(parsedPayload.error));
      return;
    }

    setIsAddingCity(true);

    try {
      const res = await createCity(parsedPayload.data);
      if (res.ok) {
        toast.success("City added successfully.");
        setNewCity({ name: "", depotLat: "", depotLng: "" });
        await mutateCities();
      } else {
        toast.error(await getApiErrorMessage(res, "Unable to add city right now."));
      }
    } catch (error) {
      console.error(error);
      toast.error("Network issue while adding city. Please try again.");
    } finally {
      setIsAddingCity(false);
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    if (isDeletingCity) return;

    setIsDeletingCity(true);

    try {
      const res = await deleteCity(cityId);
      if (res.ok) {
        toast.success("City deleted successfully.");
        await mutateCities();
      } else {
        toast.error(await getApiErrorMessage(res, "Unable to delete city right now."));
      }
    } catch (error) {
      console.error(error);
      toast.error("Network issue while deleting city. Please try again.");
    } finally {
      setIsDeletingCity(false);
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

          {!isDashboardLoading && (binsError || driversError || citiesError) && (
            <div className="rounded-xl border border-[#f1caca] bg-[#fff4f3] p-4 text-sm font-semibold text-[#8d2e2b]">
              Unable to load dashboard data right now. Please try again.
            </div>
          )}

          {!isDashboardLoading && !binsError && !driversError && !citiesError && (
            <AdminDashboardContent
              bins={bins}
              drivers={drivers}
              cities={cities}
              selectedBins={selectedBins}
              selectedDriver={selectedDriver}
              selectedDriverName={selectedDriverName}
              isDriverMenuOpen={isDriverMenuOpen}
              isCreatingRoute={isCreatingRoute}
              isUpdatingBins={isUpdatingBins}
              driverMenuRef={driverMenuRef}
              onToggleDriverMenu={() => setIsDriverMenuOpen((currentState) => !currentState)}
              onToggleBinSelection={toggleBinSelection}
              onSelectDriver={handleDriverSelection}
              onCreateRoute={handleCreateRoute}
              onUpdateSelectedBinsConditionStatus={handleUpdateSelectedBinsConditionStatus}
            />
          )}
        </>
      )}

      {section === "status" && (
        <AdminStatusContent
          pendingRoutes={pendingRoutes}
          isPendingRoutesLoading={isPendingRoutesLoading}
          pendingRoutesError={pendingRoutesError}
          cities={cities}
          selectedCityId={selectedStatusCity}
          onCityChange={setSelectedStatusCity}
        />
      )}

      {section === "create" && (
        <AdminCreateContent
          cities={cities}
          isCitiesLoading={isCitiesLoading}
          newBin={newBin}
          setNewBin={setNewBin}
          newDriver={newDriver}
          setNewDriver={setNewDriver}
          newCity={newCity}
          setNewCity={setNewCity}
          showNewDriverPassword={showNewDriverPassword}
          setShowNewDriverPassword={setShowNewDriverPassword}
          isAddingBin={isAddingBin}
          isAddingDriver={isAddingDriver}
          isAddingCity={isAddingCity}
          isDeletingCity={isDeletingCity}
          onAddBin={handleAddBin}
          onAddDriver={handleAddDriver}
          onAddCity={handleAddCity}
          onDeleteCity={handleDeleteCity}
        />
      )}
    </div>
  );
}
