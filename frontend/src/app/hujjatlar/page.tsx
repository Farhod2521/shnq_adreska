"use client";

import AppSidebar from "@/components/AppSidebar";
import AppLoadingState from "@/components/AppLoadingState";
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
  stage1_start: string;
  stage1_end: string;
  stage1_amount: number;
  stage2_start: string;
  stage2_end: string;
  stage2_amount: number;
  stage3_start: string;
  stage3_end: string;
  stage3_amount: number;
  stage4_start: string;
  stage4_end: string;
  stage4_amount: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.20.104:8000/api";
const FORMULA_MULTIPLIER = 2.3;
const HIGH_AMOUNT_THRESHOLD = 2_472_000_000;

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
  completed_amount: string;
  planned_amount: string;
  stage1_start: string;
  stage1_end: string;
  stage1_amount: string;
  stage2_start: string;
  stage2_end: string;
  stage2_amount: string;
  stage3_start: string;
  stage3_end: string;
  stage3_amount: string;
  stage4_start: string;
  stage4_end: string;
  stage4_amount: string;
  created_at: string;
  updated_at: string;
};

const printCss = `
  :root{
    color-scheme:light;
  }
  *{
    box-sizing:border-box;
  }
  html,body{
    margin:0;
    padding:0;
  }
  body{
    font-family:"Times New Roman",Inter,Arial,sans-serif;
    background:#ffffff;
    color:#0f172a;
    padding:8mm;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  .document-sheet{
    width:100%;
    max-width:194mm;
    margin:0 auto;
    min-height:auto;
    background:#ffffff;
    border:1px solid #dbe1ea;
    border-radius:0;
    box-shadow:none;
    padding:8mm 9mm !important;
    font-size:11.5px;
    line-height:1.28;
  }
  .document-sheet .material-symbols-outlined{
    display:none !important;
  }
  .document-sheet img{
    height:72px !important;
    width:auto;
  }
  .document-sheet h1,
  .document-sheet h2{
    margin:0 !important;
    font-size:12px !important;
    line-height:1.25 !important;
  }
  .document-sheet h4{
    margin:0 !important;
    font-size:14px !important;
    line-height:1.3 !important;
  }
  .document-sheet .mb-8{
    margin-bottom:12px !important;
  }
  .document-sheet .mt-11{
    margin-top:14px !important;
  }
  .document-sheet .p-4{
    padding:8px !important;
  }
  .document-sheet .p-3{
    padding:7px !important;
  }
  .document-sheet .p-2{
    padding:5px !important;
  }
  .document-sheet .pt-6{
    padding-top:8px !important;
  }
  .document-sheet .pb-2{
    padding-bottom:4px !important;
  }
  .document-sheet .text-\\[13px\\]{
    font-size:11px !important;
  }
  .document-sheet .text-sm{
    font-size:11px !important;
  }
  .document-sheet .text-xs{
    font-size:10px !important;
  }
  .document-sheet .overflow-x-auto{
    overflow:visible !important;
  }
  .document-sheet table{
    width:100%;
    border-collapse:collapse;
    table-layout:fixed;
    page-break-inside:auto;
  }
  .document-sheet th,
  .document-sheet td{
    word-break:break-word;
    page-break-inside:avoid;
  }
  .document-sheet .min-w-\\[200px\\]{
    min-width:130px !important;
  }
  .no-print{
    display:none !important;
  }
  @media print{
    html,body{
      width:210mm;
      height:297mm;
    }
    body{
      margin:0;
      padding:0;
    }
    .document-sheet{
      width:100%;
      max-width:none;
      margin:0;
      border:none;
      padding:9mm 10mm !important;
      page-break-inside:avoid;
    }
  }
  @page{
    size:A4 portrait;
    margin:0;
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
  "1": { label: "Oddiy", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80" },
  "2": { label: "O'rta", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80" },
  "3": { label: "Yuqori", className: "bg-red-50 text-red-700 ring-1 ring-red-200/80" },
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
  stage1_start: "",
  stage1_end: "",
  stage1_amount: 0,
  stage2_start: "",
  stage2_end: "",
  stage2_amount: 0,
  stage3_start: "",
  stage3_end: "",
  stage3_amount: 0,
  stage4_start: "",
  stage4_end: "",
  stage4_amount: 0,
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
  const [sortKey, setSortKey] = useState<"name" | "total_pages" | "final_total_amount" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const printRef = useRef<HTMLDivElement>(null);

  // Shartnoma
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isContractLoading, setIsContractLoading] = useState(false);
  const [contractDocx64, setContractDocx64] = useState("");
  const [contractFilename, setContractFilename] = useState("");
  const [contractDocName, setContractDocName] = useState("");
  const contractPreviewRef = useRef<HTMLDivElement>(null);

  // Texnik topshiriq
  const [isTexnikModalOpen, setIsTexnikModalOpen] = useState(false);
  const [isTexnikLoading, setIsTexnikLoading] = useState(false);
  const [texnikDocx64, setTexnikDocx64] = useState("");
  const [texnikFilename, setTexnikFilename] = useState("");
  const [texnikDocName, setTexnikDocName] = useState("");
  const texnikPreviewRef = useRef<HTMLDivElement>(null);

  // Kalendar reja
  const [isKalendarModalOpen, setIsKalendarModalOpen] = useState(false);
  const [isKalendarLoading, setIsKalendarLoading] = useState(false);
  const [kalendarDocx64, setKalendarDocx64] = useState("");
  const [kalendarFilename, setKalendarFilename] = useState("");
  const [kalendarDocName, setKalendarDocName] = useState("");
  const kalendarPreviewRef = useRef<HTMLDivElement>(null);

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
      stage1_start: document.stage1_start ?? "",
      stage1_end: document.stage1_end ?? "",
      stage1_amount: toNumber(document.stage1_amount),
      stage2_start: document.stage2_start ?? "",
      stage2_end: document.stage2_end ?? "",
      stage2_amount: toNumber(document.stage2_amount),
      stage3_start: document.stage3_start ?? "",
      stage3_end: document.stage3_end ?? "",
      stage3_amount: toNumber(document.stage3_amount),
      stage4_start: document.stage4_start ?? "",
      stage4_end: document.stage4_end ?? "",
      stage4_amount: toNumber(document.stage4_amount),
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

  const openContractModal = async (doc: DocumentCalculationItem) => {
    setIsContractModalOpen(true);
    setIsContractLoading(true);
    setContractDocx64("");
    setContractDocName(doc.name);
    setContractFilename(`shartnoma_${doc.id}.docx`);
    try {
      const res = await fetch(`${API_BASE_URL}/document-calculations/${doc.id}/contract/`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert((err as { error?: string }).error ?? "Shartnomani yuklashda xatolik yuz berdi.");
        setIsContractModalOpen(false);
        return;
      }
      const payload = (await res.json()) as { data: string; filename: string; doc_name: string };
      setContractFilename(payload.filename);
      setContractDocx64(payload.data);
    } catch {
      alert("Shartnomani yuklashda xatolik yuz berdi.");
      setIsContractModalOpen(false);
    } finally {
      setIsContractLoading(false);
    }
  };

  useEffect(() => {
    if (!contractDocx64 || !contractPreviewRef.current) return;
    const render = async () => {
      const { renderAsync } = await import("docx-preview");
      const binary = Uint8Array.from(atob(contractDocx64), (c) => c.charCodeAt(0));
      if (contractPreviewRef.current) {
        contractPreviewRef.current.innerHTML = "";
        await renderAsync(binary.buffer as ArrayBuffer, contractPreviewRef.current, undefined, {
          className: "docx-preview-wrapper",
        });
      }
    };
    void render();
  }, [contractDocx64]);

  const downloadContract = () => {
    if (!contractDocx64) return;
    const binary = Uint8Array.from(atob(contractDocx64), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = contractFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openTexnikModal = async (doc: DocumentCalculationItem) => {
    setIsTexnikModalOpen(true);
    setIsTexnikLoading(true);
    setTexnikDocx64("");
    setTexnikDocName(doc.name);
    setTexnikFilename(`texnik_topshiriq_${doc.id}.docx`);
    try {
      const res = await fetch(`${API_BASE_URL}/document-calculations/${doc.id}/texnik-topshiriq/`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert((err as { error?: string }).error ?? "Texnik topshiriqni yuklashda xatolik yuz berdi.");
        setIsTexnikModalOpen(false);
        return;
      }
      const payload = (await res.json()) as { data: string; filename: string; doc_name: string };
      setTexnikFilename(payload.filename);
      setTexnikDocx64(payload.data);
    } catch {
      alert("Texnik topshiriqni yuklashda xatolik yuz berdi.");
      setIsTexnikModalOpen(false);
    } finally {
      setIsTexnikLoading(false);
    }
  };

  useEffect(() => {
    if (!texnikDocx64 || !texnikPreviewRef.current) return;
    const render = async () => {
      const { renderAsync } = await import("docx-preview");
      const binary = Uint8Array.from(atob(texnikDocx64), (c) => c.charCodeAt(0));
      if (texnikPreviewRef.current) {
        texnikPreviewRef.current.innerHTML = "";
        await renderAsync(binary.buffer as ArrayBuffer, texnikPreviewRef.current, undefined, {
          className: "docx-preview-wrapper",
        });
      }
    };
    void render();
  }, [texnikDocx64]);

  const downloadTexnik = () => {
    if (!texnikDocx64) return;
    const binary = Uint8Array.from(atob(texnikDocx64), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = texnikFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openKalendarModal = async (doc: DocumentCalculationItem) => {
    setIsKalendarModalOpen(true);
    setIsKalendarLoading(true);
    setKalendarDocx64("");
    setKalendarDocName(doc.name);
    setKalendarFilename(`kalendar_reja_${doc.id}.docx`);
    try {
      const res = await fetch(`${API_BASE_URL}/document-calculations/${doc.id}/kalendar-reja/`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert((err as { error?: string }).error ?? "Kalendar rejani yuklashda xatolik yuz berdi.");
        setIsKalendarModalOpen(false);
        return;
      }
      const payload = (await res.json()) as { data: string; filename: string; doc_name: string };
      setKalendarFilename(payload.filename);
      setKalendarDocx64(payload.data);
    } catch {
      alert("Kalendar rejani yuklashda xatolik yuz berdi.");
      setIsKalendarModalOpen(false);
    } finally {
      setIsKalendarLoading(false);
    }
  };

  useEffect(() => {
    if (!kalendarDocx64 || !kalendarPreviewRef.current) return;
    const render = async () => {
      const { renderAsync } = await import("docx-preview");
      const binary = Uint8Array.from(atob(kalendarDocx64), (c) => c.charCodeAt(0));
      if (kalendarPreviewRef.current) {
        kalendarPreviewRef.current.innerHTML = "";
        await renderAsync(binary.buffer as ArrayBuffer, kalendarPreviewRef.current, undefined, {
          className: "docx-preview-wrapper",
        });
      }
    };
    void render();
  }, [kalendarDocx64]);

  const downloadKalendar = () => {
    if (!kalendarDocx64) return;
    const binary = Uint8Array.from(atob(kalendarDocx64), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = kalendarFilename;
    a.click();
    URL.revokeObjectURL(url);
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

  // Kalendar reja — avtomatik hisoblangan bosqich summalar
  const BILLION = 1_000_000_000;
  const autoStage1Amount = finalTotalAmount > BILLION
    ? Math.round(finalTotalAmount * 0.15 * 100) / 100
    : Math.round(finalTotalAmount * 0.30 * 100) / 100;
  const autoStage3Amount = Math.round(finalTotalAmount * 0.05 * 100) / 100;
  const autoStage4Amount = Math.round(finalTotalAmount * 0.10 * 100) / 100;
  const autoStage2Amount = Math.max(
    Math.round((finalTotalAmount - autoStage1Amount - autoStage3Amount - autoStage4Amount) * 100) / 100,
    0
  );

  // finalTotalAmount o'zgarganda bosqich summalarini avtomatik yangilash
  useEffect(() => {
    if (!isCreateModalOpen || finalTotalAmount <= 0) return;
    setFormValues((prev) => ({
      ...prev,
      stage1_amount: autoStage1Amount,
      stage2_amount: autoStage2Amount,
      stage3_amount: autoStage3Amount,
      stage4_amount: autoStage4Amount,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalTotalAmount, isCreateModalOpen]);

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
          stage1_start: formValues.stage1_start.trim(),
          stage1_end: formValues.stage1_end.trim(),
          stage1_amount: Number(formValues.stage1_amount.toFixed(2)),
          stage2_start: formValues.stage2_start.trim(),
          stage2_end: formValues.stage2_end.trim(),
          stage2_amount: Number(formValues.stage2_amount.toFixed(2)),
          stage3_start: formValues.stage3_start.trim(),
          stage3_end: formValues.stage3_end.trim(),
          stage3_amount: Number(formValues.stage3_amount.toFixed(2)),
          stage4_start: formValues.stage4_start.trim(),
          stage4_end: formValues.stage4_end.trim(),
          stage4_amount: Number(formValues.stage4_amount.toFixed(2)),
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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0" />
        <style>${printCss}</style>
      </head>
      <body>${docHtml}</body>
      </html>`);
    printWindow.document.close();
    printWindow.onload = () => {
      const triggerPrint = () => {
        printWindow.focus();
        setTimeout(() => printWindow.print(), 120);
      };
      if (printWindow.document.fonts) {
        printWindow.document.fonts.ready.then(triggerPrint);
        return;
      }
      setTimeout(triggerPrint, 350);
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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0" />
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
  const filteredDocuments = documents
    .filter((doc) => {
      if (selectedNormativeTypeFilter && doc.normative_type !== selectedNormativeTypeFilter) {
        return false;
      }
      if (!normalizedSearchQuery) return true;
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
    })
    .sort((a, b) => {
      if (!sortKey) return 0;
      let aVal: string | number;
      let bVal: string | number;
      if (sortKey === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortKey === "total_pages") {
        aVal = Number(a.total_pages);
        bVal = Number(b.total_pages);
      } else {
        aVal = toNumber(a.final_total_amount);
        bVal = toNumber(b.final_total_amount);
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: typeof sortKey }) => {
    if (sortKey !== col) {
      return <span className="material-symbols-outlined text-[14px] opacity-30">unfold_more</span>;
    }
    return (
      <span className="material-symbols-outlined text-[14px] text-primary">
        {sortDir === "asc" ? "keyboard_arrow_up" : "keyboard_arrow_down"}
      </span>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f8] text-slate-900">
      <AppSidebar active="hujjatlar" />

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
              <p className="text-sm font-semibold text-slate-800">Tizim admini</p>
              <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-7">
          {/* Page title + actions */}
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Hujjatlar sahifasi</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Barcha turdagi me&apos;yoriy va texnik reglament hujjatlari ro&apos;yxati va monitoringi
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow">
                <span className="material-symbols-outlined text-[18px] text-slate-400">format_list_bulleted</span>
                Umumiy ro&apos;yxat
              </button>
              <button
                className="flex items-center gap-2 rounded-xl bg-[#1a227f] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#1a227f]/25 transition-all hover:bg-[#1a227f]/90 hover:-translate-y-0.5 hover:shadow-lg"
                onClick={openCreateModal}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Yangi qo&apos;shish
              </button>
            </div>
          </div>

          {/* Search & Filter bar */}
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-slate-400">
                search
              </span>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-4 pl-9 text-sm placeholder:text-slate-400 focus:border-[#1a227f]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a227f]/15"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Umumiy qidiruv: nom, ID, hujjat turi, toifa..."
                type="text"
                value={searchQuery}
              />
            </div>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 focus:border-[#1a227f]/40 focus:outline-none focus:ring-2 focus:ring-[#1a227f]/15 md:w-56"
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

          {/* Table card */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#f8f9ff]">
                    <th className="w-12 px-5 py-3.5 text-center text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      №
                    </th>
                    <th className="w-28 px-5 py-3.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      Turi
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      <button
                        className="flex items-center gap-1 transition-colors hover:text-primary"
                        onClick={() => toggleSort("name")}
                        type="button"
                      >
                        Hujjat nomi
                        <SortIcon col="name" />
                      </button>
                    </th>
                    <th className="w-24 px-5 py-3.5 text-center text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      <button
                        className="flex w-full items-center justify-center gap-1 transition-colors hover:text-primary"
                        onClick={() => toggleSort("total_pages")}
                        type="button"
                      >
                        Sahifa
                        <SortIcon col="total_pages" />
                      </button>
                    </th>
                    <th className="w-28 px-5 py-3.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      Murakkablik
                    </th>
                    <th className="w-48 px-5 py-3.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      Toifasi
                    </th>
                    <th className="w-44 px-5 py-3.5 text-right text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      <button
                        className="flex w-full items-center justify-end gap-1 transition-colors hover:text-primary"
                        onClick={() => toggleSort("final_total_amount")}
                        type="button"
                      >
                        Umumiy narxi
                        <SortIcon col="final_total_amount" />
                      </button>
                    </th>
                    <th className="w-36 px-5 py-3.5 text-right text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      Harakatlar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isDocumentsLoading && (
                    <tr>
                      <td className="px-6 py-8 text-sm text-slate-400" colSpan={8}>
                        <AppLoadingState
                          compact
                          subtitle="Ro'yxat backenddan olinmoqda."
                          title="Hujjatlar yuklanmoqda"
                        />
                      </td>
                    </tr>
                  )}
                  {!isDocumentsLoading && filteredDocuments.length === 0 && (
                    <tr>
                      <td className="px-6 py-10 text-center text-sm text-slate-400" colSpan={8}>
                        <div className="flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-4xl text-slate-200">inbox</span>
                          <p>{searchQuery.trim() || selectedNormativeTypeFilter ? "Mos hujjat topilmadi." : "Hozircha saqlangan hujjatlar yo'q."}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!isDocumentsLoading &&
                    filteredDocuments.map((doc, index) => {
                      const complexityInfo = complexityDisplayMap[doc.complexity_level] ?? {
                        label: doc.complexity_level,
                        className: "bg-slate-100 text-slate-600",
                      };
                      const isHighAmount = toNumber(doc.final_total_amount) > HIGH_AMOUNT_THRESHOLD;
                      const isEven = index % 2 === 0;
                      return (
                        <tr
                          key={doc.id}
                          className={`group transition-colors ${
                            isHighAmount
                              ? "bg-red-50/60 hover:bg-red-50"
                              : isEven
                              ? "bg-white hover:bg-blue-50/40"
                              : "bg-[#f8f9ff]/60 hover:bg-blue-50/40"
                          }`}
                        >
                          <td className="px-5 py-3.5 text-center text-sm font-medium text-slate-400">{index + 1}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center rounded-lg bg-[#1a227f]/8 px-2.5 py-1 text-xs font-bold text-[#1a227f]">
                              {getNormativeTypeLabel(doc.normative_type)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="max-w-[42ch] truncate text-sm font-semibold leading-tight text-slate-900">
                              {doc.name}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <button
                                className="flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
                                onClick={() => openContractModal(doc)}
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[13px]">visibility</span>
                                Shartnoma
                              </button>
                              <button
                                className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
                                onClick={() => openKalendarModal(doc)}
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[13px]">visibility</span>
                                Kalendar reja
                              </button>
                              <button
                                className="flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-600 transition-colors hover:bg-amber-100"
                                onClick={() => openTexnikModal(doc)}
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[13px]">visibility</span>
                                Texnik topshiriq
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold tabular-nums text-slate-700">
                              {doc.total_pages}
                            </span>
                            <p className="mt-0.5 text-[10px] text-slate-400">bet</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${complexityInfo.className}`}
                            >
                              {complexityInfo.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm text-slate-600">
                              {categoryLabelMap[doc.document_category]}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <p className="text-sm font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                              {formatMoney(toNumber(doc.final_total_amount))}
                            </p>
                            <p className="text-[11px] text-slate-400">UZS</p>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* View - primary */}
                              <button
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a227f] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#1a227f]/90 hover:shadow"
                                onClick={() => openModal(doc)}
                                title="Hujjatni ko'rish"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[17px]">visibility</span>
                              </button>
                              {/* Edit - outline */}
                              <button
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                onClick={() => openEditModal(doc)}
                                title="Hujjatni tahrirlash"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[17px]">edit</span>
                              </button>
                              {/* Delete - ghost danger */}
                              <button
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                onClick={() => openDeleteConfirm(doc)}
                                title="Hujjatni o'chirish"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[17px]">delete</span>
                              </button>
                              {/* Download - ghost */}
                              <button
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
                                type="button"
                                title="Yuklab olish"
                              >
                                <span className="material-symbols-outlined text-[17px]">download</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">
              <p className="text-xs font-medium text-slate-500">
                <span className="font-bold text-slate-700">{filteredDocuments.length}</span> ta ko&apos;rsatilmoqda &nbsp;&middot;&nbsp; Jami{" "}
                <span className="font-bold text-slate-700">{documents.length}</span> ta
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  className="flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-400 opacity-50"
                  disabled
                >
                  <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                  Oldingi
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a227f] text-xs font-bold text-white shadow-sm">
                  1
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50">
                  2
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50">
                  3
                </button>
                <button className="flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  Keyingi
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
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


      {/* Shartnoma modal */}
      {isContractModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setIsContractModalOpen(false)}
        >
          <div
            className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{ maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#f8f9ff] px-6 py-4">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-[#1a227f] uppercase">Shartnoma</p>
                <h2 className="mt-0.5 max-w-[52ch] truncate text-sm font-bold text-slate-900">{contractDocName}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1.5 rounded-xl bg-[#1a227f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1a227f]/90 disabled:opacity-40"
                  disabled={!contractDocx64}
                  onClick={downloadContract}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Word yuklab olish
                </button>
                <button
                  className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
                  onClick={() => setIsContractModalOpen(false)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
              {isContractLoading ? (
                <div className="flex h-64 items-center justify-center gap-3 text-slate-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1a227f] border-t-transparent" />
                  <span className="text-sm">Yuklanmoqda...</span>
                </div>
              ) : (
                <div
                  ref={contractPreviewRef}
                  className="mx-auto max-w-4xl rounded-xl bg-white shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Texnik topshiriq modal */}
      {isTexnikModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setIsTexnikModalOpen(false)}
        >
          <div
            className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{ maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-amber-50 px-6 py-4">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-amber-700 uppercase">Texnik topshiriq</p>
                <h2 className="mt-0.5 max-w-[52ch] truncate text-sm font-bold text-slate-900">{texnikDocName}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 disabled:opacity-40"
                  disabled={!texnikDocx64}
                  onClick={downloadTexnik}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Word yuklab olish
                </button>
                <button
                  className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
                  onClick={() => setIsTexnikModalOpen(false)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
              {isTexnikLoading ? (
                <div className="flex h-64 items-center justify-center gap-3 text-slate-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  <span className="text-sm">Yuklanmoqda...</span>
                </div>
              ) : (
                <div
                  ref={texnikPreviewRef}
                  className="mx-auto max-w-4xl rounded-xl bg-white shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Kalendar reja modal */}
      {isKalendarModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setIsKalendarModalOpen(false)}
        >
          <div
            className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{ maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#f0fdf4] px-6 py-4">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase">Kalendar reja</p>
                <h2 className="mt-0.5 max-w-[52ch] truncate text-sm font-bold text-slate-900">{kalendarDocName}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-40"
                  disabled={!kalendarDocx64}
                  onClick={downloadKalendar}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Word yuklab olish
                </button>
                <button
                  className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
                  onClick={() => setIsKalendarModalOpen(false)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
              {isKalendarLoading ? (
                <div className="flex h-64 items-center justify-center gap-3 text-slate-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                  <span className="text-sm">Yuklanmoqda...</span>
                </div>
              ) : (
                <div
                  ref={kalendarPreviewRef}
                  className="mx-auto max-w-4xl rounded-xl bg-white shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}

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
                  <AppLoadingState
                    className="rounded-lg border border-slate-200 bg-white"
                    compact
                    subtitle="Normativlar va xodimlar ma'lumotlari olinmoqda."
                    title="Ma&apos;lumotlar yuklanmoqda"
                  />
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

                  {/* Kalendar reja */}
                  <div className="mt-5 rounded-xl border border-primary/20 bg-white">
                    <div className="flex items-center justify-between border-b border-primary/15 px-4 py-3">
                      <span className="text-sm font-bold text-primary">Kalendar reja</span>
                      <span className="text-xs text-slate-500">
                        Jami: <span className="font-semibold text-slate-700">{formatMoney(finalTotalAmount)} so&apos;m</span>
                        {finalTotalAmount > 0 && (
                          <span className="ml-2 text-slate-400">
                            ({finalTotalAmount > BILLION ? "1 mlrd dan yuqori → I bosqich 15%" : "1 mlrd dan past → I bosqich 30%"})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="space-y-3 p-4">
                      {([
                        { num: 1, label: "I bosqich", startKey: "stage1_start", endKey: "stage1_end", amountKey: "stage1_amount" },
                        { num: 2, label: "II bosqich", startKey: "stage2_start", endKey: "stage2_end", amountKey: "stage2_amount" },
                        { num: 3, label: "III bosqich", startKey: "stage3_start", endKey: "stage3_end", amountKey: "stage3_amount" },
                        { num: 4, label: "IV bosqich", startKey: "stage4_start", endKey: "stage4_end", amountKey: "stage4_amount" },
                      ] as const).map(({ label, startKey, endKey, amountKey }) => (
                        <div key={label} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
                          <div>
                            <p className="mb-1 text-xs font-bold text-slate-600 uppercase">{label} — boshlanishi</p>
                            <input
                              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                              placeholder="I-chorak 2025 y"
                              type="text"
                              value={formValues[startKey]}
                              onChange={(e) => setFormValues((prev) => ({ ...prev, [startKey]: e.target.value }))}
                            />
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-bold text-slate-600 uppercase">{label} — tugashi</p>
                            <input
                              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                              placeholder="III-chorak 2025 y"
                              type="text"
                              value={formValues[endKey]}
                              onChange={(e) => setFormValues((prev) => ({ ...prev, [endKey]: e.target.value }))}
                            />
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-bold text-slate-600 uppercase">{label} — summa</p>
                            <div className="relative">
                              <input
                                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 pr-12 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                min={0}
                                step="0.01"
                                type="number"
                                value={formValues[amountKey]}
                                onChange={(e) => setFormValues((prev) => ({ ...prev, [amountKey]: Number(e.target.value) || 0 }))}
                              />
                              <span className="absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-slate-400">so&apos;m</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
                  className="document-sheet mx-auto w-full max-w-[794px] border border-slate-200 bg-white px-6 py-6 text-[12px] leading-[1.42] shadow-[0_20px_60px_-25px_rgba(15,23,42,0.45)] md:px-8"
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
                    <h3 className="mb-4 text-sm font-bold tracking-wider text-primary uppercase">
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
                    <h3 className="mb-4 text-sm font-bold tracking-wider text-primary uppercase">
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
