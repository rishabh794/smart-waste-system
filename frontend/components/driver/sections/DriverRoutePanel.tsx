"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronIcon } from "@/components/ui/icons";
import type {
  BinStatusUpdate,
  DriverBinStatus,
  MissedReasonCode,
  RouteData,
} from "@/types/DriverTypes";

const MISSED_REASON_OPTIONS: Array<{ value: MissedReasonCode; label: string }> = [
  { value: "road_blocked", label: "Road Blocked" },
  { value: "access_denied", label: "Access Denied" },
  { value: "gate_locked", label: "Gate Locked" },
  { value: "vehicle_breakdown", label: "Vehicle Breakdown" },
  { value: "safety_hazard", label: "Safety Hazard" },
];

const DEFAULT_MISSED_REASON_CODE: MissedReasonCode = "road_blocked";

interface SkipStopDraft {
  missedReasonCode: MissedReasonCode;
  missedNote: string;
}

const createDefaultSkipStopDraft = (): SkipStopDraft => ({
  missedReasonCode: DEFAULT_MISSED_REASON_CODE,
  missedNote: "",
});

interface DriverRoutePanelProps {
  displayRoute: RouteData;
  binStatusUpdate: BinStatusUpdate | null;
  isConfirmingComplete: boolean;
  isCompletingRoute: boolean;
  onSetConfirmingComplete: (value: boolean) => void;
  onUpdateBinStatus: (
    binId: string,
    status: DriverBinStatus,
    options?: {
      missedReasonCode?: MissedReasonCode;
      missedNote?: string;
    }
  ) => void;
  onCompleteRoute: () => void;
}

