"use client";

import AppSidebar from "@/components/AppSidebar";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.20.104:8000/api";

type OrgSettings = {
  institute_director: string;
  deputy_minister: string;
  economics_head: string;
  updated_at?: string;
};

const PLACEHOLDER_INFO = [
  {
    key: "institute_director",
    label: "Institut direktori",
    placeholder_word: "{{institute_director}}",
    icon: "person",
    hint: "Shartnomada imzo chekadigan direktor",
  },
  {
    key: "deputy_minister",
    label: "Vazir o'rin bosari",
    placeholder_word: "{{deputy_minister}}",
    icon: "manage_accounts",
    hint: "Vazirlik tomonidan imzolaydi",
  },
  {
    key: "economics_head",
    label: "Iqtisod bo'lim boshlig'i",
    placeholder_word: "{{economics_head}}",
    icon: "calculate",
    hint: "Iqtisodiy hisob-kitoblarni tasdiqlaydi",
  },
];

export default function SozlamalarPage() {
  const [values, setValues] = useState<OrgSettings>({
    institute_director: "",
    deputy_minister: "",
    economics_head: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/organization-settings/`);
        if (!res.ok) throw new Error("Sozlamalarni yuklashda xatolik.");
        const data = (await res.json()) as OrgSettings;
        setValues({
          institute_director: data.institute_director || "",
          deputy_minister: data.deputy_minister || "",
          economics_head: data.economics_head || "",
        });
        if (data.updated_at) {
          setSavedAt(new Date(data.updated_at).toLocaleString("uz-UZ"));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Xatolik yuz berdi.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/organization-settings/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Saqlashda xatolik yuz berdi.");
      const data = (await res.json()) as OrgSettings;
      if (data.updated_at) {
        setSavedAt(new Date(data.updated_at).toLocaleString("uz-UZ"));
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f8] text-slate-900">
      <AppSidebar active="sozlamalar" />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="z-10 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-8 shadow-sm">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-sm">
              <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-slate-400">
                search
              </span>
              <input
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-sm placeholder:text-slate-400 focus:border-[#1a227f]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a227f]/15"
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
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 hover:bg-slate-100">
              <div className="flex size-7 items-center justify-center rounded-full bg-[#1a227f] text-[11px] font-bold text-white">
                SA
              </div>
              <p className="text-sm font-semibold text-slate-800">Tizim admini</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-7">
          {/* Title */}
          <div className="mb-7">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Sozlamalar</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Tashkilot ma&apos;lumotlari — shartnoma shablonlarida avtomatik to&apos;ldiriladi
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
            {/* Form */}
            <form onSubmit={onSave}>
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-[#f8f9ff] px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#1a227f]/10 text-[#1a227f]">
                      <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">Tashkilot ma&apos;lumotlari</h2>
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {isLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i}>
                          <div className="mb-2 h-4 w-40 rounded bg-slate-200" />
                          <div className="h-11 rounded-xl bg-slate-200" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    PLACEHOLDER_INFO.map((field) => (
                      <div key={field.key}>
                        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">{field.icon}</span>
                          {field.label}
                        </label>
                        <input
                          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a227f]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a227f]/15"
                          onChange={(e) =>
                            setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          placeholder={`Masalan: Karimov Jasur Abdullayevich`}
                          type="text"
                          value={(values as Record<string, string>)[field.key]}
                        />
                        <p className="mt-1 text-[11px] text-slate-400">{field.hint}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                  {savedAt ? (
                    <p className="text-xs text-slate-400">
                      Oxirgi saqlangan: <span className="font-medium text-slate-600">{savedAt}</span>
                    </p>
                  ) : (
                    <span />
                  )}
                  <button
                    className="flex items-center gap-2 rounded-xl bg-[#1a227f] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1a227f]/20 transition-all hover:bg-[#1a227f]/90 hover:-translate-y-0.5 disabled:opacity-60"
                    disabled={isSaving || isLoading}
                    type="submit"
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saqlanmoqda...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        Saqlash
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Placeholder reference card */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm self-start">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <span className="material-symbols-outlined text-[18px]">code</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Word shablonga yozish</h3>
              </div>
              <p className="mb-4 text-xs text-slate-500">
                Quyidagi placeholder&apos;larni Word shabloni (<code className="rounded bg-slate-100 px-1">shartnoma.docx</code>) ichiga yozing — shartnoma yuklananda avtomatik to&apos;ldiriladi.
              </p>

              <div className="space-y-2.5">
                {/* Org placeholders */}
                {PLACEHOLDER_INFO.map((f) => (
                  <div key={f.key} className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                    <p className="font-mono text-xs font-bold text-indigo-700">{f.placeholder_word}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{f.label}</p>
                  </div>
                ))}

                <div className="my-1 border-t border-slate-100" />
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Hujjat ma&apos;lumotlari</p>

                {[
                  { ph: "{{shnq_name}}", desc: "Hujjat nomi (qalin)" },
                  { ph: "{{total_pages}}", desc: "Sahifalar soni" },
                  { ph: "{{final_total_amount}}", desc: "Yakuniy summa" },
                  { ph: "{{executor_organization}}", desc: "Bajaruvchi tashkilot" },
                  { ph: "{{development_deadline}}", desc: "Ishlab chiqish muddati" },
                  { ph: "{{created_at}}", desc: "Sana (kk.oo.yyyy)" },
                  { ph: "{{normative_type}}", desc: "Hujjat turi" },
                  { ph: "{{notes}}", desc: "Izoh" },
                ].map((item) => (
                  <div key={item.ph} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="font-mono text-xs font-bold text-slate-700">{item.ph}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success toast */}
      <div
        className={`pointer-events-none fixed top-6 right-6 z-50 transform transition-all duration-300 ${
          showSuccess ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Sozlamalar saqlandi
        </div>
      </div>
    </div>
  );
}
