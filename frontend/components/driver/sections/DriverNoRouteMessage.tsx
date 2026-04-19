"use client";

interface DriverNoRouteMessageProps {
  routeError: unknown;
}

export default function DriverNoRouteMessage({ routeError }: DriverNoRouteMessageProps) {
  return (
    <>
      {routeError && (
        <div className="rounded-xl border border-[#f1caca] bg-[#fff4f3] p-4 text-sm font-semibold text-[#8d2e2b]">
          {routeError instanceof Error ? routeError.message : "Unable to refresh route right now."}
        </div>
      )}

      <div className="soft-surface mt-4 p-8 text-center">
        <p className="text-sm font-black tracking-[0.16em] text-[#1a7b3a]">NO ACTIVE ROUTE</p>
        <p className="mt-2 text-lg font-bold text-[#1f412f]">No active routes. Enjoy the day off!</p>
      </div>
    </>
  );
}
