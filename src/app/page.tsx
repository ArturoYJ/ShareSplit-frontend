import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-main px-6">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[120px]" />

      <div className="z-10 max-w-3xl text-center animate-fade-in">
        <h1 className="mb-6 text-6xl font-extrabold tracking-tight sm:text-7xl">
          Share<span className="text-gradient">Split</span>
        </h1>

        <p className="mb-10 text-xl text-slate-400 sm:text-2xl leading-relaxed">
          Divide gastos con precisión milimétrica.
          Cada quien paga <span className="text-white font-medium">exactamente lo que consumió</span>,
          sin dramas ni divisiones injustas.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register" className="btn-primary w-full sm:w-auto text-lg">
            Empezar ahora
          </Link>
          <Link href="/login" className="btn-secondary w-full sm:w-auto text-lg">
            Iniciar sesión
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 text-left sm:grid-cols-3">
          <div className="glass p-6 rounded-2xl">
            <div className="text-secondary text-2xl mb-2 font-bold">Granular</div>
            <p className="text-slate-400 text-sm">
              Desglosa el ticket ítem por ítem. Reclama solo lo que es tuyo.
            </p>
          </div>
          <div className="glass p-6 rounded-2xl">
            <div className="text-primary text-2xl mb-2 font-bold">Transparente</div>
            <p className="text-slate-400 text-sm">
              Cálculos automáticos de quién debe a quién en tiempo real.
            </p>
          </div>
          <div className="glass p-6 rounded-2xl">
            <div className="text-accent text-2xl mb-2 font-bold">Sencillo</div>
            <p className="text-slate-400 text-sm">
              Crea un grupo, invita a tus amigos y liquida deudas con un click.
            </p>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-8 text-slate-500 text-sm">
        © 2026 ShareSplit — Diseñado para una convivencia financiera justa.
      </footer>
    </main>
  );
}