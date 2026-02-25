import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light p-4 font-sans text-slate-900">
      <div className="flex w-full max-w-[440px] flex-col items-center">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-white shadow-lg">
            <span
              className="material-symbols-outlined text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              architecture
            </span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-primary uppercase">Qurilish tizimi</h1>
            <p className="text-sm font-medium text-slate-500">
              Qurilish reglamentlari boshqaruvi
            </p>
          </div>
        </div>

        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="relative flex h-32 w-full items-center justify-center overflow-hidden bg-primary/10">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
            <div
              className="h-full w-full bg-cover bg-center bg-no-repeat opacity-20"
              data-alt="Qurilish chizmalari va me'moriy fon rasmi"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAPF19YokPO2WHtYkqGFvsyCl9TLY4rb-_FWB2fI4JH1IDaUWxO4ufMdH-oCZ1Zp1NRwTgS6OGma_Jw-DzjK55sYH6ycMj6DPEuyaiTb4bwM501QbIFc4iCHPejubYybu5udvfhLP7FUYq8rZUkdrqoAnwkQ6LervELYAAIjNu1az3sBkucUHLa189eBi-IPJuOH7G3pNSNjmAMrL1Ei4VptJ7cZpqQkRLmL96RiqGO78_nqCLVXoXhaQ5fZzIyyP59sHfSNNZPoc4")',
              }}
            />
            <span className="material-symbols-outlined absolute text-5xl text-primary opacity-30">
              gavel
            </span>
          </div>

          <div className="p-8">
            <h2 className="mb-1 text-center text-2xl font-bold text-slate-900">
              Tizimga kirish
            </h2>
            <p className="mb-8 text-center text-sm text-slate-500">
              Ma&apos;lumotlaringizni kiriting
            </p>

            <form className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="ml-1 text-sm font-semibold text-slate-700">Foydalanuvchi</label>
                <div className="group relative">
                  <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400 transition-colors group-focus-within:text-primary">
                    person
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Foydalanuvchi nomi"
                    type="text"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-sm font-semibold text-slate-700">Parol</label>
                  <a className="text-xs font-medium text-primary transition-all hover:underline" href="#">
                    Parolni unutdingizmi?
                  </a>
                </div>
                <div className="group relative">
                  <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400 transition-colors group-focus-within:text-primary">
                    lock
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pr-12 pl-10 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Parolingiz"
                    type="password"
                  />
                  <button
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center px-1">
                <input
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 bg-slate-100 text-primary focus:ring-2 focus:ring-primary"
                  id="remember"
                  type="checkbox"
                />
                <label className="ml-2 cursor-pointer text-sm text-slate-600" htmlFor="remember">
                  Meni eslab qol
                </label>
              </div>

              <Link
                href="/dashboard"
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 font-bold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
              >
                <span>Kirish</span>
                <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
                  login
                </span>
              </Link>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            (c) 2024 Qurilish Vazirligi. Barcha huquqlar himoyalangan.
          </p>
          <div className="mt-2 flex justify-center gap-4">
            <a className="text-xs text-slate-400 transition-colors hover:text-primary" href="#">
              Yordam
            </a>
            <a className="text-xs text-slate-400 transition-colors hover:text-primary" href="#">
              Maxfiylik siyosati
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
