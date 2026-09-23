import Link from "next/link";
import { ArrowRightIcon, CableIcon, MapPinnedIcon, RadioTowerIcon, ReceiptTextIcon } from "lucide-react";

export default function Home() {
  return (
    <main id="main-content" className="min-h-dvh overflow-hidden bg-[#07110f] text-[#eef7f2]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-[-0.02em]">
          <span className="grid size-8 place-items-center rounded-md bg-emerald-500 text-[#07110f]"><RadioTowerIcon className="size-4.5" /></span>
          Citra NET
        </Link>
        <Link href="/login" className="rounded-md border border-white/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/8">
          Masuk operator
        </Link>
      </nav>

      <section className="relative mx-auto grid min-h-[calc(100dvh-5rem)] max-w-7xl items-center gap-12 px-5 pt-12 pb-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative z-10 max-w-3xl">
          <p className="mb-5 font-mono text-xs tracking-[0.2em] text-emerald-400 uppercase">Network operations · Bogor</p>
          <h1 className="text-balance text-5xl font-semibold leading-[0.94] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Satu ruang kendali untuk jaringan yang terus bergerak.
          </h1>
          <p className="mt-7 max-w-xl text-pretty text-base leading-7 text-slate-300 sm:text-lg">
            Kelola pelanggan, perangkat, tagihan, pengingat WhatsApp, dan titik jaringan tanpa berpindah sistem.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/login" className="inline-flex h-11 items-center gap-2 rounded-md bg-emerald-400 px-5 text-sm font-semibold text-[#07110f] transition-transform hover:-translate-y-0.5 active:translate-y-0">
              Buka pusat operasi <ArrowRightIcon className="size-4" />
            </Link>
            <span className="font-mono text-xs text-slate-400">SANCTUM · QUEUED DELIVERY · GEE</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:mr-0">
          <div className="absolute -inset-20 bg-[radial-gradient(circle,rgba(52,211,153,.13),transparent_62%)]" />
          <div className="relative overflow-hidden rounded-xl border border-white/12 bg-[#0c1916] shadow-2xl shadow-black/35">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 font-mono text-[0.68rem] text-slate-400">
              <span>CITRA/OPS · LIVE OVERVIEW</span><span className="text-emerald-400">● CONNECTED</span>
            </div>
            <div className="grid grid-cols-2 border-b border-white/10">
              <Metric label="Pelanggan aktif" value="247" delta="+8 bulan ini" />
              <Metric label="Collection rate" value="91.6%" delta="stabil" />
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-3">
              <Feature icon={CableIcon} label="Perangkat" value="316 node" />
              <Feature icon={ReceiptTextIcon} label="Tagihan" value="21 tertunda" />
              <Feature icon={MapPinnedIcon} label="Pemetaan" value="3 satelit" />
            </div>
            <div className="relative h-44 overflow-hidden bg-[#09130f]">
              <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(52,211,153,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,.2)_1px,transparent_1px)] [background-size:28px_28px]" />
              {["left-[18%] top-[40%]", "left-[48%] top-[27%]", "left-[69%] top-[58%]", "left-[36%] top-[72%]"].map((position) => <span key={position} className={`absolute ${position} size-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px] shadow-emerald-400/10`} />)}
              <svg className="absolute inset-0 size-full" viewBox="0 0 500 180" aria-hidden="true"><path d="M90 72 L240 49 L345 105 L180 130 Z" fill="none" stroke="rgba(52,211,153,.45)" strokeWidth="1.5" strokeDasharray="5 6" /></svg>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, delta }: { label: string; value: string; delta: string }) {
  return <div className="p-5"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 font-mono text-3xl font-semibold tracking-tight">{value}</p><p className="mt-2 text-xs text-emerald-400">{delta}</p></div>;
}

function Feature({ icon: Icon, label, value }: { icon: typeof CableIcon; label: string; value: string }) {
  return <div className="bg-[#0c1916] p-4"><Icon className="mb-6 size-4 text-emerald-400" /><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>;
}
