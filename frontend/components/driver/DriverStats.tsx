'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { apiFetch } from '@/lib/apiFetch'; 
import DataLoadingState from "@/components/ui/DataLoadingState";

interface DriverStatsData {
  totalRoutesCompleted: number;
  binHealth: {
    collected: number;
    overflowing: number;
    missed: number;
    total: number;
    overflowRatio: number;
  };
  weeklyVelocity: Array<{ date: string; count: number }>;
}

interface WeekChartPoint {
  isoDate: string;
  axisLabel: string;
  count: number;
}

type TooltipValue = number | string | ReadonlyArray<number | string> | undefined;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MAX_WEEK_PAGES = 8;

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  timeZone: 'UTC',
});

const fetchDriverStats = async (url: string): Promise<DriverStatsData> => {
  // API call: fetch driver stats payload.
  const res = await apiFetch(url);

  if (!res.ok) {
    throw new Error('Failed to fetch driver stats');
  }

  return res.json() as Promise<DriverStatsData>;
};

const toTooltipValue = (value: TooltipValue) => {
  const parsedValue = Array.isArray(value) ? value[0] : value;
  return Number(parsedValue ?? 0);
};

const parseIsoDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
};

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const addUtcDays = (date: Date, days: number) => {
  return new Date(date.getTime() + (days * DAY_IN_MS));
};

const formatDateLabel = (isoDate: string) => {
  const parsedDate = parseIsoDate(isoDate);
  if (!parsedDate) {
    return isoDate;
  }

  return dayFormatter.format(parsedDate);
};

const buildWeekSeries = (
  velocityByDate: Map<string, number>,
  weekOffset: number,
  todayUtc: Date
) => {
  const weekEnd = addUtcDays(todayUtc, -(weekOffset * 7));
  const weekStart = addUtcDays(weekEnd, -6);

  const points: WeekChartPoint[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const day = addUtcDays(weekStart, dayIndex);
    const isoDate = toIsoDate(day);

    points.push({
      isoDate,
      axisLabel: dayFormatter.format(day),
      count: velocityByDate.get(isoDate) ?? 0,
    });
  }

  return {
    weekStartIso: toIsoDate(weekStart),
    weekEndIso: toIsoDate(weekEnd),
    points,
  };
};

