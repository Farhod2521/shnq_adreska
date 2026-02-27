"use client";

import AppSidebar from "@/components/AppSidebar";
import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.20.104:8000/api";

type ImportResult = {
  detail: string;
  created_count: number;
  error_count: number;
  errors: Array<{ row: number; field: string; message: string }>;
};

export default function BazaXlsxPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("XLSX faylni tanlang.");
      return;
    }

    setIsUploading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/document-calculations/import-xlsx/`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => ({}))) as Partial<ImportResult> & { detail?: string };
      if (!response.ok) {
        setError(payload.detail ?? "XLSX importda xatolik yuz berdi.");
        if (
          typeof payload.created_count === "number" &&
          typeof payload.error_count === "number" &&
          Array.isArray(payload.errors)
        ) {
          setResult(payload as ImportResult);
        }
        return;
      }

      setResult(payload as ImportResult);
      setFile(null);
      const input = document.getElementById("baza-xlsx-file") as HTMLInputElement | null;
      if (input) {
        input.value = "";
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "XLSX importda xatolik yuz berdi.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light text-slate-900">
      <AppSidebar active="baza_xlsx" />

      <main className="flex flex-1 flex-col overflow-hidden bg-background-light">
        <header className="z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Baza XLSX</h1>
            <p className="text-sm text-slate-500">Hujjatlarni Excel orqali ommaviy yuklash</p>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">XLSX yuklash</h2>
            <p className="mt-2 text-sm text-slate-600">
              Fayl ustunlari: `category`, `name`, `development_deadline`, `executor_organization`, `notes`,
              `total_pages`, `normative_type`, `document_category`, `complexity_level`, `completed_amount`.
            </p>

            <div className="mt-5 space-y-4">
              <input
                id="baza-xlsx-file"
                accept=".xlsx"
                className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                type="file"
              />

              <button
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isUploading || !file}
                onClick={handleUpload}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">upload</span>
                {isUploading ? "Yuklanmoqda..." : "XLSX yuklash"}
              </button>
            </div>

            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm">
                <p className="font-semibold text-slate-800">{result.detail}</p>
                <p className="mt-1 text-slate-700">Yozildi: {result.created_count} ta</p>
                <p className="text-slate-700">Xatolik: {result.error_count} ta</p>

                {result.errors.length > 0 && (
                  <div className="mt-3 max-h-56 overflow-y-auto rounded border border-red-100 bg-white p-3">
                    {result.errors.map((item, idx) => (
                      <p key={`${item.row}-${item.field}-${idx}`} className="text-xs text-red-700">
                        {item.row}-qator | {item.field}: {item.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