export default function DriverRoutePanel({
  displayRoute,
  binStatusUpdate,
  isConfirmingComplete,
  isCompletingRoute,
  onSetConfirmingComplete,
  onUpdateBinStatus,
  onCompleteRoute,
}: DriverRoutePanelProps) {
  const [activeSkipStopBinId, setActiveSkipStopBinId] = useState<string | null>(null);
  const [skipStopDrafts, setSkipStopDrafts] = useState<Record<string, SkipStopDraft>>({});
  const [isSkipReasonMenuOpen, setIsSkipReasonMenuOpen] = useState(false);
  const skipReasonMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!skipReasonMenuRef.current) return;
      if (skipReasonMenuRef.current.contains(event.target as Node)) return;
      setIsSkipReasonMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleOpenSkipStopForm = (binId: string) => {
    setActiveSkipStopBinId((currentValue) => (currentValue === binId ? null : binId));
    setIsSkipReasonMenuOpen(false);

    setSkipStopDrafts((previousDrafts) => {
      if (previousDrafts[binId]) {
        return previousDrafts;
      }

      return {
        ...previousDrafts,
        [binId]: createDefaultSkipStopDraft(),
      };
    });
  };

  const handleSkipStopReasonChange = (binId: string, missedReasonCode: MissedReasonCode) => {
    setSkipStopDrafts((previousDrafts) => ({
      ...previousDrafts,
      [binId]: {
        ...(previousDrafts[binId] ?? createDefaultSkipStopDraft()),
        missedReasonCode,
      },
    }));

    setIsSkipReasonMenuOpen(false);
  };

  const handleSkipStopNoteChange = (binId: string, missedNote: string) => {
    setSkipStopDrafts((previousDrafts) => ({
      ...previousDrafts,
      [binId]: {
        ...(previousDrafts[binId] ?? createDefaultSkipStopDraft()),
        missedNote,
      },
    }));
  };

  const handleSubmitSkipStop = (binId: string) => {
    const draft = skipStopDrafts[binId] ?? createDefaultSkipStopDraft();
    const trimmedNote = draft.missedNote.trim();

    onUpdateBinStatus(binId, "missed", {
      missedReasonCode: draft.missedReasonCode,
      missedNote: trimmedNote.length > 0 ? trimmedNote : undefined,
    });

    setActiveSkipStopBinId(null);
    setIsSkipReasonMenuOpen(false);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e4ece6] bg-[#fcfffd]">
      <h3 className="px-4 pt-4 text-lg font-extrabold text-[#1f412f]">
        Today Route (ID: {displayRoute.routeId ? `${displayRoute.routeId.substring(0, 8)}...` : "None"})
      </h3>

      {displayRoute.bins?.length > 0 ? (
        <>
          <ul className="mb-4 divide-y divide-[#edf3ee] border-y border-[#edf3ee]">
            {displayRoute.bins.map((bin) => {
              const skipStopDraft = skipStopDrafts[bin.binId] ?? createDefaultSkipStopDraft();
              const isSkipStopFormOpen = activeSkipStopBinId === bin.binId;
              const selectedSkipReasonLabel =
                MISSED_REASON_OPTIONS.find((option) => option.value === skipStopDraft.missedReasonCode)?.label ??
                MISSED_REASON_OPTIONS[0]?.label ??
                "Select reason";

              return (
                <li key={bin.binId} className="flex flex-col px-4 py-4 odd:bg-[#fcfffd] even:bg-[#f6fbf8]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-[#244734]">
                    Stop {bin.sequence}: Bin #{bin.binId.substring(0, 5)} ({bin.zone})
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-extrabold uppercase ${
                      bin.status === "collected"
                        ? "bg-green-100 text-green-700"
                        : bin.status === "overflowing"
                          ? "bg-red-100 text-red-700"
                          : bin.status === "missed"
                            ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {bin.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    onClick={() => onUpdateBinStatus(bin.binId, "collected")}
                    disabled={Boolean(binStatusUpdate)}
                    className="rounded-md border border-[#cfdacb] bg-[#eef5ea] px-3 py-2 text-sm font-bold text-[#17311f] transition hover:border-[#1a7b3a] hover:bg-[#dff0d8] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {binStatusUpdate?.binId === bin.binId && binStatusUpdate.status === "collected"
                      ? "Updating..."
                      : "Collected"}
                  </button>
                  <button
                    onClick={() => onUpdateBinStatus(bin.binId, "overflowing")}
                    disabled={Boolean(binStatusUpdate)}
                    className="rounded-md border border-[#e8c4c4] bg-[#fff5f5] px-3 py-2 text-sm font-bold text-[#7d2222] transition hover:bg-[#ffe8e8] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {binStatusUpdate?.binId === bin.binId && binStatusUpdate.status === "overflowing"
                      ? "Updating..."
                      : "Overflowing"}
                  </button>
                  <button
                    onClick={() => handleOpenSkipStopForm(bin.binId)}
                    disabled={Boolean(binStatusUpdate)}
                    className="rounded-md border border-[#f0d3a5] bg-[#fff7ea] px-3 py-2 text-sm font-bold text-[#8a5721] transition hover:bg-[#ffefcf] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {binStatusUpdate?.binId === bin.binId && binStatusUpdate.status === "missed"
                      ? "Updating..."
                      : isSkipStopFormOpen
                        ? "Close Skip Form"
                        : "Skip Stop"}
                  </button>
                </div>

                {isSkipStopFormOpen && (
                  <div className="mt-3 rounded-lg border border-[#ead5b4] bg-[#fff8ec] p-3">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-[#7a5220]">
                      Skip Reason
                    </label>
                    <div ref={skipReasonMenuRef} className="relative">
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={isSkipReasonMenuOpen}
                        onClick={() => setIsSkipReasonMenuOpen((open) => !open)}
                        disabled={Boolean(binStatusUpdate)}
                        className={`dropdown-clean ${isSkipReasonMenuOpen ? "dropdown-clean-open" : ""} disabled:cursor-not-allowed disabled:opacity-70`}
                      >
                        <span className="text-[#4f3a1e]">{selectedSkipReasonLabel}</span>
                        <ChevronIcon open={isSkipReasonMenuOpen} />
                      </button>

                      {isSkipReasonMenuOpen && (
                        <div
                          role="listbox"
                          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-[#bfd5c5] bg-[#f7fcf8] shadow-lg"
                        >
                          {MISSED_REASON_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              role="option"
                              aria-selected={skipStopDraft.missedReasonCode === option.value}
                              className={`dropdown-option ${skipStopDraft.missedReasonCode === option.value ? "dropdown-option-selected" : ""}`}
                              onClick={() => handleSkipStopReasonChange(bin.binId, option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <label className="mb-1 mt-3 block text-xs font-bold uppercase tracking-widest text-[#7a5220]">
                      Optional Note
                    </label>
                    <textarea
                      value={skipStopDraft.missedNote}
                      onChange={(event) => handleSkipStopNoteChange(bin.binId, event.target.value)}
                      placeholder="Add context for dispatch (optional)"
                      rows={2}
                      maxLength={255}
                      disabled={Boolean(binStatusUpdate)}
                      className="w-full resize-y rounded-md border border-[#d9c4a5] bg-white px-3 py-2 text-sm text-[#4f3a1e] focus:border-[#b9874d] focus:outline-none"
                    />

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSkipStopBinId(null);
                          setIsSkipReasonMenuOpen(false);
                        }}
                        disabled={Boolean(binStatusUpdate)}
                        className="w-1/2 rounded-md border border-[#d9c4a5] bg-[#fffdfa] px-3 py-2 text-sm font-semibold text-[#6b4c22] transition hover:bg-[#fff2de] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmitSkipStop(bin.binId)}
                        disabled={Boolean(binStatusUpdate)}
                        className="w-1/2 rounded-md border border-[#e3b372] bg-[#f5c889] px-3 py-2 text-sm font-extrabold text-[#5c3e14] transition hover:bg-[#f8d39f] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Confirm Skip Stop
                      </button>
                    </div>
                  </div>
                )}
                </li>
              );
            })}
          </ul>

          {!isConfirmingComplete ? (
            <button
              onClick={() => onSetConfirmingComplete(true)}
              className="btn-primary mx-4 mb-4 mt-2 w-[calc(100%-2rem)]"
            >
              Finish Day Route
            </button>
          ) : (
            <div className="mx-4 mb-4 mt-2 rounded-xl border border-[#f1d8b1] bg-[#fff7e9] p-4">
              <p className="text-sm font-bold text-[#5a4213]">Confirm route completion?</p>
              <p className="mt-1 text-sm text-[#6d5730]">
                This will mark today&apos;s route as complete for dispatch records.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onSetConfirmingComplete(false)}
                  disabled={isCompletingRoute}
                  className="w-1/2 rounded-md border border-[#d4c2a0] bg-[#fffdfa] px-3 py-2 text-sm font-semibold text-[#5e4a23] transition hover:bg-[#fff4df] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onCompleteRoute}
                  disabled={isCompletingRoute}
                  className="w-1/2 rounded-md border border-[#e5b567] bg-[#f2c06f] px-3 py-2 text-sm font-extrabold text-[#4f3810] transition hover:bg-[#f5cb86] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCompletingRoute ? "Completing..." : "Yes, Complete Route"}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="mb-4 rounded-md border border-[#c8e6ce] bg-[#eefaf0] p-3 font-bold text-[#2c6f39]">
          No bins assigned today. Enjoy the day off!
        </p>
      )}
    </div>
  );
}
