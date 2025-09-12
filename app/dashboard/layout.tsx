'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Contenu principal */}
      <div
        className={`flex flex-col flex-1 transition-all duration-200 ${
          isSidebarOpen ? 'ml-48' : 'ml-16'
        }`}
      >
        {/* Navbar alignée avec la sidebar */}
        <Navbar isOpen={isSidebarOpen} />

        {/* Contenu principal */}
        <main className="flex-1 p-4 md:p-0 bg-slate-50 dark:bg-slate-950 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}