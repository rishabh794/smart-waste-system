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

const getPendingActionLabel = (isOnline: boolean) =>
  isOnline ? "Updating..." : "Saving offline...";

const isMatchingBinUpdate = (
  update: BinStatusUpdate | null,
  binId: string,
  match: (update: BinStatusUpdate) => boolean
) => Boolean(update && update.binId === binId && match(update));

interface DriverRoutePanelProps {
  displayRoute: RouteData;
  binStatusUpdate: BinStatusUpdate | null;
  isConfirmingComplete: boolean;
  isCompletingRoute: boolean;
  isOnline: boolean;
  onSetConfirmingComplete: (value: boolean) => void;
  onUpdateBinStatus: (
    binId: string,
    status: DriverBinStatus,
    options?: {
      wasOverflowing?: boolean;
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
  isOnline,
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
    <div className="soft-surface overflow-hidden rounded-2xl">
      <div className="border-b border-[#e6efe9] px-4 py-4 sm:px-5">
        <h3 className="text-base font-extrabold text-[#1f412f] sm:text-lg">
          Today&apos;s Route
        </h3>
        <p className="mt-1 text-xs text-[#607267] sm:text-sm">
          ID: {displayRoute.routeId ? `${displayRoute.routeId.substring(0, 8)}...` : "None"}
          {" · "}
          {displayRoute.bins?.length ?? 0} stops
        </p>
      </div>

      {displayRoute.bins?.length > 0 ? (
        <>
          <ul className="divide-y divide-[#edf3ee]">
            {displayRoute.bins.map((bin) => {
              const skipStopDraft = skipStopDrafts[bin.binId] ?? createDefaultSkipStopDraft();
              const isSkipStopFormOpen = activeSkipStopBinId === bin.binId;
              const isCollectedWithOverflowObserved = bin.status === "collected" && Boolean(bin.wasOverflowing);
              const stopNumber = bin.optimizedSequence ?? bin.sequence;
              const selectedSkipReasonLabel =
                MISSED_REASON_OPTIONS.find((option) => option.value === skipStopDraft.missedReasonCode)?.label ??
                MISSED_REASON_OPTIONS[0]?.label ??
                "Select reason";

              return (
                <li key={bin.binId} className="px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#244734]">
                        Stop {stopNumber}: Bin #{bin.binId.substring(0, 5)}
                      </p>
                      <p className="text-sm text-[#607267]">{bin.zone}</p>
                    </div>
                    <span
                      className={`self-start rounded-full px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide sm:text-xs ${
                        isCollectedWithOverflowObserved
                          ? "bg-red-100 text-red-700"
                          : bin.status === "collected"
                            ? "bg-green-100 text-green-700"
                            : bin.status === "missed"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isCollectedWithOverflowObserved ? "Overflow observed" : bin.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
                    <button
                      onClick={() => onUpdateBinStatus(bin.binId, "collected", { wasOverflowing: false })}
                      disabled={Boolean(binStatusUpdate)}
                      className="rounded-md border border-[#cfdacb] bg-[#eef5ea] px-3 py-2.5 text-sm font-bold text-[#17311f] transition hover:border-[#1a7b3a] hover:bg-[#dff0d8] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isMatchingBinUpdate(
                        binStatusUpdate,
                        bin.binId,
                        (update) => update.status === "collected" && !update.wasOverflowing
                      )
                        ? getPendingActionLabel(isOnline)
                        : "Collected"}
                    </button>
                    <button
                      onClick={() => onUpdateBinStatus(bin.binId, "collected", { wasOverflowing: true })}
                      disabled={Boolean(binStatusUpdate)}
                      className="rounded-md border border-[#e8c4c4] bg-[#fff5f5] px-3 py-2.5 text-sm font-bold text-[#7d2222] transition hover:bg-[#ffe8e8] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isMatchingBinUpdate(
                        binStatusUpdate,
                        bin.binId,
                        (update) => update.status === "collected" && Boolean(update.wasOverflowing)
                      )
                        ? getPendingActionLabel(isOnline)
                        : "Overflow"}
                    </button>
                    <button
                      onClick={() => handleOpenSkipStopForm(bin.binId)}
                      disabled={Boolean(binStatusUpdate)}
                      className="rounded-md border border-[#f0d3a5] bg-[#fff7ea] px-3 py-2.5 text-sm font-bold text-[#8a5721] transition hover:bg-[#ffefcf] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isMatchingBinUpdate(binStatusUpdate, bin.binId, (update) => update.status === "missed")
                        ? getPendingActionLabel(isOnline)
                        : isSkipStopFormOpen
                          ? "Close"
                          : "Skip"}
                    </button>
                  </div>

                  {isSkipStopFormOpen && (
                    <div className="mt-3 space-y-3 border-t border-[#ead5b4] pt-3">
                      <div>
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
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-[#7a5220]">
                          Optional Note
                        </label>
                        <textarea
                          value={skipStopDraft.missedNote}
                          onChange={(event) => handleSkipStopNoteChange(bin.binId, event.target.value)}
                          placeholder="Add context for dispatch (optional)"
                          rows={2}
                          maxLength={255}
                          disabled={Boolean(binStatusUpdate)}
                          className="input-clean min-h-20 resize-y"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSkipStopBinId(null);
                            setIsSkipReasonMenuOpen(false);
                          }}
                          disabled={Boolean(binStatusUpdate)}
                          className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSubmitSkipStop(bin.binId)}
                          disabled={Boolean(binStatusUpdate)}
                          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isMatchingBinUpdate(binStatusUpdate, bin.binId, (update) => update.status === "missed")
                            ? getPendingActionLabel(isOnline)
                            : "Confirm Skip"}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="border-t border-[#e6efe9] p-4 sm:p-5">
            {!isConfirmingComplete ? (
              <button
                onClick={() => onSetConfirmingComplete(true)}
                className="btn-primary w-full"
              >
                Finish Day Route
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-bold text-[#5a4213]">Confirm route completion?</p>
                <p className="text-sm text-[#6d5730]">
                  This will mark today&apos;s route as complete for dispatch records.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => onSetConfirmingComplete(false)}
                    disabled={isCompletingRoute}
                    className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onCompleteRoute}
                    disabled={isCompletingRoute}
                    className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCompletingRoute
                      ? isOnline
                        ? "Completing..."
                        : "Saving offline..."
                      : "Yes, Complete Route"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="p-4 text-sm font-semibold text-[#2c6f39] sm:p-5">
          No bins assigned today. Enjoy the day off!
        </p>
      )}
    </div>
  );
}
