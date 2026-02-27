import Link from "next/link";

type SidebarSection = "dashboard" | "hujjatlar" | "hisobotlar";

type AppSidebarProps = {
  active: SidebarSection;
};

const navItemBase =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-100";
const navItemActive = "border border-primary/10 bg-primary/10 font-semibold text-primary";

export default function AppSidebar({ active }: AppSidebarProps) {
  return (
    <aside className="w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 p-6">
        <div className="rounded-lg bg-primary p-1.5 text-white">
          <span className="material-symbols-outlined text-2xl">grid_view</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-primary">DASHBOARD</h2>
      </div>

      <div className="mb-6 px-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Admin rasmi"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtzoAkIAumH2LuAB4wvdqHx2KrjXcK53UyjMyXhbMpHwaatDMU2leZDY9D7y3RcE4oRCa_6M0d914Xr9GclVREKG3T5Zj06mer9HcsWMOKRjhONJbUVbhgYXudkjXuGgfzp1WmjNZBFbLDYmFj9rL-7hW6bUDsK-xGYt3_trey2YWmkqeZhDMfvQj1scpKvSg_Y5NSGz-WesjlkolKv6iAxEdxfRE7FoeCmF7F0FzQ3XQ2cQMHiWUVxPqDjRlEnmWt5I_mNSpjb1A"
            />
          </div>
          <div className="overflow-hidden">
            <h1 className="truncate text-sm font-semibold">Admin foydalanuvchi</h1>
            <p className="truncate text-xs text-slate-500">Boshqaruvchi</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1 px-4">
        <Link className={`${navItemBase} ${active === "dashboard" ? navItemActive : ""}`} href="/dashboard">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-sm font-medium">Asosiy Panel</span>
        </Link>
        <Link className={`${navItemBase} ${active === "hujjatlar" ? navItemActive : ""}`} href="/hujjatlar">
          <span className="material-symbols-outlined">description</span>
          <span className="text-sm font-medium">Hujjatlar</span>
        </Link>
        <Link className={`${navItemBase} ${active === "hisobotlar" ? navItemActive : ""}`} href="/hisobotlar">
          <span className="material-symbols-outlined">bar_chart</span>
          <span className="text-sm font-medium">Hisobotlar</span>
        </Link>
        <a className={navItemBase} href="#">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-sm font-medium">Sozlamalar</span>
        </a>
        <a className={navItemBase} href="#">
          <span className="material-symbols-outlined">help_center</span>
          <span className="text-sm font-medium">Yordam</span>
        </a>
      </nav>
    </aside>
  );
}
