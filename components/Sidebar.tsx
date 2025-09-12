'use client';

import {
  LayoutDashboard,
  Users,
  Truck,
  Banknote,
  Briefcase,
  Building2,
  HelpCircle,
  Map,
  Menu,
  FolderKanban,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';   // ✅ ajout
import clsx from 'clsx';
import { usePathname } from 'next/navigation';

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  isOpen: boolean;
  active?: boolean;
}

function SidebarLink({ icon, label, href = '#', isOpen, active = false }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 text-sm rounded-xl p-2 transition-colors duration-200 relative group",
        active
          ? "bg-emerald-100 text-emerald-700"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      )}
    >
      {icon}
      {isOpen && <span className="truncate">{label}</span>}

      {!isOpen && (
        <span className="absolute left-full ml-2 bg-slate-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
          {label}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 h-screen z-50 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between transition-all duration-300',
        isOpen ? 'w-48' : 'w-16'
      )}
    >
      <div>
        {/* Logo + Bouton Toggle */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
          {isOpen ? (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo.png"     // ✅ chemin public/logo.png
                alt="Logo"
                width={50}          // largeur fixe
                height={32}         // hauteur fixe
                className="rounded-xl"
              />
            </Link>
          ) : (
            <Link href="/dashboard">
              <Image
                src="/logo.png"
                alt="Logo"
                width={0}
                height={0}
                className="rounded-xl"
              />
            </Link>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Basculer la sidebar"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-1">
          <SidebarLink
            icon={<LayoutDashboard size={20} />}
            label="Tableau de bord"
            href="/dashboard"
            isOpen={isOpen}
            active={pathname === '/dashboard'}
          />
          <SidebarLink
            icon={<FolderKanban size={20} />}
            label="Marchés"
            href="/dashboard/marches"
            isOpen={isOpen}
            active={pathname.startsWith('/dashboard/marches')}
          />
          <SidebarLink
            icon={<Users size={20} />}
            label="RH"
            href="/dashboard/rh"
            isOpen={isOpen}
            active={pathname.startsWith('/dashboard/rh')}
          />
          <SidebarLink
            icon={<Truck size={20} />}
            label="Logistique"
            href="/dashboard/logistique"
            isOpen={isOpen}
            active={pathname.startsWith('/dashboard/logistique')}
          />
          <SidebarLink
            icon={<Banknote size={20} />}
            label="Finance"
            href="/dashboard/finance"
            isOpen={isOpen}
            active={pathname.startsWith('/dashboard/finance')}
          />
          <SidebarLink
            icon={<Briefcase size={20} />}
            label="CSC"
            href="/dashboard/csc"
            isOpen={isOpen}
            active={pathname.startsWith('/dashboard/csc')}
          />
          <SidebarLink
            icon={<Building2 size={20} />}
            label="BO"
            href="/dashboard/bo"
            isOpen={isOpen}
            active={pathname.startsWith('/dashboard/bo')}
          />
          <SidebarLink
            icon={<Map size={20} />}
            label="Carte"
            href="/dashboard/map"
            isOpen={isOpen}
            active={pathname.startsWith('/dashboard/map')}
          />
        </nav>
      </div>

      {/* Bas du menu */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white w-full">
          <HelpCircle size={18} />
          {isOpen && <span>Besoin d&apos;aide ?</span>}
        </button>
      </div>
    </aside>
  );
}
