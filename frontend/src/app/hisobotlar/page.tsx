"use client";

import AppSidebar from "@/components/AppSidebar";

type ReportItem = {
  id: number;
  name: string;
  total: string;
  progressAmount: string;
  plan2026: string;
  deadline: string;
  executor: string;
  note: string;
};

const reportItems: ReportItem[] = [
  {
    id: 1,
    name: "SHNQ 2.01.03 'Seysmik hududlarda qurilish' shaharsozlik normalari va qoidalari",
    total: "600 755,15",
    progressAmount: "600 755,15",
    plan2026: "600 755,15",
    deadline: "2026-yil III-chorak",
    executor: "Texnik me'yorlash va standartlashtirish ilmiy-tadqiqot instituti",
    note: "PF-6119 va PF-151 hujjatlari asosida",
  },
  {
    id: 2,
    name: "SHNQ 2.07.01 'Aholi punktlarini rivojlantirish va qurishni rejalashtirish'",
    total: "600 755,15",
    progressAmount: "600 755,15",
    plan2026: "600 755,15",
    deadline: "2026-yil III-chorak",
    executor: "Texnik me'yorlash va standartlashtirish ilmiy-tadqiqot instituti",
    note: "Vazirlar Mahkamasining 2024-yil 23-apreldagi 231-son qarori",
  },
  {
    id: 3,
    name: "SHNQ 'Obyektlarni ko'kalamzorlashtirish' shaharsozlik normalari va qoidalari",
    total: "1 638 769,23",
    progressAmount: "1 638 769,23",
    plan2026: "1 638 769,23",
    deadline: "2026-yil III-chorak",
    executor: "Texnik me'yorlash va standartlashtirish ilmiy-tadqiqot instituti",
    note: "Qurilish sohasini modernizatsiya qilish topshirig'i asosida",
  },
  {
    id: 4,
    name: "Sun'iy intellekt uchun shaharsozlik normlari va qoidalari bazasini yaratish",
    total: "4 096 921,60",
    progressAmount: "4 096 921,60",
    plan2026: "4 096 921,60",
    deadline: "2026-yil III-chorak",
    executor: "Texnik me'yorlash va standartlashtirish ilmiy-tadqiqot instituti",
    note: "Raqamlashtirish va AI yechimlari dasturiga muvofiq",
  },
  {
    id: 5,
    name: "SHNQ 2.01.17 'Fuqaro muhofazasida himoya inshootlari va favquloddagi holatlar'",
    total: "1 311 014,79",
    progressAmount: "1 311 014,79",
    plan2026: "1 311 014,79",
    deadline: "2026-yil III-chorak",
    executor: "Toshkent arxitektura qurilish universiteti",
    note: "O'zbekiston Respublikasi Bosh vazirining topshirig'i",
  },
];

export default function HisobotlarPage() {
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
                    <tr className="bg-blue-50">
                      <th className="border border-slate-600 px-2 py-2 text-center font-semibold text-blue-900" colSpan={8}>
                        I. Bob. Shaharsozlik normalari va qoidalarini qayta ko&apos;rib chiqish va yangilarini ishlab chiqish
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportItems.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="border border-slate-600 px-2 py-3 text-center">{item.id}</td>
                        <td className="border border-slate-600 px-2 py-3">{item.name}</td>
                        <td className="border border-slate-600 px-2 py-3 text-right font-semibold">{item.total}</td>
                        <td className="border border-slate-600 px-2 py-3 text-right">{item.progressAmount}</td>
                        <td className="border border-slate-600 px-2 py-3 text-right font-semibold">{item.plan2026}</td>
                        <td className="border border-slate-600 px-2 py-3 text-center">{item.deadline}</td>
                        <td className="border border-slate-600 px-2 py-3">{item.executor}</td>
                        <td className="border border-slate-600 px-2 py-3 text-[10px] text-slate-600">{item.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

