"use client";

import AppSidebar from "@/components/AppSidebar";
import { useEffect, useMemo, useState } from "react";

type DashboardTypeStat = {
  normative_type: string;
  label: string;
  count: number;
  this_month_count: number;
  total_amount: string;
};

type DashboardTrendPoint = {
  key: string;
  label: string;
  count: number;
};

type LatestCalculation = {
  id: number;
  name: string;
  normative_type: string;
  document_category: string;
  final_total_amount: string;
  created_at: string;
};

type DashboardStatsResponse = {
  totals: {
    total_documents: number;
    total_amount: string;
  };
  types: DashboardTypeStat[];
  trend_last_6_months: DashboardTrendPoint[];
  latest_calculations: LatestCalculation[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.20.104:8000/api";

const formatMoney = (value: string | number): string =>
  new Intl.NumberFormat("uz-UZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const typeTitleMap: Record<string, string> = {
  technical_regulation: "Texnik reglament",
  shnq: "SHNQ",
  eurocode: "Eurocode",
  standard_srn_qr_mqn: "Standart/SRN/QR/MQN",
  methodical_guide: "Metodika",
};

const categoryLabelMap: Record<string, string> = {
  new: "Yangi",
  rework_harmonization: "Qayta ishlash: uyg'unlashtirish",
  rework_modification: "Qayta ishlash: muvofiqlashtirish",
  additional_change: "Qo'shimcha o'zgartirish",
};

const colorByType: Record<string, string> = {
  shnq: "#1f2b8f",
  technical_regulation: "#4f46d6",
  eurocode: "#15a8c8",
  standard_srn_qr_mqn: "#0f766e",
  methodical_guide: "#ca8a04",
};

const getTrendPaths = (points: DashboardTrendPoint[]) => {
  const chartWidth = 940;
  const chartBottom = 230;
  const chartTop = 80;

  if (!points.length) {
    return {
      linePath: "M30 230 L970 230",
      areaPath: "M30 230 L970 230 L970 280 L30 280 Z",
    };
  }

  const maxCount = Math.max(...points.map((point) => point.count), 1);
  const coords = points.map((point, index) => {
    const x = 30 + (chartWidth / Math.max(points.length - 1, 1)) * index;
    const y = chartBottom - ((chartBottom - chartTop) * point.count) / maxCount;
    return { x, y };
  });

  const linePath = coords.map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x} ${coord.y}`).join(" ");
  const areaPath = `${linePath} L970 280 L30 280 Z`;

  return { linePath, areaPath };
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard-stats/`);
        if (!response.ok) {
          throw new Error("Dashboard statistikalarini yuklashda xatolik yuz berdi.");
        }
        const payload = (await response.json()) as DashboardStatsResponse;
        setStats(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Xatolik yuz berdi.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadStats();
  }, []);

  const typeMap = useMemo(() => new Map((stats?.types ?? []).map((item) => [item.normative_type, item])), [stats]);

  const cardTypes = ["technical_regulation", "shnq", "eurocode"].map((key) => {
    const item = typeMap.get(key);
    return {
      key,
      title: typeTitleMap[key] ?? key,
      count: item?.count ?? 0,
      month: item?.this_month_count ?? 0,
      amount: item?.total_amount ?? "0",
    };
  });

  const typeStats = useMemo(() => stats?.types ?? [], [stats]);
  const totalTypeCount = typeStats.reduce((sum, item) => sum + item.count, 0);
  const donutBackground = useMemo(() => {
    if (!totalTypeCount) {
      return "#e2e8f0";
    }
    let start = 0;
    const segments = typeStats.map((item) => {
      const deg = (item.count / totalTypeCount) * 360;
      const color = colorByType[item.normative_type] ?? "#64748b";
      const segment = `${color} ${start}deg ${start + deg}deg`;
      start += deg;
      return segment;
    });
    return `conic-gradient(${segments.join(",")})`;
  }, [typeStats, totalTypeCount]);

  const trend = stats?.trend_last_6_months ?? [];
  const trendPaths = getTrendPaths(trend);

    return (
      <div className="flex h-screen overflow-hidden bg-background-light text-slate-900">
      <AppSidebar active="dashboard" />

      <main className="flex flex-1 flex-col overflow-hidden bg-background-light">
        <header className="z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div className="flex flex-1 items-center gap-4">
            <div className="group relative w-full max-w-md">
              <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                className="w-full rounded-lg border-none bg-slate-100 py-2 pr-4 pl-10 text-sm transition-all focus:ring-2 focus:ring-primary/20"
                placeholder="Tizim bo'ylab qidirish..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
            </button>
            <button className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
            <div className="mx-2 h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                SA
              </div>
              <span className="text-sm font-medium text-slate-700">Tizim admini</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">Asosiy panel</h1>
            <p className="text-base text-slate-500">
              Tizim bo&apos;yicha umumiy ko&apos;rsatkichlar va oxirgi holat.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {cardTypes.map((card, idx) => (
              <div
                key={card.key}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className={`flex size-12 items-center justify-center rounded-lg ${
                      idx === 0
                        ? "bg-blue-100 text-blue-600"
                        : idx === 1
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-cyan-100 text-cyan-600"
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {idx === 0 ? "description" : idx === 1 ? "article" : "language"}
                    </span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    +{card.month} shu oy
                  </span>
                </div>
                <h3 className="mb-1 text-sm font-medium text-slate-600">{card.title}</h3>
                <p className="mb-2 text-2xl font-bold">
                  {isLoading ? "..." : card.count} <span className="text-sm font-normal text-slate-400">ta hujjat</span>
                </p>
                <div className="border-t border-slate-100 pt-4">
                  <p className="mb-1 text-xs text-slate-500">Umumiy qiymat</p>
                  <p className="text-sm font-semibold text-primary">{formatMoney(card.amount)} so&apos;m</p>
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-primary bg-primary p-6 text-white shadow-lg transition-shadow hover:shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-lg bg-white/20 text-white">
                  <span className="material-symbols-outlined text-2xl">bar_chart_4_bars</span>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-medium text-white/80">
                  Tizim faol
                </span>
              </div>
              <h3 className="mb-1 text-sm font-medium text-white/80">Umumiy hisobot</h3>
              <p className="mb-2 text-xl font-bold">{new Date().getFullYear()}-yil yakuniy hisobot</p>
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span>Jami ko&apos;rib chiqilgan:</span>
                  <span className="font-bold">{stats?.totals.total_documents ?? 0} ta</span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full bg-white"
                    style={{
                      width: `${Math.min(
                        100,
                        ((stats?.totals.total_documents ?? 0) / Math.max((stats?.totals.total_documents ?? 1), 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-3xl font-bold tracking-tight text-slate-900">Hujjatlar dinamikasi</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>Oxirgi 6 oy</span>
                  <span className="material-symbols-outlined text-base">info</span>
                </div>
              </div>

              <div className="relative h-72 overflow-hidden rounded-lg bg-slate-50/40">
                <svg
                  aria-label="Hujjatlar dinamikasi"
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 1000 280"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1f2b8f" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#1f2b8f" stopOpacity="0.04" />
                    </linearGradient>
                  </defs>
                  <path d={trendPaths.areaPath} fill="url(#areaFill)" />
                  <path d={trendPaths.linePath} fill="none" stroke="#1f2b8f" strokeWidth="6" strokeLinecap="round" />
                </svg>

                <div className="absolute right-0 bottom-0 left-0 flex items-end justify-between px-6 pb-4 text-sm text-slate-400">
                  {(trend.length ? trend : [{ label: "-" }]).map((point, idx) => (
                    <span key={`${point.label}-${idx}`}>{point.label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="mb-6 text-3xl font-bold tracking-tight text-slate-900">
                Hujjat turlari bo&apos;yicha taqsimot
              </h3>

              <div className="mb-8 flex justify-center">
                <div
                  className="relative flex h-40 w-40 items-center justify-center rounded-full"
                  style={{ background: donutBackground }}
                >
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-5xl font-extrabold text-slate-900">{stats?.totals.total_documents ?? 0}</span>
                    <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Jami</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {typeStats.map((item) => (
                  <div key={item.normative_type} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-lg text-slate-800">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: colorByType[item.normative_type] ?? "#64748b" }}
                      />
                      {typeTitleMap[item.normative_type] ?? item.label}
                    </span>
                    <span className="text-lg font-semibold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900">So&apos;nggi hisob-kitoblar</h3>
              <button className="text-sm font-semibold text-primary hover:underline">Barchasini ko&apos;rish</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-sm text-slate-500">
                    <th className="px-6 py-4 font-semibold">Hujjat nomi</th>
                    <th className="px-6 py-4 font-semibold">Turi</th>
                    <th className="px-6 py-4 font-semibold">Sana</th>
                    <th className="px-6 py-4 text-right font-semibold">Hisoblangan narxi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {!isLoading && stats?.latest_calculations.length === 0 && (
                    <tr>
                      <td className="px-6 py-5 text-base text-slate-500" colSpan={4}>
                        Hozircha ma&apos;lumot yo&apos;q.
                      </td>
                    </tr>
                  )}
                  {(stats?.latest_calculations ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-5 text-base font-medium text-slate-900">{item.name}</td>
                      <td className="px-6 py-5 text-base text-slate-600">
                        {typeTitleMap[item.normative_type] ?? item.normative_type}
                        <div className="text-xs text-slate-400">{categoryLabelMap[item.document_category] ?? "-"}</div>
                      </td>
                      <td className="px-6 py-5 text-base text-slate-600">
                        {new Date(item.created_at).toLocaleDateString("uz-UZ")}
                      </td>
                      <td className="px-6 py-5 text-right text-base font-bold text-primary">
                        {formatMoney(item.final_total_amount)} so&apos;m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
