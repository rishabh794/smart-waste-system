"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import MapFitBounds from "@/components/admin/reports/MapFitBounds";
import {
  formatReportCategory,
  STATUS_MARKER_COLORS,
  STATUS_STYLES,
} from "@/lib/reportDisplay";
import type { AdminReport } from "@/types/CitizenTypes";

const DEFAULT_CENTER: [number, number] = [30.316, 78.032];

const getReportMarkerIcon = (status: AdminReport["status"], isHighlighted: boolean) => {
  const colorClass = STATUS_MARKER_COLORS[status];
  const sizeClass = isHighlighted ? "h-8 w-8 ring-4 ring-[#1a7b3a]/40" : "h-6 w-6";

  return L.divIcon({
    className: "custom-leaflet-icon",
    html: `<div class="${sizeClass} rounded-full border-2 border-white shadow-lg ${colorClass}"></div>`,
    iconSize: isHighlighted ? [32, 32] : [24, 24],
    iconAnchor: isHighlighted ? [16, 16] : [12, 12],
  });
};

interface ReportBoardMapProps {
  reports: AdminReport[];
  selectedReportId?: string | null;
  onReportSelect: (reportId: string) => void;
}

export default function ReportBoardMap({
  reports,
  selectedReportId = null,
  onReportSelect,
}: ReportBoardMapProps) {
  const positions = reports.map((report) => [report.latitude, report.longitude] as [number, number]);
  const center = positions[0] ?? DEFAULT_CENTER;
  const legendStatuses = ["submitted", "in_review", "resolved"] as const;

  return (
    <section className="soft-surface rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-eyebrow">Geographic Overview</p>
          <h2 className="mt-1 text-lg font-extrabold text-[#1b2a22]">Active Report Locations</h2>
          <p className="mt-1 text-xs text-[#607267]">Click a marker to open report details.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {legendStatuses.map((status) => (
            <span
              key={status}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${STATUS_STYLES[status].className}`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${STATUS_MARKER_COLORS[status]}`}
                aria-hidden="true"
              />
              {STATUS_STYLES[status].label}
            </span>
          ))}
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[#cddbd2] bg-[#f8fcf9] text-sm italic text-[#5c7165]">
          No active reports to display on the map.
        </div>
      ) : (
        <div className="relative z-0 h-72 w-full overflow-hidden rounded-xl border border-[#dce7df] bg-[#f7fcf8] sm:h-80">
          <MapContainer center={center} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapFitBounds positions={positions} />
            <MarkerClusterGroup chunkedLoading>
              {reports.map((report) => {
                const isHighlighted = selectedReportId === report.id;

                return (
                  <Marker
                    key={report.id}
                    position={[report.latitude, report.longitude]}
                    icon={getReportMarkerIcon(report.status, isHighlighted)}
                    eventHandlers={{
                      click: () => onReportSelect(report.id),
                    }}
                  >
                    <Popup>
                      <div className="min-w-40 text-black">
                        <strong>{report.title}</strong>
                        <div className="my-1 border-t border-gray-300" />
                        <div>
                          <strong>Category:</strong> {formatReportCategory(report.category)}
                        </div>
                        <div>
                          <strong>Status:</strong> {STATUS_STYLES[report.status].label}
                        </div>
                        <div>
                          <strong>Reporter:</strong> {report.reportedBy}
                        </div>
                        <button
                          type="button"
                          className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[#1a7b3a]"
                          onClick={() => onReportSelect(report.id)}
                        >
                          View details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          </MapContainer>
        </div>
      )}
    </section>
  );
}
