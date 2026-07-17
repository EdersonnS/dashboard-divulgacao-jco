"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PlusSquare,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/materias/nova", label: "Nova matéria", Icon: PlusSquare },
  { href: "/historico", label: "Histórico", Icon: History },
  { href: "/configuracoes", label: "Configurações", Icon: Settings },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="bg-marca block h-8 w-1 rounded-full" aria-hidden />
      <span>
        <span className="block text-lg leading-none font-bold tracking-tight">JCO</span>
        <span className="text-tinta-fraca block text-[10px] leading-tight font-semibold tracking-[0.16em]">
          DIVULGAÇÃO
        </span>
      </span>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {NAV_ITEMS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
            isActive(href)
              ? "bg-marca-suave text-marca-forte border-marca-borda border font-semibold"
              : "text-tinta-media hover:bg-canvas"
          }`}
        >
          <Icon size={18} strokeWidth={2} aria-hidden />
          {label}
        </Link>
      ))}
    </>
  );
}

/** Rodapé com o usuário logado de verdade — o acesso é uma conta só da equipe. */
function UserFooter({ username }: { username: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="border-linha flex items-center gap-2.5 border-t px-3 py-3">
      <span className="bg-canvas text-tinta-media border-linha flex h-9 w-9 shrink-0 items-center justify-center rounded-full border">
        <User size={16} strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{username}</span>
        <span className="text-tinta-fraca block text-xs">Acesso da equipe</span>
      </span>
      <button
        onClick={handleLogout}
        aria-label="Sair"
        className="text-tinta-fraca hover:bg-canvas hover:text-tinta flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
      >
        <LogOut size={16} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

export function Sidebar({ username }: { username: string }) {
  return (
    <aside className="border-linha bg-painel hidden w-60 shrink-0 flex-col border-r lg:flex">
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        <NavLinks />
      </nav>
      <UserFooter username={username} />
    </aside>
  );
}

export function MobileBar({ username }: { username: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-linha bg-painel sticky top-0 z-20 border-b lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Logo />
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          className="text-tinta-media hover:bg-canvas flex h-11 w-11 items-center justify-center rounded-lg"
        >
          {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </button>
      </div>
      {open && (
        <div className="border-linha border-t">
          <nav className="flex flex-col gap-1 p-3">
            <NavLinks onNavigate={() => setOpen(false)} />
          </nav>
          <UserFooter username={username} />
        </div>
      )}
    </div>
  );
}