export default function DriverStats({ driverId }: { driverId: string }) {
  // SWR key scoped to this driver's stats endpoint.
  const statsKey = driverId ? `/api/users/drivers/${driverId}/stats` : null;
  // Important UI state: selected week page offset for velocity navigation.
  const [weekOffset, setWeekOffset] = useState(0);

  // useMemo: lock current UTC day to keep week math stable across renders.
  const todayUtc = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }, []);

  // SWR uses global cache so stats persist across route switches.
  const { data, error, isLoading } = useSWR<DriverStatsData>(
    statsKey,
    fetchDriverStats
  );

  // useMemo: normalize API velocity rows into a date->count lookup map.
  const velocityByDate = useMemo(() => {
    const velocityMap = new Map<string, number>();

    data?.weeklyVelocity.forEach((day) => {
      velocityMap.set(day.date, Number(day.count));
    });

    return velocityMap;
  }, [data]);

  // useMemo: calculate the maximum historical week page available in cache.
  const maxWeekOffset = useMemo(() => {
    if (!data || data.weeklyVelocity.length === 0) {
      return 0;
    }

    const earliestTimestamp = data.weeklyVelocity.reduce<number | null>((earliest, day) => {
      const parsedDate = parseIsoDate(day.date);
      if (!parsedDate) {
        return earliest;
      }

      const timestamp = parsedDate.getTime();
      if (earliest === null || timestamp < earliest) {
        return timestamp;
      }

      return earliest;
    }, null);

    if (earliestTimestamp === null) {
      return 0;
    }

    const differenceInDays = Math.max(
      0,
      Math.floor((todayUtc.getTime() - earliestTimestamp) / DAY_IN_MS)
    );

    return Math.min(MAX_WEEK_PAGES - 1, Math.floor(differenceInDays / 7));
  }, [data, todayUtc]);

  const safeWeekOffset = Math.min(weekOffset, maxWeekOffset);

  // useMemo: build a fixed 7-day series for the selected week page.
  const weekSeries = useMemo(
    () => buildWeekSeries(velocityByDate, safeWeekOffset, todayUtc),
    [velocityByDate, safeWeekOffset, todayUtc]
  );

  // useMemo: derive total bins collected within the selected week.
  const weekTotalCollected = useMemo(
    () => weekSeries.points.reduce((total, point) => total + point.count, 0),
    [weekSeries.points]
  );

  if (isLoading) {
    return (
      <DataLoadingState
        title="Loading your statistics"
        subtitle="Building your latest route, bin health, and velocity insights."
        className="h-64"
      />
    );
  }

  if (error || !data) {
    return (
      <div className="soft-surface rounded-xl border-[#f1caca] bg-[#fff4f3] p-4 text-sm font-semibold text-[#8d2e2b]">
        Failed to load statistics. Please try again later.
      </div>
    );
  }

  const collectedWithoutOverflow = Math.max(0, data.binHealth.collected - data.binHealth.overflowing);
  const pieData = [
    { name: 'Collected (No Overflow)', value: collectedWithoutOverflow },
    { name: 'Collected (Overflow Observed)', value: data.binHealth.overflowing },
    { name: 'Skipped (Missed)', value: data.binHealth.missed },
  ];
  
  const COLORS = ['#197443', '#c5483e', '#d0832f'];
  const hasOlderWeeks = safeWeekOffset < maxWeekOffset;
  const hasNewerWeek = safeWeekOffset > 0;

  const overflowRatio = data.binHealth.overflowRatio;
  const overflowStatus = overflowRatio >= 40 ? 'High' : overflowRatio >= 20 ? 'Moderate' : 'Low';
  const overflowBadgeClassName = overflowRatio >= 40
    ? 'border-[#f2c0bc] bg-[#fff1f0] text-[#922f28]'
    : overflowRatio >= 20
      ? 'border-[#ead4ad] bg-[#fff8eb] text-[#8b6318]'
      : 'border-[#b9ddc5] bg-[#edf8f1] text-[#1d6a3d]';
  const overflowBarClassName = overflowRatio >= 40
    ? 'bg-[#cf4a40]'
    : overflowRatio >= 20
      ? 'bg-[#e0ab45]'
      : 'bg-[#197443]';

  return (
    <div className="space-y-6 pb-8">
      {overflowRatio < 15 && data.totalRoutesCompleted > 0 && (
        <div className="rounded-2xl border border-[#b7d9c2] bg-linear-to-r from-[#1b6f3f] to-[#2f8f59] p-4 text-[#f4fff8] shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h3 className="font-bold">Top Tier Efficiency!</h3>
              <p className="text-sm text-[#dcf3e5]">Your overflow ratio is low this week. Great job keeping the city clean.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="soft-surface rounded-xl p-4 text-center">
          <span className="text-sm font-semibold text-[#597064]">Routes Completed</span>
          <span className="mt-1 block text-3xl font-black text-[#1f412f]">{data.totalRoutesCompleted}</span>
          <span className="mt-1 text-xs text-[#7d9187]">Lifetime</span>
        </div>
        
        <div className="soft-surface rounded-xl p-4 text-center">
          <span className="text-sm font-semibold text-[#597064]">Stops Addressed</span>
          <span className="mt-1 block text-3xl font-black text-[#197443]">{data.binHealth.total}</span>
          <span className="mt-1 text-xs text-[#7d9187]">Lifetime</span>
        </div>

        <div className="soft-surface rounded-xl p-4 sm:col-span-1">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold text-[#597064]">Overflow Ratio</div>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${overflowBadgeClassName}`}>
              {overflowStatus}
            </span>
          </div>
          <div className="mt-2 text-3xl font-black text-[#1f412f]">{overflowRatio}%</div>
          <p className="mt-1 text-xs text-[#7d9187]">
            {data.binHealth.overflowing} overflow observations over {data.binHealth.collected} collected stops
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-[#e7efe9]">
            <div
              className={`h-2 rounded-full transition-all ${overflowBarClassName}`}
              style={{ width: `${Math.max(0, Math.min(overflowRatio, 100))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="soft-surface rounded-xl p-4 sm:p-5">
        <h3 className="font-extrabold text-[#1f412f]">Route Health (Addressed Outcomes)</h3>
        <div className="mt-4 grid gap-5 lg:grid-cols-[240px_1fr] lg:items-center">
          <div className="mx-auto h-44 w-full max-w-[240px] min-w-0">
            <ResponsiveContainer width="100%" height={176} minWidth={0}>
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${toTooltipValue(value)} Bins`, '']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #dce9e1', boxShadow: '0 8px 18px rgba(27, 56, 39, 0.12)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border-t-4 border-[#197443] pt-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#607267]">No Overflow</p>
              <p className="mt-1 text-2xl font-extrabold text-[#1f412f]">{collectedWithoutOverflow}</p>
            </div>
            <div className="border-t-4 border-[#c5483e] pt-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8e4d48]">Overflow</p>
              <p className="mt-1 text-2xl font-extrabold text-[#8b2d28]">{data.binHealth.overflowing}</p>
            </div>
            <div className="border-t-4 border-[#d0832f] pt-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5b24]">Skipped</p>
              <p className="mt-1 text-2xl font-extrabold text-[#8a5b24]">{data.binHealth.missed}</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-[#607267]">
          Overflow ratio is <span className="font-extrabold text-[#1f412f]">{overflowRatio}%</span> of collected stops.
        </p>
      </div>

      <div className="soft-surface rounded-xl p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-extrabold text-[#1f412f]">Weekly Velocity Trend</h3>
            <p className="mt-1 text-sm text-[#607267]">
              {formatDateLabel(weekSeries.weekStartIso)} - {formatDateLabel(weekSeries.weekEndIso)}
              {' '}· {weekTotalCollected} bins collected
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekOffset((currentOffset) => Math.max(currentOffset - 1, 0))}
              disabled={!hasNewerWeek}
              className="rounded-md border border-[#cad8d0] bg-[#f9fdf9] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#244734] transition hover:bg-[#edf6ef] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Newer
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((currentOffset) => Math.min(currentOffset + 1, maxWeekOffset))}
              disabled={!hasOlderWeeks}
              className="rounded-md border border-[#cad8d0] bg-[#f9fdf9] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#244734] transition hover:bg-[#edf6ef] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
          </div>
        </div>

        <div className="h-60 w-full min-w-0 rounded-xl border border-[#e2ece5] bg-[#f8fcf9] p-3">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart
              data={weekSeries.points}
              margin={{ top: 10, right: 12, left: -16, bottom: 4 }}
            >
              <CartesianGrid stroke="#dce9e1" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="axisLabel"
                tick={{ fontSize: 12, fill: '#617569' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                width={30}
                tick={{ fontSize: 12, fill: '#617569' }}
              />
              <Tooltip
                formatter={(value) => [`${toTooltipValue(value)} Bins`, 'Collected']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #dce9e1', boxShadow: '0 8px 18px rgba(27, 56, 39, 0.12)' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#197443"
                strokeWidth={3}
                dot={{ r: 4, fill: '#197443', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#197443', stroke: '#d5eadb', strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {weekTotalCollected === 0 && (
          <p className="mt-3 text-sm text-[#607267]">
            No collected bins were recorded in this week.
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#607267]">
          {weekSeries.points.map((point) => (
            <div key={point.isoDate} className="rounded-full border border-[#dbe8e0] bg-[#f5faf7] px-3 py-1">
              {weekdayFormatter.format(parseIsoDate(point.isoDate) ?? todayUtc)}: {point.count}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
