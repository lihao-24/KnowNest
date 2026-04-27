"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  isSidebarNavItemActive,
  primaryNavItems,
  settingsNavItem,
  spaceNavItems,
  type SidebarNavItem,
} from "@/components/layout/app-sidebar-nav";

const sidebarLinkBaseClass =
  "block rounded-md px-3 py-2 text-sm font-medium transition";

function SidebarLink({
  isActive,
  item,
}: {
  isActive: boolean;
  item: SidebarNavItem;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={
        isActive
          ? `${sidebarLinkBaseClass} bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-100`
          : `${sidebarLinkBaseClass} text-slate-700 hover:bg-slate-100 hover:text-slate-950`
      }
      href={item.href}
    >
      {item.label}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function isActive(item: SidebarNavItem) {
    return isSidebarNavItemActive(item, pathname, searchParams);
  }

  return (
    <aside className="hidden min-h-dvh w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-5 md:flex md:flex-col">
      <div className="px-2">
        <Link href="/app" className="block">
          <p className="text-lg font-semibold tracking-normal text-slate-950">
            KnowNest
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            知巢个人知识库
          </p>
        </Link>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-7" aria-label="应用导航">
        <div>
          <p className="px-3 text-xs font-medium text-slate-500">知识</p>
          <div className="mt-2 space-y-1">
            {primaryNavItems.map((item) => (
              <SidebarLink
                key={item.href}
                isActive={isActive(item)}
                item={item}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 text-xs font-medium text-slate-500">空间</p>
          <div className="mt-2 space-y-1">
            {spaceNavItems.map((item) => (
              <SidebarLink
                key={item.href}
                isActive={isActive(item)}
                item={item}
              />
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-slate-200 pt-4">
          <SidebarLink
            isActive={isActive(settingsNavItem)}
            item={settingsNavItem}
          />
        </div>
      </nav>
    </aside>
  );
}
