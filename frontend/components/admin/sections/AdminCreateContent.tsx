"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { ChevronIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import type { City, NewBinFormState, NewCityFormState, NewDriverFormState } from "@/types/AdminTypes";

interface AdminCreateContentProps {
  cities: City[];
  isCitiesLoading: boolean;
  newBin: NewBinFormState;
  setNewBin: Dispatch<SetStateAction<NewBinFormState>>;
  newDriver: NewDriverFormState;
  setNewDriver: Dispatch<SetStateAction<NewDriverFormState>>;
  newCity: NewCityFormState;
  setNewCity: Dispatch<SetStateAction<NewCityFormState>>;
  showNewDriverPassword: boolean;
  setShowNewDriverPassword: Dispatch<SetStateAction<boolean>>;
  isAddingBin: boolean;
  isAddingDriver: boolean;
  isAddingCity: boolean;
  isDeletingCity: boolean;
  onAddBin: (event: FormEvent) => Promise<void>;
  onAddDriver: (event: FormEvent) => Promise<void>;
  onAddCity: (event: FormEvent) => Promise<void>;
  onDeleteCity: (cityId: string) => Promise<void>;
}

const binStatusOptions: Array<{
  value: NewBinFormState["status"];
  label: string;
}> = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

export default function AdminCreateContent({
  cities,
  isCitiesLoading,
  newBin,
  setNewBin,
  newDriver,
  setNewDriver,
  newCity,
  setNewCity,
  showNewDriverPassword,
  setShowNewDriverPassword,
  isAddingBin,
  isAddingDriver,
  isAddingCity,
  isDeletingCity,
  onAddBin,
  onAddDriver,
  onAddCity,
  onDeleteCity,
}: AdminCreateContentProps) {
  const [isBinStatusMenuOpen, setIsBinStatusMenuOpen] = useState(false);
  const [isBinCityMenuOpen, setIsBinCityMenuOpen] = useState(false);
  const [isDriverCityMenuOpen, setIsDriverCityMenuOpen] = useState(false);
  const binStatusMenuRef = useRef<HTMLDivElement | null>(null);
  const binCityMenuRef = useRef<HTMLDivElement | null>(null);
  const driverCityMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (binStatusMenuRef.current && !binStatusMenuRef.current.contains(event.target as Node)) {
        setIsBinStatusMenuOpen(false);
      }
      if (binCityMenuRef.current && !binCityMenuRef.current.contains(event.target as Node)) {
        setIsBinCityMenuOpen(false);
      }
      if (driverCityMenuRef.current && !driverCityMenuRef.current.contains(event.target as Node)) {
        setIsDriverCityMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const selectedBinStatusLabel =
    binStatusOptions.find((option) => option.value === newBin.status)?.label ?? "Active";

  const selectedBinCityName =
    cities.find((city) => city.id === newBin.cityId)?.name ?? "-- Select City --";

  const selectedDriverCityName =
    cities.find((city) => city.id === newDriver.cityId)?.name ?? "-- Select City --";

  return (
    <section className="space-y-7">
      <div className="grid gap-7 lg:grid-cols-[1fr_1fr]">
        {/* ───── Register New Bin ───── */}
        <div className="rounded-2xl border border-[#e4ece6] bg-[#f8fcf9] p-6">
          <h3 className="mb-4 text-xl font-extrabold text-[#1f412f]">Register New Bin</h3>
          <form onSubmit={onAddBin} className="space-y-3">
            <input
              type="number"
              step="any"
              placeholder="Latitude (e.g. 30.316)"
              required
              className="input-clean"
              value={newBin.latitude}
              onChange={(event) =>
                setNewBin((currentState) => ({ ...currentState, latitude: event.target.value }))
              }
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude (e.g. 78.032)"
              required
              className="input-clean"
              value={newBin.longitude}
              onChange={(event) =>
                setNewBin((currentState) => ({ ...currentState, longitude: event.target.value }))
              }
            />

            {/* City Dropdown for Bin */}
            <div ref={binCityMenuRef} className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isBinCityMenuOpen}
                onClick={() => setIsBinCityMenuOpen((currentState) => !currentState)}
                className={`dropdown-clean ${isBinCityMenuOpen ? "dropdown-clean-open" : ""}`}
              >
                <span className={newBin.cityId ? "text-[#1f3b2d]" : "text-[#4f6759]"}>
                  {selectedBinCityName}
                </span>
                <ChevronIcon open={isBinCityMenuOpen} />
              </button>

              {isBinCityMenuOpen && (
                <div
                  role="listbox"
                  className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-[#bfd5c5] bg-[#f7fcf8] shadow-lg"
                >
                  <div className="max-h-56 overflow-y-auto">
                    {isCitiesLoading ? (
                      <p className="px-3 py-3 text-sm italic text-[#5c7165]">Loading cities...</p>
                    ) : cities.length === 0 ? (
                      <p className="px-3 py-3 text-sm italic text-[#5c7165]">No cities available. Add a city first.</p>
                    ) : (
                      cities.map((city) => (
                        <button
                          key={city.id}
                          type="button"
                          role="option"
                          aria-selected={newBin.cityId === city.id}
                          className={`dropdown-option ${newBin.cityId === city.id ? "dropdown-option-selected" : ""}`}
                          onClick={() => {
                            setNewBin((currentState) => ({ ...currentState, cityId: city.id }));
                            setIsBinCityMenuOpen(false);
                          }}
                        >
                          {city.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bin Status Dropdown */}
            <div ref={binStatusMenuRef} className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isBinStatusMenuOpen}
                onClick={() => setIsBinStatusMenuOpen((currentState) => !currentState)}
                className={`dropdown-clean ${isBinStatusMenuOpen ? "dropdown-clean-open" : ""}`}
              >
                <span className="text-[#1f3b2d]">{selectedBinStatusLabel}</span>
                <ChevronIcon open={isBinStatusMenuOpen} />
              </button>

              {isBinStatusMenuOpen && (
                <div
                  role="listbox"
                  className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-[#bfd5c5] bg-[#f7fcf8] shadow-lg"
                >
                  {binStatusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={newBin.status === option.value}
                      className={`dropdown-option ${newBin.status === option.value ? "dropdown-option-selected" : ""}`}
                      onClick={() => {
                        setNewBin((currentState) => ({ ...currentState, status: option.value }));
                        setIsBinStatusMenuOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isAddingBin}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isAddingBin ? "Adding Bin..." : "Add Bin"}
            </button>
          </form>
        </div>

        {/* ───── Register New Driver ───── */}
        <div className="rounded-2xl border border-[#e4ece6] bg-[#f9fdfb] p-6">
          <h3 className="mb-4 text-xl font-extrabold text-[#1f412f]">Register New Driver</h3>
          <form onSubmit={onAddDriver} className="space-y-3">
            <input
              type="text"
              placeholder="Full Name"
              required
              className="input-clean"
              value={newDriver.name}
              onChange={(event) =>
                setNewDriver((currentState) => ({ ...currentState, name: event.target.value }))
              }
            />
            <input
              type="email"
              placeholder="Email Address"
              required
              className="input-clean"
              value={newDriver.email}
              onChange={(event) =>
                setNewDriver((currentState) => ({ ...currentState, email: event.target.value }))
              }
            />
            <div className="relative">
              <input
                type={showNewDriverPassword ? "text" : "password"}
                placeholder="Temporary Password"
                required
                className="input-clean pr-11"
                value={newDriver.password}
                onChange={(event) =>
                  setNewDriver((currentState) => ({ ...currentState, password: event.target.value }))
                }
              />
              <button
                type="button"
                onClick={() => setShowNewDriverPassword((currentState) => !currentState)}
                className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-[#4c6658] transition hover:bg-[#e9f4ed] hover:text-[#1f6b40]"
                aria-label={showNewDriverPassword ? "Hide password" : "Show password"}
              >
                {showNewDriverPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* City Dropdown for Driver */}
            <div ref={driverCityMenuRef} className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isDriverCityMenuOpen}
                onClick={() => setIsDriverCityMenuOpen((currentState) => !currentState)}
                className={`dropdown-clean ${isDriverCityMenuOpen ? "dropdown-clean-open" : ""}`}
              >
                <span className={newDriver.cityId ? "text-[#1f3b2d]" : "text-[#4f6759]"}>
                  {selectedDriverCityName}
                </span>
                <ChevronIcon open={isDriverCityMenuOpen} />
              </button>

              {isDriverCityMenuOpen && (
                <div
                  role="listbox"
                  className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-[#bfd5c5] bg-[#f7fcf8] shadow-lg"
                >
                  <div className="max-h-56 overflow-y-auto">
                    {isCitiesLoading ? (
                      <p className="px-3 py-3 text-sm italic text-[#5c7165]">Loading cities...</p>
                    ) : cities.length === 0 ? (
                      <p className="px-3 py-3 text-sm italic text-[#5c7165]">No cities available. Add a city first.</p>
                    ) : (
                      cities.map((city) => (
                        <button
                          key={city.id}
                          type="button"
                          role="option"
                          aria-selected={newDriver.cityId === city.id}
                          className={`dropdown-option ${newDriver.cityId === city.id ? "dropdown-option-selected" : ""}`}
                          onClick={() => {
                            setNewDriver((currentState) => ({ ...currentState, cityId: city.id }));
                            setIsDriverCityMenuOpen(false);
                          }}
                        >
                          {city.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isAddingDriver}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isAddingDriver ? "Creating Driver..." : "Create Driver Account"}
            </button>
          </form>
        </div>
      </div>

      {/* ───── Manage Cities ───── */}
      <div className="rounded-2xl border border-[#e4ece6] bg-[#f8fcf9] p-6">
        <h3 className="mb-4 text-xl font-extrabold text-[#1f412f]">Manage Cities</h3>
        <form onSubmit={onAddCity} className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <input
            type="text"
            placeholder="City Name (e.g. Siliguri)"
            required
            className="input-clean"
            value={newCity.name}
            onChange={(event) =>
              setNewCity((currentState) => ({ ...currentState, name: event.target.value }))
            }
          />
          <input
            type="number"
            step="any"
            placeholder="Depot Latitude (optional)"
            className="input-clean"
            value={newCity.depotLat}
            onChange={(event) =>
              setNewCity((currentState) => ({ ...currentState, depotLat: event.target.value }))
            }
          />
          <input
            type="number"
            step="any"
            placeholder="Depot Longitude (optional)"
            className="input-clean"
            value={newCity.depotLng}
            onChange={(event) =>
              setNewCity((currentState) => ({ ...currentState, depotLng: event.target.value }))
            }
          />
          <button
            type="submit"
            disabled={isAddingCity}
            className="btn-primary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isAddingCity ? "Adding..." : "Add City"}
          </button>
        </form>

        {isCitiesLoading ? (
          <p className="text-sm italic text-[#5c7165]">Loading cities...</p>
        ) : cities.length === 0 ? (
          <p className="text-sm italic text-[#5c7165]">No cities registered yet.</p>
        ) : (
          <ul className="divide-y divide-[#edf2ee] rounded-xl border border-[#e4ece6] bg-[#fcfffd]">
            {cities.map((city) => (
              <li key={city.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <span className="font-semibold text-[#244734]">{city.name}</span>
                  {city.depotLat != null && city.depotLng != null ? (
                    <span className="ml-2 text-xs text-[#5a7062]">
                      Depot: {city.depotLat.toFixed(4)}, {city.depotLng.toFixed(4)}
                    </span>
                  ) : (
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-600">
                      No Depot
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteCity(city.id)}
                  disabled={isDeletingCity}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
