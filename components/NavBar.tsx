import Link from "next/link";

export function NavBar() {
  return (
    <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="font-display text-lg text-slate-900">
          Move &amp; Munch
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
          <Link className="hover:text-slate-900" href="/dashboard">
            Dashboard
          </Link>
          <Link className="hover:text-slate-900" href="/generate-workout">
            Workout
          </Link>
          <Link className="hover:text-slate-900" href="/generate-diet">
            Diet
          </Link>
          <Link className="hover:text-slate-900" href="/messages">
            Messages
          </Link>
          <Link className="hover:text-slate-900" href="/update-data">
            Update data
          </Link>
        </nav>
      </div>
    </header>
  );
}
