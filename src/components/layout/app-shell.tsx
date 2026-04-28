import type { ReactNode } from "react";
import { Suspense } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col overflow-x-hidden bg-slate-50 text-slate-950 md:flex-row">
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 md:py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
