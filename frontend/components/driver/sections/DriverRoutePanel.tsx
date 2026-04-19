"use client";

import type { BinStatusUpdate, RouteData } from "@/types/DriverTypes";

interface DriverRoutePanelProps {
  displayRoute: RouteData;
  binStatusUpdate: BinStatusUpdate | null;
  isConfirmingComplete: boolean;
  isCompletingRoute: boolean;
  onSetConfirmingComplete: (value: boolean) => void;
  onUpdateBinStatus: (binId: string, status: string) => void;
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
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e4ece6] bg-[#fcfffd]">
      <h3 className="px-4 pt-4 text-lg font-extrabold text-[#1f412f]">
        Today Route (ID: {displayRoute.routeId ? `${displayRoute.routeId.substring(0, 8)}...` : "None"})
      </h3>

      {displayRoute.bins?.length > 0 ? (
        <>
          <ul className="mb-4 divide-y divide-[#edf3ee] border-y border-[#edf3ee]">
            {displayRoute.bins.map((bin) => (
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
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {bin.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateBinStatus(bin.binId, "collected")}
                    disabled={Boolean(binStatusUpdate)}
                    className="w-1/2 rounded-md border border-[#cfdacb] bg-[#eef5ea] px-3 py-2 text-sm font-bold text-[#17311f] transition hover:border-[#1a7b3a] hover:bg-[#dff0d8] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {binStatusUpdate?.binId === bin.binId && binStatusUpdate.status === "collected"
                      ? "Updating..."
                      : "Collected"}
                  </button>
                  <button
                    onClick={() => onUpdateBinStatus(bin.binId, "overflowing")}
                    disabled={Boolean(binStatusUpdate)}
                    className="w-1/2 rounded-md border border-[#e8c4c4] bg-[#fff5f5] px-3 py-2 text-sm font-bold text-[#7d2222] transition hover:bg-[#ffe8e8] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {binStatusUpdate?.binId === bin.binId && binStatusUpdate.status === "overflowing"
                      ? "Updating..."
                      : "Overflowing"}
                  </button>
                </div>
              </li>
            ))}
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
