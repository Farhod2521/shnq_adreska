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
  standard: "Standard",
  srn: "SRN",
  qr: "QR",
  mqn: "MQN",
  methodical_guide: "Metodika",
  standard_srn_qr_mqn: "Standart/SRN/QR/MQN",
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
  standard: "#64748b",
  srn: "#7c3aed",
  qr: "#0f766e",
  mqn: "#334155",
  methodical_guide: "#ca8a04",
  standard_srn_qr_mqn: "#0f766e",
};

const dashboardTypeOrder = [
  "technical_regulation",
  "shnq",
  "eurocode",
  "standard",
  "srn",
  "qr",
  "mqn",
  "methodical_guide",
];

type CardAccent = { icon: string; accent: string; dot: string; badge: string };

const cardAccentByType: Record<string, CardAccent> = {
  technical_regulation: {
    icon: "description",
    accent: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 border border-blue-100",
  },
  shnq: {
    icon: "article",
    accent: "bg-indigo-50 text-indigo-700 border-indigo-100",
    dot: "bg-indigo-600",
    badge: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  },
  eurocode: {
    icon: "language",
    accent: "bg-cyan-50 text-cyan-700 border-cyan-100",
    dot: "bg-cyan-500",
    badge: "bg-cyan-50 text-cyan-700 border border-cyan-100",
  },
  standard: {
    icon: "book_2",
    accent: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-500",
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  srn: {
    icon: "rule",
    accent: "bg-violet-50 text-violet-700 border-violet-100",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 border border-violet-100",
  },
  qr: {
    icon: "fact_check",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  },
  mqn: {
    icon: "menu_book",
    accent: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-600",
    badge: "bg-slate-100 text-slate-700 border border-slate-200",
  },
  methodical_guide: {
    icon: "menu_book",
    accent: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border border-amber-100",
  },
};

const getTrendPaths = (points: DashboardTrendPoint[]) => {
  const chartWidth = 940;
  const chartBottom = 230;
  const chartTop = 40;

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

  const cardTypes = dashboardTypeOrder.map((key) => {
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
  const totalAmount = stats?.totals.total_amount ?? "0";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f8] text-slate-900">
      <AppSidebar active="dashboard" />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="z-10 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-8 shadow-sm">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-sm">
              <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-slate-400">
                search
              </span>
              <input
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-sm transition-all placeholder:text-slate-400 focus:border-[#1a227f]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a227f]/15"
                placeholder="Tizim bo'ylab qidirish..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
            </button>
            <div className="mx-1 h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 transition-colors hover:bg-slate-100">
              <div className="flex size-7 items-center justify-center rounded-full bg-[#1a227f] text-[11px] font-bold text-white">
                SA
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-800">Tizim admini</p>
              </div>
              <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-7">
          {/* Page title */}
          <div className="mb-7">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Asosiy panel</h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Tizim bo&apos;yicha umumiy ko&apos;rsatkichlar va oxirgi holat
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
                <span className="text-xs font-semibold text-emerald-700">Tizim faol</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading && !stats ? (
            <div className="animate-pulse space-y-5">
              <div className="grid grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`hero-skel-${idx}`} className="h-28 rounded-2xl bg-slate-200/70" />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={`card-skel-${idx}`} className="h-36 rounded-2xl bg-white" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Hero metrics row */}
              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Total documents */}
                <div className="relative overflow-hidden rounded-2xl bg-[#1a227f] p-5 text-white shadow-lg shadow-[#1a227f]/20">
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5" />
                  <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/5" />
                  <div className="relative">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-lg bg-white/15 px-2 py-1 text-[11px] font-semibold text-white/80">
                        {new Date().getFullYear()}-yil
                      </span>
                      <span className="material-symbols-outlined text-[20px] text-white/40">bar_chart_4_bars</span>
                    </div>
                    <p className="text-4xl font-extrabold leading-none">{stats?.totals.total_documents ?? 0}</p>
                    <p className="mt-1.5 text-sm font-medium text-white/70">Jami hujjatlar soni</p>
                  </div>
                </div>

                {/* Total amount */}
                <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <span className="material-symbols-outlined text-[18px]">payments</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Umumiy qiymat</span>
                  </div>
                  <p className="text-2xl font-extrabold leading-tight text-slate-900">
                    {formatMoney(totalAmount)}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">so&apos;m (UZS)</p>
                </div>

                {/* Active types */}
                <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <span className="material-symbols-outlined text-[18px]">category</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Faol turlar</span>
                  </div>
                  <p className="text-2xl font-extrabold leading-tight text-slate-900">
                    {typeStats.filter((t) => t.count > 0).length}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{typeStats.length} ta turdan</p>
                </div>
              </div>

              {/* Type cards grid */}
              <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
                {cardTypes.map((card) => {
                  const accent = cardAccentByType[card.key] ?? {
                    icon: "description",
                    accent: "bg-slate-100 text-slate-600 border-slate-200",
                    dot: "bg-slate-500",
                    badge: "bg-slate-100 text-slate-600 border border-slate-200",
                  };
                  const isEmpty = card.count === 0;
                  return (
                    <div
                      key={card.key}
                      className={`group rounded-2xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                        isEmpty ? "border-slate-100 opacity-60" : "border-slate-100 shadow-sm"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className={`flex size-9 items-center justify-center rounded-xl border ${accent.accent}`}>
                          <span className="material-symbols-outlined text-[20px]">{accent.icon}</span>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${accent.badge}`}>
                          +{card.month} shu oy
                        </span>
                      </div>
                      <p className="mb-0.5 text-xs font-semibold text-slate-500">{card.title}</p>
                      <p className="text-2xl font-extrabold leading-none text-slate-900">
                        {card.count}
                        <span className="ml-1 text-sm font-normal text-slate-400">ta</span>
                      </p>
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <p className="text-[11px] text-slate-400">Umumiy qiymat</p>
                        <p className="mt-0.5 text-xs font-bold text-[#1a227f]">{formatMoney(card.amount)} so&apos;m</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts row */}
              <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
                {/* Trend chart */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Hujjatlar dinamikasi</h3>
                      <p className="text-xs text-slate-400">Oxirgi 6 oy bo&apos;yicha o&apos;zgarish</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      6 oy
                    </div>
                  </div>
                  <div className="relative h-56 overflow-hidden rounded-xl bg-slate-50/60">
                    <svg
                      aria-label="Hujjatlar dinamikasi"
                      className="absolute inset-0 h-full w-full"
                      viewBox="0 0 1000 280"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1a227f" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#1a227f" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <path d={trendPaths.areaPath} fill="url(#areaFill)" />
                      <path
                        d={trendPaths.linePath}
                        fill="none"
                        stroke="#1a227f"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="absolute right-0 bottom-0 left-0 flex items-end justify-between px-5 pb-3">
                      {(trend.length ? trend : [{ label: "-" }]).map((point, idx) => (
                        <span key={`${point.label}-${idx}`} className="text-xs text-slate-400">
                          {point.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Donut chart */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-slate-900">Taqsimot</h3>
                    <p className="text-xs text-slate-400">Hujjat turlari bo&apos;yicha</p>
                  </div>
                  <div className="mb-5 flex justify-center">
                    <div
                      className="relative flex h-32 w-32 items-center justify-center rounded-full shadow-md"
                      style={{ background: donutBackground }}
                    >
                      <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                        <span className="text-2xl font-extrabold leading-none text-slate-900">
                          {stats?.totals.total_documents ?? 0}
                        </span>
                        <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase">Jami</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {typeStats.map((item) => (
                      <div key={item.normative_type} className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-slate-700">
                          <span
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: colorByType[item.normative_type] ?? "#64748b" }}
                          />
                          {typeTitleMap[item.normative_type] ?? item.label}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Latest calculations table */}
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">So&apos;nggi hisob-kitoblar</h3>
                    <p className="text-xs text-slate-400">Oxirgi kiritilgan hujjatlar</p>
                  </div>
                  <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#1a227f] transition-colors hover:bg-[#1a227f]/5">
                    Barchasini ko&apos;rish
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="px-6 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase">Hujjat nomi</th>
                        <th className="px-6 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase">Turi</th>
                        <th className="px-6 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase">Sana</th>
                        <th className="px-6 py-3 text-right text-xs font-bold tracking-wide text-slate-400 uppercase">Hisoblangan narxi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {!isLoading && stats?.latest_calculations.length === 0 && (
                        <tr>
                          <td className="px-6 py-6 text-sm text-slate-400" colSpan={4}>
                            Hozircha ma&apos;lumot yo&apos;q.
                          </td>
                        </tr>
                      )}
                      {(stats?.latest_calculations ?? []).map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`transition-colors hover:bg-blue-50/30 ${idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"}`}
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900">{item.name}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a227f]/8 px-2.5 py-1 text-xs font-semibold text-[#1a227f]">
                              {typeTitleMap[item.normative_type] ?? item.normative_type}
                            </span>
                            <p className="mt-0.5 text-[11px] text-slate-400">{categoryLabelMap[item.document_category] ?? "-"}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {new Date(item.created_at).toLocaleDateString("uz-UZ")}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-[#1a227f] tabular-nums whitespace-nowrap">
                            {formatMoney(item.final_total_amount)} so&apos;m
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
