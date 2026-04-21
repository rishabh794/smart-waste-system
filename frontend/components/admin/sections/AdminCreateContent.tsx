"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { ChevronIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import type { NewBinFormState, NewDriverFormState } from "@/types/AdminTypes";

interface AdminCreateContentProps {
  newBin: NewBinFormState;
  setNewBin: Dispatch<SetStateAction<NewBinFormState>>;
  newDriver: NewDriverFormState;
  setNewDriver: Dispatch<SetStateAction<NewDriverFormState>>;
  showNewDriverPassword: boolean;
  setShowNewDriverPassword: Dispatch<SetStateAction<boolean>>;
  isAddingBin: boolean;
  isAddingDriver: boolean;
  onAddBin: (event: FormEvent) => Promise<void>;
  onAddDriver: (event: FormEvent) => Promise<void>;
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
  newBin,
  setNewBin,
  newDriver,
  setNewDriver,
  showNewDriverPassword,
  setShowNewDriverPassword,
  isAddingBin,
  isAddingDriver,
  onAddBin,
  onAddDriver,
}: AdminCreateContentProps) {
  const [isBinStatusMenuOpen, setIsBinStatusMenuOpen] = useState(false);
  const binStatusMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!binStatusMenuRef.current) return;
      if (binStatusMenuRef.current.contains(event.target as Node)) return;
      setIsBinStatusMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const selectedBinStatusLabel =
    binStatusOptions.find((option) => option.value === newBin.status)?.label ?? "Active";

  return (
    <section className="grid gap-7 lg:grid-cols-[1fr_1fr]">
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
          <input
            type="text"
            placeholder="Zone Name (e.g. North)"
            required
            className="input-clean"
            value={newBin.zone}
            onChange={(event) =>
              setNewBin((currentState) => ({ ...currentState, zone: event.target.value }))
            }
          />
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
          <button
            type="submit"
            disabled={isAddingDriver}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isAddingDriver ? "Creating Driver..." : "Create Driver Account"}
          </button>
        </form>
      </div>
    </section>
  );
}
