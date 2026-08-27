/**
 * License2Launch — app shell: responsive top nav + footer (M1)
 */
import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { Identity } from "~/server/auth";
import { Container, Logo } from "./ui";

const navLinks = [
  { to: "/professions", label: "Professions" },
  { to: "/explorer", label: "Compare" },
  { to: "/onboarding", label: "Onboarding" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/exam", label: "Exam" },
  { to: "/business-path", label: "Business Path" },
  { to: "/budget", label: "Budget" },
  { to: "/funding", label: "Funding" },
  { to: "/pricing", label: "Pricing" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

function linkCls(active: boolean) {
  return `inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors l2l-focus ${
    active ? "bg-mist text-emerald" : "text-navy hover:bg-mist/70"
  }`;
}

export function AppShell({
  user,
  children,
}: {
  user: Identity | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-mist bg-paper/90 backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-3">
          <Logo />
          <nav className="hidden items-center gap-0.5 lg:flex">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className={linkCls(false)}>
                {l.label}
              </Link>
            ))}
            {user?.role === "admin" && (
              <Link to="/admin" className={linkCls(false)}>
                Admin
              </Link>
            )}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <>
                <span className="text-sm text-slate-soft">{user.name}</span>
                <Link
                  to="/logout"
                  className="rounded-md px-2.5 py-1.5 text-sm font-medium text-emerald hover:bg-emerald/10 l2l-focus"
                >
                  Log out
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-md px-3 py-1.5 text-sm font-semibold text-navy hover:bg-mist l2l-focus"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-emerald px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-dark l2l-focus"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-lg text-navy hover:bg-mist l2l-focus lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {open ? (
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </Container>
        {open && (
          <div className="border-t border-mist bg-paper lg:hidden">
            <Container className="flex flex-col gap-1 py-3">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2 text-sm font-medium text-navy hover:bg-mist"
                >
                  {l.label}
                </Link>
              ))}
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2 text-sm font-medium text-navy hover:bg-mist"
                >
                  Admin
                </Link>
              )}
              <div className="mt-2 flex gap-2 border-t border-mist pt-2">
                {user ? (
                  <>
                    <span className="px-2 py-2 text-sm text-slate-soft">
                      {user.name}
                    </span>
                    <Link to="/logout" className="px-2 py-2 text-sm font-semibold text-emerald">
                      Log out
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex-1 rounded-md border border-mist px-3 py-2 text-center text-sm font-semibold text-navy"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 rounded-md bg-emerald px-3 py-2 text-center text-sm font-semibold text-white"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </Container>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-mist bg-navy text-white/80">
        <Container className="py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
            <div className="max-w-sm">
              <Logo />
              <p className="mt-3 text-sm">
                Helping you prepare for a professional license and turn it into a
                legitimate small business.
              </p>
              <p className="mt-3 text-xs text-white/60">
                Educational and organizational only — no guarantees of passing,
                licensing, funding, or profit.
              </p>
            </div>
            <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-1">
              <Link to="/professions" className="hover:text-white">
                Professions
              </Link>
              <Link to="/roadmap" className="hover:text-white">
                Roadmap
              </Link>
              <Link to="/funding" className="hover:text-white">
                Funding
              </Link>
              <Link to="/pricing" className="hover:text-white">
                Pricing
              </Link>
              <Link to="/privacy" className="hover:text-white">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-white">
                Terms
              </Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-white/10 pt-4 text-xs text-white/50">
            © {new Date().getFullYear()} License2Launch. Sample content is labeled
            as sample and is for illustration only.
          </div>
        </Container>
      </footer>
    </div>
  );
}
