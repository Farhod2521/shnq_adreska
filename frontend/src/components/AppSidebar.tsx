import Link from "next/link";

type SidebarSection = "dashboard" | "hujjatlar" | "hisobotlar" | "baza_xlsx" | "sozlamalar";

type AppSidebarProps = {
  active: SidebarSection;
};

const navItems = [
  { key: "dashboard", href: "/dashboard", icon: "dashboard", label: "Asosiy Panel" },
  { key: "hujjatlar", href: "/hujjatlar", icon: "description", label: "Hujjatlar" },
  { key: "hisobotlar", href: "/hisobotlar", icon: "bar_chart", label: "Hisobotlar" },
  { key: "sozlamalar", href: "/sozlamalar", icon: "settings", label: "Sozlamalar" },
  { key: "yordam", href: "#", icon: "help_center", label: "Yordam" },
];

export default function AppSidebar({ active }: AppSidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-y-auto bg-[#1a227f]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white">
          <span className="material-symbols-outlined text-xl">grid_view</span>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-white">Reglament</h2>
      </div>

      {/* User profile */}
      <div className="mx-4 mb-6 rounded-xl bg-white/10 p-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Admin rasmi"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtzoAkIAumH2LuAB4wvdqHx2KrjXcK53UyjMyXhbMpHwaatDMU2leZDY9D7y3RcE4oRCa_6M0d914Xr9GclVREKG3T5Zj06mer9HcsWMOKRjhONJbUVbhgYXudkjXuGgfzp1WmjNZBFbLDYmFj9rL-7hW6bUDsK-xGYt3_trey2YWmkqeZhDMfvQj1scpKvSg_Y5NSGz-WesjlkolKv6iAxEdxfRE7FoeCmF7F0FzQ3XQ2cQMHiWUVxPqDjRlEnmWt5I_mNSpjb1A"
            />
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-semibold text-white">Admin foydalanuvchi</p>
            <p className="truncate text-xs text-white/60">Boshqaruvchi</p>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <p className="mb-2 px-6 text-[10px] font-bold tracking-widest text-white/40 uppercase">Navigatsiya</p>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "border-l-2 border-white bg-white/15 pl-[10px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
              href={item.href}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${isActive ? "text-white" : "text-white/50"}`}
                style={{ fontVariationSettings: isActive ? '"FILL" 1' : '"FILL" 0' }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto flex size-1.5 rounded-full bg-white/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom version badge */}
      <div className="p-4 text-center">
        <p className="text-[10px] text-white/25">Reglament v1.0 &copy; 2026</p>
      </div>
    </aside>
  );
}
