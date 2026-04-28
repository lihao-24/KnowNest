"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  isSidebarNavItemActive,
  primaryNavItems,
  settingsNavItem,
  spaceNavItems,
  type SidebarNavItem,
} from "@/components/layout/app-sidebar-nav";

import {
  getMobileNavButtonLabel,
  getNextMobileNavOpenState,
} from "./mobile-nav-model";

const mobileNavLinkBaseClass =
  "flex min-h-11 min-w-0 items-center rounded-md px-3 py-2 text-base font-medium transition";

function MobileNavLink({
  isActive,
  item,
  onNavigate,
}: {
  isActive: boolean;
  item: SidebarNavItem;
  onNavigate: () => void;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={
        isActive
          ? `${mobileNavLinkBaseClass} bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-100`
          : `${mobileNavLinkBaseClass} text-slate-700 hover:bg-slate-100 hover:text-slate-950`
      }
      href={item.href}
      onClick={onNavigate}
    >
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

function MobileNavSection({
  isActive,
  items,
  label,
  onNavigate,
}: {
  isActive: (item: SidebarNavItem) => boolean;
  items: SidebarNavItem[];
  label: string;
  onNavigate: () => void;
}) {
  return (
    <div>
      <p className="px-3 text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <MobileNavLink
            isActive={isActive(item)}
            item={item}
            key={item.href}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  function isActive(item: SidebarNavItem) {
    return isSidebarNavItemActive(item, pathname, searchParams);
  }

  function closeNav() {
    setIsOpen((currentState) =>
      getNextMobileNavOpenState(currentState, "close"),
    );
  }

  return (
    <div className="md:hidden">
      <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 text-slate-950">
        <Link className="min-w-0" href="/app">
          <span className="block truncate text-base font-semibold">
            KnowNest
          </span>
          <span className="block truncate text-xs leading-5 text-slate-500">
            知巢个人知识库
          </span>
        </Link>

        <button
          aria-expanded={isOpen}
          aria-label={getMobileNavButtonLabel(isOpen)}
          className="ml-3 inline-flex h-11 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          onClick={() =>
            setIsOpen((currentState) =>
              getNextMobileNavOpenState(currentState, "toggle"),
            )
          }
          type="button"
        >
          {isOpen ? "关闭" : "菜单"}
        </button>
      </header>

      {isOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="关闭导航"
            className="absolute inset-0 bg-slate-950/30"
            onClick={closeNav}
            type="button"
          />

          <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,calc(100vw-2rem))] min-w-0 flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 py-5 shadow-xl">
            <div className="flex items-start justify-between gap-3 px-2">
              <Link className="min-w-0" href="/app" onClick={closeNav}>
                <span className="block truncate text-lg font-semibold text-slate-950">
                  KnowNest
                </span>
                <span className="mt-1 block truncate text-xs leading-5 text-slate-500">
                  知巢个人知识库
                </span>
              </Link>
              <button
                aria-label="关闭导航"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                onClick={closeNav}
                type="button"
              >
                关闭
              </button>
            </div>

            <nav
              aria-label="移动端应用导航"
              className="mt-8 flex min-w-0 flex-1 flex-col gap-7"
            >
              <MobileNavSection
                isActive={isActive}
                items={primaryNavItems}
                label="知识"
                onNavigate={closeNav}
              />

              <MobileNavSection
                isActive={isActive}
                items={spaceNavItems}
                label="空间"
                onNavigate={closeNav}
              />

              <div className="mt-auto border-t border-slate-200 pt-4">
                <MobileNavLink
                  isActive={isActive(settingsNavItem)}
                  item={settingsNavItem}
                  onNavigate={closeNav}
                />
              </div>
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
