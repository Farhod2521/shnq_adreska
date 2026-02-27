"use client";

import AppSidebar from "@/components/AppSidebar";
import { Fragment, useEffect, useMemo, useState } from "react";

type ReportRow = {
  order: number;
  id: number;
  name: string;
  total_amount: string;
  completed_amount: string;
  planned_amount: string;
  development_deadline: string;
  executor_organization: string;
  notes: string;
};

type ReportSection = {
  category: string;
  rows: ReportRow[];
  totals: {
    total_amount: string;
    completed_amount: string;
    planned_amount: string;
  };
};

type ReportPayload = {
  sections: ReportSection[];
  summary: {
    total_amount: string;
    completed_amount: string;
    planned_amount: string;
    unallocated_limit: string;
    grand_total: string;
  };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.20.104:8000/api";

const formatMoney = (value: string | number): string =>
  new Intl.NumberFormat("uz-UZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const emptySummary = {
  total_amount: "0",
  completed_amount: "0",
  planned_amount: "0",
  unallocated_limit: "0",
  grand_total: "0",
};

export default function HisobotlarPage() {
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE_URL}/document-calculations/report-table/`);
        if (!response.ok) {
          throw new Error("Hisobot ma'lumotlarini yuklashda xatolik yuz berdi.");
        }
        const payload = (await response.json()) as ReportPayload;
        setReport(payload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Hisobot ma'lumotlari yuklanmadi.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadReport();
  }, []);

  const sections = useMemo(() => report?.sections ?? [], [report]);
  const summary = report?.summary ?? emptySummary;

  return (
    <div className="flex h-screen overflow-hidden bg-background-light text-slate-900">
      <AppSidebar active="hisobotlar" />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hujjatlarni ko&apos;rish</h1>
              <p className="mt-1 text-sm text-slate-500">2026-yil davlat budjeti mablag&apos;lari hisoboti</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                Chop etish
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">table_view</span>
                Excel
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">description</span>
                Word
              </button>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-7">
            <div
              className="mx-auto max-w-[1240px] rounded-sm border border-slate-200 bg-[#fbfbfc] p-6 text-[11px] leading-[1.4] shadow-[0_1px_3px_rgba(15,23,42,0.08)] md:p-10"
              style={{ fontFamily: '"Times New Roman", Times, serif' }}
            >
              <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-2 md:gap-12">
                <div className="py-1">
                  <p className="text-[13px] leading-none font-bold">&quot;KELISHILDI&quot;</p>
                  <p className="mt-3 text-[12px] leading-[1.35] font-bold">
                    O&apos;zbekiston Respublikasi Iqtisodiyot
                    <br />
                    va moliya vazirining
                    <br />
                    o&apos;rinbosari
                  </p>
                  <div className="mt-4">
                    <div className="mx-auto w-[180px] border-b border-slate-700" />
                  </div>
                  <div className="mt-3 text-[11px] leading-none font-bold">
                    <span>&quot;</span>
                    <span className="mx-1 inline-block w-7 border-b border-slate-800 align-middle" />
                    <span>&quot;</span>
                    <span className="mx-1 inline-block w-36 border-b border-slate-800 align-middle" />
                    <span>2026-yil</span>
                  </div>
                </div>
                <div className="py-1">
                  <p className="text-[13px] leading-none font-bold">&quot;TASDIQLAYMAN&quot;</p>
                  <p className="mt-3 text-[12px] leading-[1.35] font-bold">
                    O&apos;zbekiston Respublikasi Qurilish va
                    <br />
                    uy-joy kommunal xo&apos;jaligi vazirining
                    <br />
                    o&apos;rinbosari
                  </p>
                  <div className="mt-4">
                    <div className="mx-auto w-[180px] border-b border-slate-700" />
                  </div>
                  <div className="mt-3 text-[11px] leading-none font-bold">
                    <span>&quot;</span>
                    <span className="mx-1 inline-block w-7 border-b border-slate-800 align-middle" />
                    <span>&quot;</span>
                    <span className="mx-1 inline-block w-36 border-b border-slate-800 align-middle" />
                    <span>2026-yil</span>
                  </div>
                </div>
              </div>

              <div className="mx-auto mt-14 max-w-4xl text-center">
                <h2 className="text-[12px] leading-5 font-bold text-blue-800 uppercase">
                  2026-yilda davlat budjeti mablag&apos;lari hisobiga qurilish va uy-joy kommunal xo&apos;jaligi vazirligi
                  tomonidan milliy normativ hujjatlarni ishlab chiqish va qayta ko&apos;rib chiqish
                </h2>
                <p className="mt-2 text-[12px] font-bold text-blue-800 uppercase underline">Manzilli ro&apos;yxati</p>
              </div>

              <p className="mt-5 text-right text-[11px] italic text-slate-600">Ming so&apos;m</p>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-600 px-2 py-2 text-center font-semibold">T/r</th>
                      <th className="border border-slate-600 px-2 py-2 text-left font-semibold">Normativ hujjat nomi</th>
                      <th className="border border-slate-600 px-2 py-2 text-center font-semibold">Umumiy narxi</th>
                      <th className="border border-slate-600 px-2 py-2 text-center font-semibold">01.01.2026 holatiga</th>
                      <th className="border border-slate-600 px-2 py-2 text-center font-semibold">2026-yilga reja</th>
                      <th className="border border-slate-600 px-2 py-2 text-center font-semibold">Ishlab chiqish muddati</th>
                      <th className="border border-slate-600 px-2 py-2 text-left font-semibold">Ijrochi tashkilot</th>
                      <th className="border border-slate-600 px-2 py-2 text-left font-semibold">Izoh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && (
                      <tr>
                        <td className="border border-slate-600 px-2 py-4 text-center text-slate-500" colSpan={8}>
                          Hisobot ma&apos;lumotlari yuklanmoqda...
                        </td>
                      </tr>
                    )}
                    {!isLoading && sections.length === 0 && (
                      <tr>
                        <td className="border border-slate-600 px-2 py-4 text-center text-slate-500" colSpan={8}>
                          Hozircha hisobot uchun ma&apos;lumot yo&apos;q.
                        </td>
                      </tr>
                    )}
                    {!isLoading &&
                      sections.map((section, sectionIndex) => (
                        <Fragment key={`${section.category}-${sectionIndex}`}>
                          <tr className="bg-blue-50">
                            <th
                              className="border border-slate-600 px-2 py-2 text-center font-semibold text-blue-900"
                              colSpan={8}
                            >
                              {section.category}
                            </th>
                          </tr>
                          {section.rows.map((item) => (
                            <tr key={`${section.category}-${item.id}`} className="align-top">
                              <td className="border border-slate-600 px-2 py-3 text-center">{item.order}</td>
                              <td className="border border-slate-600 px-2 py-3">{item.name}</td>
                              <td className="border border-slate-600 px-2 py-3 text-right font-semibold">
                                {formatMoney(item.total_amount)}
                              </td>
                              <td className="border border-slate-600 px-2 py-3 text-right">
                                {formatMoney(item.completed_amount)}
                              </td>
                              <td className="border border-slate-600 px-2 py-3 text-right font-semibold">
                                {formatMoney(item.planned_amount)}
                              </td>
                              <td className="border border-slate-600 px-2 py-3 text-center">
                                {item.development_deadline || "-"}
                              </td>
                              <td className="border border-slate-600 px-2 py-3">
                                {item.executor_organization || "-"}
                              </td>
                              <td className="border border-slate-600 px-2 py-3 text-[10px] text-slate-600">
                                {item.notes || "-"}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50 font-bold">
                            <td className="border border-slate-600 px-2 py-2 text-right" colSpan={2}>
                              Jami:
                            </td>
                            <td className="border border-slate-600 px-2 py-2 text-right">
                              {formatMoney(section.totals.total_amount)}
                            </td>
                            <td className="border border-slate-600 px-2 py-2 text-right">
                              {formatMoney(section.totals.completed_amount)}
                            </td>
                            <td className="border border-slate-600 px-2 py-2 text-right">
                              {formatMoney(section.totals.planned_amount)}
                            </td>
                            <td className="border border-slate-600 px-2 py-2" colSpan={3} />
                          </tr>
                        </Fragment>
                      ))}
                    {!isLoading && sections.length > 0 && (
                      <>
                        <tr className="bg-white font-bold">
                          <td className="border border-slate-600 px-2 py-2 text-right" colSpan={4}>
                            Taqsimlanmagan limit
                          </td>
                          <td className="border border-slate-600 px-2 py-2 text-right">
                            {formatMoney(summary.unallocated_limit)}
                          </td>
                          <td className="border border-slate-600 px-2 py-2" colSpan={3} />
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                          <td className="border border-slate-600 px-2 py-2 text-right" colSpan={2}>
                            Jami boblar bo&apos;yicha
                          </td>
                          <td className="border border-slate-600 px-2 py-2 text-right">
                            {formatMoney(summary.total_amount)}
                          </td>
                          <td className="border border-slate-600 px-2 py-2 text-right">
                            {formatMoney(summary.completed_amount)}
                          </td>
                          <td className="border border-slate-600 px-2 py-2 text-right">
                            {formatMoney(summary.planned_amount)}
                          </td>
                          <td className="border border-slate-600 px-2 py-2" colSpan={3} />
                        </tr>
                        <tr className="bg-white font-extrabold">
                          <td className="border border-slate-600 px-2 py-2 text-right" colSpan={4}>
                            HAMMASI
                          </td>
                          <td className="border border-slate-600 px-2 py-2 text-right">
                            {formatMoney(summary.grand_total)}
                          </td>
                          <td className="border border-slate-600 px-2 py-2" colSpan={3} />
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-10 text-center md:grid-cols-2 md:gap-14">
                <div>
                  <p className="mx-auto max-w-[420px] text-[12px] leading-[1.35] font-bold">
                    Iqtisodiyot va moliya vazirligi Davlat rivojlantirish dasturlarini moliyalashtirish va
                    infratuzilma jamg&apos;armalarini boshqarish sohasida budjet siyosati departamenti
                  </p>
                  <div className="mt-5">
                    <div className="mx-auto w-[180px] border-b border-slate-700" />
                  </div>
                  <div className="mt-3 text-[11px] leading-none font-bold">
                    <span>&quot;</span>
                    <span className="mx-1 inline-block w-7 border-b border-slate-800 align-middle" />
                    <span>&quot;</span>
                    <span className="mx-1 inline-block w-28 border-b border-slate-800 align-middle" />
                    <span>2026-yil</span>
                  </div>
                </div>
                <div>
                  <p className="mx-auto max-w-[320px] text-[12px] leading-[1.35] font-bold">
                    Qurilish va uy-joy kommunal xo&apos;jaligi vazirligi moliya-iqtisod bo&apos;lim boshlig&apos;i
                  </p>
                  <div className="mt-5">
                    <div className="mx-auto w-[180px] border-b border-slate-700 text-right text-[11px] font-bold">
                      A.Salomov
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] leading-none font-bold">
                    <span>&quot;</span>
                    <span className="mx-1 inline-block w-7 border-b border-slate-800 align-middle" />
                    <span>&quot;</span>
                    <span className="mx-1 inline-block w-28 border-b border-slate-800 align-middle" />
                    <span>2026-yil</span>
                  </div>
                </div>
              </div>

              <div className="mt-14 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500">
                <p>ID: #2026-REP-0012</p>
                <p>Sana: 15.01.2026 14:35</p>
                <p>Sahifa 1 / 12</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <p>Ushbu hujjat elektron ko&apos;rinishda tasdiqlangan va qog&apos;oz variantiga teng kuchga ega.</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-slate-500 transition-colors hover:text-slate-700" type="button">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <span className="font-medium text-slate-800">Sahifa 1</span>
              <button className="text-slate-500 transition-colors hover:text-slate-700" type="button">
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          <p className="mt-10 pb-6 text-center text-sm text-slate-400">
            &copy; 2024-2026 Qurilish va uy-joy kommunal xo&apos;jaligi vazirligi. Barcha huquqlar himoyalangan.
          </p>
        </section>
      </main>
    </div>
  );
}
