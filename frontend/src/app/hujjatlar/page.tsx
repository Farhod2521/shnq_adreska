"use client";

import AppSidebar from "@/components/AppSidebar";
import { useEffect, useRef, useState } from "react";

type StaffSnapshotItem = {
  staff_id: number;
  name: string;
  employee_count: number;
  coefficient: string;
  mrot: string;
  amount: string;
};

type NormativeCoefficientItem = {
  id: number;
  normative_type: string;
  normative_type_label: string;
  new_document_base: string;
  rework_harmonization_base: string;
  rework_modification_base: string;
  additional_change_base: string;
  complexity_level_1: string;
  complexity_level_2: string;
  complexity_level_3: string;
};

type StaffCompositionItem = {
  id: number;
  name: string;
  coefficient: string;
  mrot: string;
  sort_order: number;
};

type DocumentCalculationCategoryItem = {
  id: number;
  name: string;
};

type DocumentCategory =
  | "new"
  | "rework_harmonization"
  | "rework_modification"
  | "additional_change";

type ComplexityLevel = "1" | "2" | "3";
type DocumentFormValues = {
  calculation_category: number | "";
  name: string;
  normative_type: string;
  total_pages: number;
  complexity_level: ComplexityLevel;
  document_category: DocumentCategory;
  is_research_required: boolean;
  development_deadline: string;
  executor_organization: string;
  notes: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.20.104:8000/api";
const FORMULA_MULTIPLIER = 2.3;

type DocumentCalculationItem = {
  id: number;
  name: string;
  total_pages: number;
  normative_type: string;
  calculation_category?: number | null;
  calculation_category_name?: string;
  document_category: DocumentCategory;
  complexity_level: ComplexityLevel;
  is_research_required: boolean;
  development_deadline?: string;
  executor_organization?: string;
  notes?: string;
  selected_base_coefficient: string;
  selected_complexity_coefficient: string;
  staff_snapshot: StaffSnapshotItem[];
  staff_total_amount: string;
  final_total_amount: string;
  created_at: string;
  updated_at: string;
};

const printCss = `
  body{
    font-family:Inter,Arial,sans-serif;
    background:#ffffff;
    color:#0f172a;
    margin:0;
    padding:12px;
  }
  .document-sheet{
    width:210mm;
    min-height:297mm;
    margin:0 auto;
    background:#ffffff;
    border:1px solid #e2e8f0;
    box-shadow:none;
    border-radius:0;
  }
  .no-print{display:none !important}
  @media print{
    body{padding:0}
    .document-sheet{margin:0 auto;border:none}
  }
  @page{
    size:A4;
    margin:10mm;
  }
`;

const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("uz-UZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const staffIconByName = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("rahbar")) return "person_celebrate";
  if (lower.includes("yetakchi")) return "person_apron";
  if (lower.includes("katta")) return "person_pin";
  if (lower.includes("kichik")) return "engineering";
  if (lower.includes("ekspert")) return "construction";
  if (lower.includes("texnik") || lower.includes("stajer")) return "science";
  return "person";
};

const categoryLabelMap: Record<DocumentCategory, string> = {
  new: "Yangi",
  rework_harmonization: "Qayta ishlash: uyg'unlashtirish",
  rework_modification: "Qayta ishlash: muvofiqlashtirish",
  additional_change: "Qo'shimcha o'zgartirish",
};

const complexityDisplayMap: Record<ComplexityLevel, { label: string; className: string }> = {
  "1": { label: "Oddiy", className: "bg-emerald-100 text-emerald-800" },
  "2": { label: "O'rta", className: "bg-amber-100 text-amber-800" },
  "3": { label: "Yuqori", className: "bg-red-100 text-red-800" },
};

const getInitialFormValues = (): DocumentFormValues => ({
  calculation_category: "",
  name: "",
  normative_type: "",
  total_pages: 1,
  complexity_level: "1",
  document_category: "new",
  is_research_required: false,
  development_deadline: "",
  executor_organization: "",
  notes: "",
});

export default function HujjatlarPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<number | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentCalculationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [documents, setDocuments] = useState<DocumentCalculationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNormativeTypeFilter, setSelectedNormativeTypeFilter] = useState("");
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentCalculationItem | null>(null);
  const [normativeOptions, setNormativeOptions] = useState<NormativeCoefficientItem[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffCompositionItem[]>([]);
  const [calculationCategories, setCalculationCategories] = useState<DocumentCalculationCategoryItem[]>([]);
  const [isFormDataLoading, setIsFormDataLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [formValues, setFormValues] = useState<DocumentFormValues>(getInitialFormValues());
  const [staffCounts, setStaffCounts] = useState<Record<number, number>>({});
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    if (isModalOpen || isCreateModalOpen || isDeleteConfirmOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isModalOpen, isCreateModalOpen, isDeleteConfirmOpen]);

  useEffect(() => {
    if (!isModalOpen && !isCreateModalOpen && !isDeleteConfirmOpen) {
      return;
    }
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isDeleteConfirmOpen) {
          setIsDeleteConfirmOpen(false);
          setDocumentToDelete(null);
          return;
        }
        if (isCreateModalOpen) {
          setIsCreateModalOpen(false);
          setEditingDocumentId(null);
          return;
        }
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isModalOpen, isCreateModalOpen, isDeleteConfirmOpen]);

  const openModal = (document: DocumentCalculationItem) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
  };

  const openCreateModal = () => {
    setEditingDocumentId(null);
    setFormError("");
    setFormValues({
      ...getInitialFormValues(),
      calculation_category: calculationCategories[0]?.id ?? "",
    });
    setStaffCounts({});
    setIsCreateModalOpen(true);
  };

  const openEditModal = (document: DocumentCalculationItem) => {
    setEditingDocumentId(document.id);
    setFormError("");
    setFormValues({
      calculation_category: document.calculation_category ?? calculationCategories[0]?.id ?? "",
      name: document.name ?? "",
      normative_type: document.normative_type ?? "",
      total_pages: Number(document.total_pages) || 1,
      complexity_level: document.complexity_level ?? "1",
      document_category: document.document_category ?? "new",
      is_research_required: Boolean(document.is_research_required),
      development_deadline: document.development_deadline ?? "",
      executor_organization: document.executor_organization ?? "",
      notes: document.notes ?? "",
    });
    const snapshotCounts = (document.staff_snapshot ?? []).reduce<Record<number, number>>((acc, item) => {
      acc[item.staff_id] = Number(item.employee_count) || 0;
      return acc;
    }, {});
    setStaffCounts(snapshotCounts);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setEditingDocumentId(null);
    setFormError("");
  };

  const openDeleteConfirm = (document: DocumentCalculationItem) => {
    setDocumentToDelete(document);
    setIsDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    if (isDeleting) {
      return;
    }
    setIsDeleteConfirmOpen(false);
    setDocumentToDelete(null);
  };

  const loadDocuments = async () => {
    setIsDocumentsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/document-calculations/`);
      if (!response.ok) {
        throw new Error("Hujjatlar ro'yxatini yuklashda xatolik.");
      }
      const payload = (await response.json()) as DocumentCalculationItem[];
      setDocuments(payload);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Hujjatlar ro'yxati yuklanmadi.");
    } finally {
      setIsDocumentsLoading(false);
    }
  };

  const loadNormativeOptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/normative-coefficients/`);
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as NormativeCoefficientItem[];
      setNormativeOptions(payload);
    } catch {
      // Ignore lookup loading errors on list view; type labels will fall back to raw value.
    }
  };

  useEffect(() => {
    void loadDocuments();
    void loadNormativeOptions();
  }, []);

  useEffect(() => {
    if (!showToast) {
      return;
    }
    const timer = window.setTimeout(() => setShowToast(false), 2200);
    return () => window.clearTimeout(timer);
  }, [showToast]);

  const selectedNormative = normativeOptions.find(
    (item) => item.normative_type === formValues.normative_type
  );

  const selectedBaseCoefficient = selectedNormative
    ? toNumber(
        formValues.document_category === "new"
          ? selectedNormative.new_document_base
          : formValues.document_category === "rework_harmonization"
            ? selectedNormative.rework_harmonization_base
            : formValues.document_category === "rework_modification"
              ? selectedNormative.rework_modification_base
              : selectedNormative.additional_change_base
      )
    : 0;

  const selectedComplexityCoefficient = selectedNormative
    ? toNumber(
        formValues.complexity_level === "1"
          ? selectedNormative.complexity_level_1
          : formValues.complexity_level === "2"
            ? selectedNormative.complexity_level_2
            : selectedNormative.complexity_level_3
      )
    : 0;

  const staffTotalAmount = staffOptions.reduce((sum, staff) => {
    const count = staffCounts[staff.id] ?? 0;
    return sum + count * toNumber(staff.coefficient) * toNumber(staff.mrot);
  }, 0);

  const pageRatio =
    selectedBaseCoefficient > 0 ? toNumber(formValues.total_pages) / selectedBaseCoefficient : 0;
  const finalTotalAmount = staffTotalAmount * pageRatio * selectedComplexityCoefficient * FORMULA_MULTIPLIER;
  const researchCoefficient = formValues.is_research_required ? 1.4 : 1.0;

  useEffect(() => {
    if (!isCreateModalOpen) {
      return;
    }

    const loadCreateFormData = async () => {
      setIsFormDataLoading(true);
      setFormError("");
      try {
        const [normativeResponse, staffResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/normative-coefficients/`),
          fetch(`${API_BASE_URL}/staff-compositions/`),
          fetch(`${API_BASE_URL}/document-calculation-categories/`),
        ]);

        if (!normativeResponse.ok || !staffResponse.ok || !categoriesResponse.ok) {
          throw new Error("Ma'lumotlarni yuklashda xatolik yuz berdi.");
        }

        const normativeData = (await normativeResponse.json()) as NormativeCoefficientItem[];
        const staffData = (await staffResponse.json()) as StaffCompositionItem[];
        const categoryData = (await categoriesResponse.json()) as DocumentCalculationCategoryItem[];

        setNormativeOptions(normativeData);
        setStaffOptions(staffData);
        setCalculationCategories(categoryData);
        setFormValues((prev) => ({
          ...prev,
          normative_type: prev.normative_type || normativeData[0]?.normative_type || "",
          calculation_category:
            editingDocumentId === null
              ? (categoryData[0]?.id ?? "")
              : (prev.calculation_category || categoryData[0]?.id || ""),
        }));
        setStaffCounts((prev) => {
          const next: Record<number, number> = {};
          staffData.forEach((staff) => {
            next[staff.id] = prev[staff.id] ?? 1;
          });
          return next;
        });
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Noma'lum xatolik yuz berdi.");
      } finally {
        setIsFormDataLoading(false);
      }
    };

    void loadCreateFormData();
  }, [isCreateModalOpen, editingDocumentId]);

  const onSubmitCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!formValues.name.trim()) {
      setFormError("Hujjat nomini kiriting.");
      return;
    }
    if (!formValues.normative_type) {
      setFormError("Hujjat turini tanlang.");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = editingDocumentId
        ? `${API_BASE_URL}/document-calculations/${editingDocumentId}/`
        : `${API_BASE_URL}/document-calculations/`;
      const method = editingDocumentId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formValues.name.trim(),
          total_pages: Number(formValues.total_pages) || 0,
          normative_type: formValues.normative_type,
          calculation_category:
            formValues.calculation_category === "" ? null : Number(formValues.calculation_category),
          document_category: formValues.document_category,
          complexity_level: formValues.complexity_level,
          is_research_required: formValues.is_research_required,
          development_deadline: formValues.development_deadline.trim(),
          executor_organization: formValues.executor_organization.trim(),
          notes: formValues.notes.trim(),
          staff_counts: Object.fromEntries(
            Object.entries(staffCounts).map(([key, value]) => [key, Number(value) || 0])
          ),
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (payload && typeof payload === "object") {
          setFormError(JSON.stringify(payload));
        } else {
          setFormError("Saqlashda xatolik yuz berdi.");
        }
        return;
      }

      const savedTotal = payload?.final_total_amount ?? finalTotalAmount;
      setToastMessage(
        `${editingDocumentId ? "Yangilandi" : "Saqlandi"}. Yakuniy summa: ${formatMoney(toNumber(savedTotal))} so'm`
      );
      setShowToast(true);
      await loadDocuments();
      closeCreateModal();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Saqlashda xatolik yuz berdi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!documentToDelete) {
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/document-calculations/${documentToDelete.id}/`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Hujjatni o'chirishda xatolik yuz berdi.");
      }
      if (selectedDocument?.id === documentToDelete.id) {
        closeModal();
      }
      setToastMessage("Hujjat muvaffaqiyatli o'chirildi.");
      setShowToast(true);
      await loadDocuments();
      setIsDeleteConfirmOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Hujjatni o'chirishda xatolik yuz berdi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getPrintableHtml = () => {
    if (!printRef.current) {
      return "";
    }
    return printRef.current.outerHTML;
  };

  const handlePrint = () => {
    const docHtml = getPrintableHtml();
    if (!docHtml) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      return;
    }

    printWindow.document.write(`<!doctype html>
      <html lang="uz">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Hisob-kitob hujjati</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
        <style>${printCss}</style>
      </head>
      <body>${docHtml}</body>
      </html>`);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    };
  };

  const handleDownload = () => {
    const docHtml = getPrintableHtml();
    if (!docHtml) {
      return;
    }

    const fullHtml = `<!doctype html>
      <html lang="uz">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Hisob-kitob hujjati</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
        <style>${printCss}</style>
      </head>
      <body>${docHtml}</body>
      </html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hisob-kitob-hisoboti.html";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const normativeTypeLabelMap = normativeOptions.reduce<Record<string, string>>((acc, item) => {
    acc[item.normative_type] = item.normative_type_label;
    return acc;
  }, {});

  const getNormativeTypeLabel = (value: string): string =>
    normativeTypeLabelMap[value] ||
    value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const normativeTypeFilterOptions = Array.from(
    new Set([
      ...normativeOptions.map((item) => item.normative_type),
      ...documents.map((doc) => doc.normative_type),
    ])
  ).map((value) => ({
    value,
    label: getNormativeTypeLabel(value),
  }));

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredDocuments = documents.filter((doc) => {
    if (selectedNormativeTypeFilter && doc.normative_type !== selectedNormativeTypeFilter) {
      return false;
    }

    if (!normalizedSearchQuery) {
      return true;
    }

    const searchableText = [
      doc.name,
      String(doc.id),
      doc.normative_type,
      getNormativeTypeLabel(doc.normative_type),
      categoryLabelMap[doc.document_category],
      complexityDisplayMap[doc.complexity_level]?.label ?? doc.complexity_level,
      formatMoney(toNumber(doc.final_total_amount)),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearchQuery);
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background-light text-slate-900">
      <AppSidebar active="hujjatlar" />

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
          <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Hujjatlar sahifasi
              </h1>
              <p className="text-base text-slate-500">
                Barcha turdagi me&apos;yoriy va texnik reglament hujjatlari ro&apos;yxati va monitoringi
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-lg bg-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-300">
                <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                Umumiy ro&apos;yxat
              </button>
              <button
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                onClick={openCreateModal}
                type="button"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                Yangi qo&apos;shish
              </button>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="relative md:col-span-8">
                <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  className="w-full rounded-lg border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Umumiy qidiruv: nom, ID, hujjat turi, toifa..."
                  type="text"
                  value={searchQuery}
                />
              </div>
              <div className="md:col-span-4">
                <select
                  className="w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary"
                  onChange={(event) => setSelectedNormativeTypeFilter(event.target.value)}
                  value={selectedNormativeTypeFilter}
                >
                  <option value="">Barcha hujjat turlari</option>
                  {normativeTypeFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-12 px-6 py-4 text-center text-xs font-bold tracking-wider text-slate-500 uppercase">
                      №
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Hujjat turi
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Hujjat nomi
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Murakkablik
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Hujjat toifasi
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Umumiy narxi
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Harakatlar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isDocumentsLoading && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-slate-500" colSpan={7}>
                        Hujjatlar yuklanmoqda...
                      </td>
                    </tr>
                  )}
                  {!isDocumentsLoading && filteredDocuments.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-slate-500" colSpan={7}>
                        {searchQuery.trim() || selectedNormativeTypeFilter
                          ? "Mos hujjat topilmadi."
                          : "Hozircha saqlangan hujjatlar yo&apos;q."}
                      </td>
                    </tr>
                  )}
                  {!isDocumentsLoading &&
                    filteredDocuments.map((doc) => {
                      const complexityInfo = complexityDisplayMap[doc.complexity_level] ?? {
                        label: doc.complexity_level,
                        className: "bg-slate-100 text-slate-700",
                      };
                      return (
                        <tr key={doc.id} className="transition-colors hover:bg-slate-50">
                          <td className="px-6 py-4 text-center text-sm font-medium text-slate-400">{doc.id}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              {getNormativeTypeLabel(doc.normative_type)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="mb-1 text-sm leading-tight font-semibold text-slate-900">
                                {doc.name}
                              </span>
                              <span className="font-mono text-xs text-slate-500">ID: #{doc.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${complexityInfo.className}`}
                            >
                              {complexityInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-700">
                              {categoryLabelMap[doc.document_category]}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                            {formatMoney(toNumber(doc.final_total_amount))} UZS
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="rounded-md p-1.5 text-primary transition-colors hover:bg-primary/10"
                                onClick={() => openModal(doc)}
                                title="Hujjatni ko'rish"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-xl">visibility</span>
                              </button>
                              <button
                                className="rounded-md p-1.5 text-indigo-600 transition-colors hover:bg-indigo-50"
                                onClick={() => openEditModal(doc)}
                                title="Hujjatni tahrirlash"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-xl">edit</span>
                              </button>
                              <button
                                className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50"
                                onClick={() => openDeleteConfirm(doc)}
                                title="Hujjatni o'chirish"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-xl">delete</span>
                              </button>
                              <button
                                className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-xl">download</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
              <p className="text-sm text-slate-500">
                {filteredDocuments.length} ta ko&apos;rsatilmoqda (Jami {documents.length} ta)
              </p>
              <div className="flex gap-2">
                <button
                  className="rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-600 opacity-50"
                  disabled
                >
                  Oldingi
                </button>
                <button className="rounded border border-primary bg-primary px-3 py-1 text-sm font-bold text-white">
                  1
                </button>
                <button className="rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-600">
                  2
                </button>
                <button className="rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-600">
                  3
                </button>
                <button className="rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-600">
                  Keyingi
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div
        className={`pointer-events-none fixed top-6 right-6 z-[70] transform transition-all duration-300 ${
          showToast ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        }`}
      >
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg">
          {toastMessage || "Saqlandi"}
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-5xl">
            <div className="rounded-2xl border border-slate-200 bg-background-light shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <p className="mb-1 text-xs font-bold tracking-wider text-primary uppercase">
                    Hujjatlar ro&apos;yxatiga qaytish
                  </p>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    {editingDocumentId ? "Me&apos;yoriy hujjatni tahrirlash" : "Yangi me&apos;yoriy hujjat qo&apos;shish"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {editingDocumentId
                      ? "Hujjat ma&apos;lumotlarini yangilang va qayta hisob-kitobni saqlang."
                      : "Hujjat ma&apos;lumotlarini kiriting va avtomatik hisob-kitoblarni amalga oshiring."}
                  </p>
                </div>
                <button
                  className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-200"
                  onClick={closeCreateModal}
                  title="Yopish"
                  type="button"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form
                className="max-h-[calc(100vh-160px)] space-y-6 overflow-y-auto p-6"
                onSubmit={onSubmitCreate}
              >
                {isFormDataLoading && (
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                    Ma&apos;lumotlar yuklanmoqda...
                  </div>
                )}
                {formError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      1
                    </span>
                    <h3 className="text-lg font-bold text-slate-800">Asosiy ma&apos;lumotlar</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
                    <div className="md:col-span-3">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Kategoriya</label>
                      <select
                        className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) =>
                          setFormValues((prev) => ({
                            ...prev,
                            calculation_category: event.target.value ? Number(event.target.value) : "",
                          }))
                        }
                        value={formValues.calculation_category}
                      >
                        <option value="">Tanlanmagan</option>
                        {calculationCategories.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Hujjat nomi</label>
                      <input
                        className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="Masalan: Qurilish me'yorlari va qoidalari..."
                        onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
                        type="text"
                        value={formValues.name}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Hujjat turi</label>
                      <select
                        className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) =>
                          setFormValues((prev) => ({ ...prev, normative_type: event.target.value }))
                        }
                        value={formValues.normative_type}
                      >
                        <option value="">Tanlang...</option>
                        {normativeOptions.map((item) => (
                          <option key={item.id} value={item.normative_type}>
                            {item.normative_type_label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Umumiy sahifalar soni</label>
                      <div className="relative">
                        <input
                          className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                          min={1}
                          onChange={(event) =>
                            setFormValues((prev) => ({ ...prev, total_pages: Number(event.target.value) || 0 }))
                          }
                          placeholder="0"
                          type="number"
                          value={formValues.total_pages}
                        />
                        <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-slate-400">bet</span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Murakkablik toifasi</label>
                      <select
                        className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) =>
                          setFormValues((prev) => ({
                            ...prev,
                            complexity_level: event.target.value as ComplexityLevel,
                          }))
                        }
                        value={formValues.complexity_level}
                      >
                        <option value="1">I toifa</option>
                        <option value="2">II toifa</option>
                        <option value="3">III toifa</option>
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Hujjat toifasi</label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
                          <input
                            className="h-4 w-4 border-slate-300 text-primary focus:ring-primary/30"
                            checked={formValues.document_category === "new"}
                            name="hujjat_toifasi"
                            onChange={() =>
                              setFormValues((prev) => ({ ...prev, document_category: "new" }))
                            }
                            type="radio"
                            value="new"
                          />
                          Yangi
                          {selectedNormative && (
                            <span className="ml-1 text-xs text-primary">
                              ({selectedNormative.new_document_base} bet/oy)
                            </span>
                          )}
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
                          <input
                            className="h-4 w-4 border-slate-300 text-primary focus:ring-primary/30"
                            checked={formValues.document_category === "rework_harmonization"}
                            name="hujjat_toifasi"
                            onChange={() =>
                              setFormValues((prev) => ({
                                ...prev,
                                document_category: "rework_harmonization",
                              }))
                            }
                            type="radio"
                            value="rework_harmonization"
                          />
                          Qayta ishlash: uyg&apos;unlashtirish
                          {selectedNormative && (
                            <span className="ml-1 text-xs text-primary">
                              ({selectedNormative.rework_harmonization_base} bet)
                            </span>
                          )}
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
                          <input
                            className="h-4 w-4 border-slate-300 text-primary focus:ring-primary/30"
                            checked={formValues.document_category === "rework_modification"}
                            name="hujjat_toifasi"
                            onChange={() =>
                              setFormValues((prev) => ({
                                ...prev,
                                document_category: "rework_modification",
                              }))
                            }
                            type="radio"
                            value="rework_modification"
                          />
                          Qayta ishlash: muvofiqlashtirish
                          {selectedNormative && (
                            <span className="ml-1 text-xs text-primary">
                              ({selectedNormative.rework_modification_base} bet)
                            </span>
                          )}
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
                          <input
                            className="h-4 w-4 border-slate-300 text-primary focus:ring-primary/30"
                            checked={formValues.document_category === "additional_change"}
                            name="hujjat_toifasi"
                            onChange={() =>
                              setFormValues((prev) => ({
                                ...prev,
                                document_category: "additional_change",
                              }))
                            }
                            type="radio"
                            value="additional_change"
                          />
                          Qo&apos;shimcha o&apos;zgartirish
                          {selectedNormative && (
                            <span className="ml-1 text-xs text-primary">
                              ({selectedNormative.additional_change_base} bet)
                            </span>
                          )}
                        </label>
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Tadqiqot o&apos;tkazilishi belgilangan normativ hujjatmi?
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
                          <span className="flex items-center gap-2">
                            <input
                              checked={formValues.is_research_required}
                              className="h-4 w-4 border-slate-300 text-primary focus:ring-primary/30"
                              name="research_required"
                              onChange={() =>
                                setFormValues((prev) => ({ ...prev, is_research_required: true }))
                              }
                              type="radio"
                              value="yes"
                            />
                            Ha
                          </span>
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            1.4
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
                          <span className="flex items-center gap-2">
                            <input
                              checked={!formValues.is_research_required}
                              className="h-4 w-4 border-slate-300 text-primary focus:ring-primary/30"
                              name="research_required"
                              onChange={() =>
                                setFormValues((prev) => ({ ...prev, is_research_required: false }))
                              }
                              type="radio"
                              value="no"
                            />
                            Yo&apos;q
                          </span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            1.0
                          </span>
                        </label>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Tanlangan tadqiqot koeffitsienti:{" "}
                        <span className="font-semibold text-slate-700">{researchCoefficient.toFixed(1)}</span>
                      </p>
                      <input name="research_coefficient" type="hidden" value={researchCoefficient} />
                    </div>

                    <div className="md:col-span-3">
                      <div className="mb-3 mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        Qo&apos;shimcha ma&apos;lumotlar (ixtiyoriy)
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Ishlab chiqish muddati</label>
                      <input
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) =>
                          setFormValues((prev) => ({
                            ...prev,
                            development_deadline: event.target.value,
                          }))
                        }
                        placeholder="Masalan: 2026-yil III-chorak"
                        type="text"
                        value={formValues.development_deadline}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Ishni bajaruvchi tashkilot
                      </label>
                      <input
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) =>
                          setFormValues((prev) => ({
                            ...prev,
                            executor_organization: event.target.value,
                          }))
                        }
                        placeholder="Masalan: Texnik me&apos;yorlash va standartlashtirish ITI"
                        type="text"
                        value={formValues.executor_organization}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Izoh</label>
                      <textarea
                        className="min-h-[90px] w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) =>
                          setFormValues((prev) => ({
                            ...prev,
                            notes: event.target.value,
                          }))
                        }
                        placeholder="Ixtiyoriy izoh..."
                        value={formValues.notes}
                      />
                    </div>
                  </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      2
                    </span>
                    <h3 className="text-lg font-bold text-slate-800">Xodimlar tarkibi</h3>
                  </div>
                  <div className="p-6">
                    <p className="mb-6 text-sm text-slate-500">
                      Loyiha ustida ishlovchi mutaxassislar sonini ko&apos;rsating:
                    </p>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {staffOptions.map((staff) => (
                        <div key={staff.id} className="space-y-2">
                          <label className="block text-xs font-bold tracking-wide text-slate-500 uppercase">
                            {staff.name}
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400">
                              {staffIconByName(staff.name)}
                            </span>
                            <input
                              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                              min={0}
                              onChange={(event) =>
                                setStaffCounts((prev) => ({
                                  ...prev,
                                  [staff.id]: Number(event.target.value) || 0,
                                }))
                              }
                              type="number"
                              value={staffCounts[staff.id] ?? 1}
                            />
                          </div>
                          <p className="text-[11px] text-slate-500">
                            k={staff.coefficient} | mrot={formatMoney(toNumber(staff.mrot))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">calculate</span>
                    <h3 className="text-lg font-bold text-primary">3. Avtomatik hisob-kitoblar</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="flex flex-col items-center rounded-lg border border-primary/10 bg-white p-5 text-center shadow-sm">
                      <span className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        Ish haqi jami
                      </span>
                      <div className="text-2xl font-black text-primary">{formatMoney(staffTotalAmount)}</div>
                      <span className="text-xs text-slate-500">so&apos;m</span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg border border-primary/10 bg-white p-5 text-center shadow-sm">
                      <span className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        Sahifa/Bet x Murakkablik
                      </span>
                      <div className="text-2xl font-black text-primary">
                        {pageRatio.toFixed(2)} x {selectedComplexityCoefficient.toFixed(2)}
                      </div>
                      <span className="text-xs text-slate-500">
                        bet={selectedBaseCoefficient.toFixed(2)} | K={FORMULA_MULTIPLIER}
                      </span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg bg-primary p-5 text-center text-white shadow-md">
                      <span className="mb-1 text-[10px] font-bold tracking-widest uppercase opacity-80">
                        Umumiy narx
                      </span>
                      <div className="text-2xl font-black">{formatMoney(finalTotalAmount)}</div>
                      <span className="text-xs opacity-90">so&apos;m</span>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-500">
                    Formula: ish_haqi_jami * (sahifa_soni / bet_soni) * murakkablik_darajasi * 2.3
                  </p>
                </section>

                <div className="flex items-center justify-end gap-4 pt-2">
                  <button
                    className="rounded-lg border border-slate-200 px-6 py-3 font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                    onClick={closeCreateModal}
                    type="button"
                  >
                    Bekor qilish
                  </button>
                  <button
                    className="flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
                    disabled={isSubmitting || isFormDataLoading}
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    {isSubmitting
                      ? "Saqlanmoqda..."
                      : editingDocumentId
                        ? "Yangilash va qayta hisoblash"
                        : "Saqlash va hisoblash"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Rostan ham o&apos;chirasizmi?</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Bu amal ortga qaytarilmaydi.
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{documentToDelete?.name}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                onClick={closeDeleteConfirm}
                type="button"
              >
                Bekor qilish
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDeleting}
                onClick={onConfirmDelete}
                type="button"
              >
                {isDeleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-[1360px] pb-8">
            <div className="no-print sticky top-4 z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
              <header className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">account_balance</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-primary">Hisob-kitob Tizimi</h2>
                    <p className="text-xs text-slate-500">
                      {selectedDocument?.name || "Hisob-kitob hisoboti"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="flex h-10 min-w-[130px] items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                    onClick={handlePrint}
                    type="button"
                  >
                    <span className="material-symbols-outlined mr-2 text-sm">print</span>
                    Chop etish
                  </button>
                  <button
                    className="flex h-10 min-w-[130px] items-center justify-center rounded-lg bg-slate-100 px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                    onClick={handleDownload}
                    type="button"
                  >
                    <span className="material-symbols-outlined mr-2 text-sm">download</span>
                    Yuklab olish
                  </button>
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100"
                    onClick={closeModal}
                    title="Yopish"
                    type="button"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </header>
            </div>

            <div className="no-print mx-auto mt-4 flex max-w-[1000px] items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm shadow-sm">
              <a className="font-medium text-slate-500 hover:text-primary" href="#">
                Hujjatlar
              </a>
              <span className="text-slate-400">/</span>
              <span className="font-semibold text-slate-800">
                {selectedDocument?.name || "Hisob-kitob hisoboti"}
              </span>
            </div>

            <main className="max-h-[calc(100vh-165px)] overflow-y-auto px-2 pt-4">
              <div className="mx-auto max-w-[1000px] rounded-2xl bg-slate-100/60 p-4 shadow-inner">
                <div
                  ref={printRef}
                  className="document-sheet mx-auto w-full max-w-[860px] border border-slate-200 bg-white px-7 py-8 text-[13px] leading-relaxed shadow-[0_20px_60px_-25px_rgba(15,23,42,0.45)] md:px-10"
                >
             

                  <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-6 flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="O'zbekiston gerbi"
                        className="h-28 w-auto object-contain"
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Emblem_of_Uzbekistan.svg/512px-Emblem_of_Uzbekistan.svg.png"
                      />
                    </div>
                    <div className="space-y-1">
                      <h1 className="text-[15px] leading-snug font-bold text-primary uppercase">
                        O&apos;ZBEKISTON RESPUBLIKASI QURILISH VA UY-JOY KOMMUNAL XO&apos;JALIGI VAZIRLIGI
                      </h1>
                      <h2 className="text-[15px] leading-snug font-bold text-primary uppercase">
                        TEXNIK ME&apos;YORLASH VA STANDARTLASHTIRISH ILMIY-TADQIQOT INSTITUTI 
                      </h2>
                     
                    </div>
                  </div>

                  <div className="mb-8 flex items-center justify-between border-b-[3px] border-primary border-double pb-2">
                
                  </div>
                  <div className="mb-8 text-center">
                    <h4 className="mx-auto max-w-4xl text-[18px] leading-[1.35] font-bold tracking-tight text-slate-900">
                      {selectedDocument?.name || "Hisob-kitob hujjati"}
                    </h4>
                  </div>

                  <div className="mb-8 rounded-xl border border-slate-200 p-4">
                    <h3 className="mb-4 flex items-center text-sm font-bold tracking-wider text-primary uppercase">
                      <span className="material-symbols-outlined mr-2 text-lg">table_view</span>
                      Ish haqi
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="border border-slate-300 p-2 text-center text-xs font-bold">T/r</th>
                            <th className="border border-slate-300 p-2 text-center text-xs font-bold">Xodimlar tarkibi</th>
                            <th className="border border-slate-300 p-2 text-center text-xs font-bold">Soni</th>
                            <th className="border border-slate-300 p-2 text-center text-xs font-bold">
                              Koeffitsient
                            </th>
                            <th className="border border-slate-300 p-2 text-center text-xs font-bold">MROT</th>
                            <th className="border border-slate-300 p-2 text-center text-xs font-bold">
                              Xodimlarning maoshi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-[13px]">
                          {(selectedDocument?.staff_snapshot || []).map((item, index) => (
                            <tr key={`${item.staff_id}-${index}`}>
                              <td className="border border-slate-300 p-2 text-center">{index + 1}</td>
                              <td className="border border-slate-300 p-2">{item.name}</td>
                              <td className="border border-slate-300 p-2 text-center">{item.employee_count}</td>
                              <td className="border border-slate-300 p-2 text-right">
                                {formatMoney(toNumber(item.coefficient))}
                              </td>
                              <td className="border border-slate-300 p-2 text-right">
                                {formatMoney(toNumber(item.mrot))}
                              </td>
                              <td className="border border-slate-300 p-2 text-right">
                                {formatMoney(toNumber(item.amount))}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50 font-bold">
                            <td className="border border-slate-300 p-2 text-center" colSpan={5}>Jami</td>
                            <td className="border border-slate-300 p-2 text-right">
                              {formatMoney(toNumber(selectedDocument?.staff_total_amount))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mb-8 rounded-xl border border-slate-200 p-4">
                    <h3 className="mb-4 flex items-center text-sm font-bold tracking-wider text-primary uppercase">
                      <span className="material-symbols-outlined mr-2 text-lg">calculate</span>
                      Xarajatlar yakuni
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="border border-slate-300 p-3 text-left text-xs font-bold uppercase">
                              Xarajat turi
                            </th>
                      
                            <th className="w-1/3 border border-slate-300 p-3 text-right text-xs font-bold uppercase">
                              Summa (UZS)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-[13px]">
                          <tr>
                            <td className="border border-slate-300 p-3">Bazaviy narx normativi</td>

                            <td className="border border-slate-300 p-3 text-right tabular-nums">
                              {formatMoney(toNumber(selectedDocument?.selected_base_coefficient))}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 p-3">Murakkablik koeffitsienti</td>

                            <td className="border border-slate-300 p-3 text-right tabular-nums">
                              {formatMoney(toNumber(selectedDocument?.selected_complexity_coefficient))}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 p-3">Xodimlar bo&apos;yicha jami</td>

                            <td className="border border-slate-300 p-3 text-right tabular-nums">
                              {formatMoney(toNumber(selectedDocument?.staff_total_amount))}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 p-3">Sahifalar soni</td>

                            <td className="border border-slate-300 p-3 text-right tabular-nums">
                              {selectedDocument?.total_pages ?? 0}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 p-4 text-right text-primary uppercase font-bold">
                              Yakuniy hisoblangan summa
                            </td>
                            <td className="border border-slate-300 p-4 text-right text-base text-primary tabular-nums font-bold">
                              {formatMoney(toNumber(selectedDocument?.final_total_amount))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-4 text-xs italic text-slate-500">
                      * O&apos;ttiz to&apos;qqiz million olti yuz o&apos;n ming so&apos;m 00 tiyin.
                    </p>
                  </div>

                  <div className="mt-11 rounded-xl border border-slate-200 p-4">
                    <table className="w-full border-none border-collapse text-sm text-slate-900">
                      <tbody>
                        <tr>
                          <td className="p-2 italic" colSpan={3}>
                            Tuzdi:
                          </td>
                        </tr>
                        <tr>
                          <td className="w-1/3 p-2 text-right font-bold">Direktor</td>
                          <td className="p-2 text-center">
                            <div className="h-6 w-full min-w-[200px] border-b border-slate-900" />
                          </td>
                          <td className="w-1/4 p-2 font-bold">R.Kuchkarov</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-right font-bold">Direktor o&apos;rinbosari</td>
                          <td className="p-2 text-center">
                            <div className="h-6 w-full min-w-[200px] border-b border-slate-900" />
                          </td>
                          <td className="p-2 font-bold">##########</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-right font-bold">Bosh hisobchi</td>
                          <td className="p-2 text-center">
                            <div className="h-6 w-full min-w-[200px] border-b border-slate-900" />
                          </td>
                          <td className="p-2 font-bold">F.Rixsiyeva</td>
                        </tr>
                        <tr>
                          <td className="pt-6 pb-2 italic" colSpan={3}>
                            Kelishildi:
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center leading-tight font-bold">
                            Qurilish sohasida
                            <br />
                            iqtisodiy islohotlar bo&apos;lim
                            <br />
                            boshlig&apos;i
                          </td>
                          <td className="p-2 text-center align-bottom">
                            <div className="h-6 w-full min-w-[200px] border-b border-slate-900" />
                          </td>
                          <td className="p-2 align-bottom font-bold">A.Azizov</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
