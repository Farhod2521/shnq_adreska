import Link from "next/link";

type ErrorPageProps = {
  code: 401 | 403 | 404;
  icon: string;
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
};

export default function ErrorPage({ code, icon, title, message, actionHref, actionLabel }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light p-4 font-sans text-slate-900">
      <div className="flex w-full max-w-[480px] flex-col items-center rounded-xl border border-slate-200 bg-white p-10 text-center shadow-xl">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        <p className="text-6xl font-extrabold tracking-tight text-primary">{code}</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <Link
          href={actionHref}
          className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-white shadow-md transition-all hover:bg-primary/90"
        >
          <span>{actionLabel}</span>
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
